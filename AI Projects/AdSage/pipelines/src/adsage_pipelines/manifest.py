"""Content-addressed run manifests and atomic local publication."""

from __future__ import annotations

import hashlib
import json
import os
from collections.abc import Iterable, Mapping
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ManifestModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class InputObject(ManifestModel):
    path: str
    size_bytes: int
    sha256: str


class QualityResult(ManifestModel):
    input_rows: int
    accepted_rows: int
    quarantine_rows: int
    duplicate_rows: int = 0
    late_rows: int = 0
    quarantine_rate: Decimal = Decimal(0)
    quarantine_by_reason: dict[str, int] = Field(default_factory=dict)
    passed: bool


class PipelineManifest(ManifestModel):
    manifest_version: Literal[1] = 1
    run_id: str
    pipeline: str
    pipeline_version: str
    schema_version: int
    status: Literal["COMPLETED", "FAILED"]
    started_at: datetime
    completed_at: datetime
    inputs: tuple[InputObject, ...]
    output_objects: tuple[InputObject, ...] = ()
    output_version: str | None
    output_partitions: tuple[str, ...]
    quality: QualityResult
    configuration: dict[str, Any]
    error_code: str | None = None


class CatalogPointer(ManifestModel):
    pointer_version: Literal[1] = 1
    pipeline: str
    run_id: str
    version_path: str
    manifest_path: str
    published_at: datetime


def utc_now() -> datetime:
    return datetime.now(UTC)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def snapshot_files(files: Iterable[Path], base: Path) -> tuple[InputObject, ...]:
    objects = []
    base_resolved = base.resolve()
    for path in sorted(files):
        resolved = path.resolve()
        objects.append(
            InputObject(
                path=resolved.relative_to(base_resolved).as_posix(),
                size_bytes=resolved.stat().st_size,
                sha256=sha256_file(resolved),
            )
        )
    return tuple(objects)


def compute_run_id(
    pipeline: str,
    pipeline_version: str,
    configuration: Mapping[str, Any],
    inputs: tuple[InputObject, ...],
) -> str:
    payload = {
        "pipeline": pipeline,
        "pipeline_version": pipeline_version,
        "configuration": configuration,
        "inputs": [item.model_dump(mode="json") for item in inputs],
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()[:24]


def atomic_write_json(path: Path, value: BaseModel | Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = value.model_dump(mode="json") if isinstance(value, BaseModel) else value
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    temporary.replace(path)


def read_manifest(path: Path) -> PipelineManifest:
    return PipelineManifest.model_validate_json(path.read_text(encoding="utf-8"))


def read_pointer(layer_root: Path) -> CatalogPointer:
    path = layer_root / "_current.json"
    if not path.is_file():
        raise FileNotFoundError(f"no published version for {layer_root}")
    return CatalogPointer.model_validate_json(path.read_text(encoding="utf-8"))


def resolve_pointer_version(layer_root: Path, pointer: CatalogPointer) -> Path:
    """Resolve a catalog pointer without permitting path traversal or run mismatch."""

    versions_root = (layer_root / "versions").resolve()
    version = (layer_root / pointer.version_path).resolve()
    try:
        version.relative_to(versions_root)
    except ValueError as error:
        raise OSError(
            f"catalog pointer escapes the versions root: {pointer.version_path}"
        ) from error
    if version.name != pointer.run_id:
        raise OSError("catalog pointer run_id does not match its version path")
    if not version.is_dir():
        raise FileNotFoundError(f"catalog pointer version is unavailable: {version}")
    return version


def publish_staged_version(
    *,
    layer_root: Path,
    stage: Path,
    run_id: str,
    manifest: PipelineManifest,
) -> CatalogPointer:
    """Publish immutable output before atomically advancing the catalog pointer."""

    layer_root = layer_root.resolve()
    stage = stage.resolve()
    try:
        stage.relative_to((layer_root / "_staging").resolve())
    except ValueError as error:
        raise OSError(f"staging path escapes the layer root: {stage}") from error
    if manifest.status != "COMPLETED" or manifest.run_id != run_id:
        raise ValueError("only the matching completed manifest can publish a version")
    if manifest.output_version != f"versions/{run_id}":
        raise ValueError("manifest output_version does not match the immutable run version")
    version = layer_root / "versions" / run_id
    manifest_path = layer_root / "_manifests" / f"{run_id}.json"
    version.parent.mkdir(parents=True, exist_ok=True)
    if version.exists() and not manifest_path.is_file():
        raise FileExistsError(f"untracked immutable output version exists: {version}")
    # The catalog pointer is the visibility boundary. Recording the manifest
    # first makes a crash recoverable without exposing an incomplete version.
    atomic_write_json(manifest_path, manifest)
    if not version.exists():
        stage.replace(version)
    pointer = CatalogPointer(
        pipeline=manifest.pipeline,
        run_id=run_id,
        version_path=version.relative_to(layer_root).as_posix(),
        manifest_path=manifest_path.relative_to(layer_root).as_posix(),
        published_at=manifest.completed_at,
    )
    atomic_write_json(layer_root / "_current.json", pointer)
    return pointer


def restore_missing_pointer(layer_root: Path, manifest: PipelineManifest) -> None:
    """Repair the narrow crash window after version publish but before pointer publish."""

    pointer_path = layer_root / "_current.json"
    if pointer_path.exists():
        return
    if manifest.status != "COMPLETED" or manifest.output_version is None:
        raise ValueError("only a completed output version can restore a catalog pointer")
    version = (layer_root / manifest.output_version).resolve()
    try:
        version.relative_to((layer_root / "versions").resolve())
    except ValueError as error:
        raise OSError("manifest output version escapes the versions root") from error
    if version.name != manifest.run_id:
        raise OSError("manifest run_id does not match its output version")
    manifest_path = layer_root / "_manifests" / f"{manifest.run_id}.json"
    if not version.is_dir() or not manifest_path.is_file():
        raise FileNotFoundError("completed manifest output is unavailable for pointer recovery")
    atomic_write_json(
        pointer_path,
        CatalogPointer(
            pipeline=manifest.pipeline,
            run_id=manifest.run_id,
            version_path=version.relative_to(layer_root).as_posix(),
            manifest_path=manifest_path.relative_to(layer_root).as_posix(),
            published_at=manifest.completed_at,
        ),
    )
