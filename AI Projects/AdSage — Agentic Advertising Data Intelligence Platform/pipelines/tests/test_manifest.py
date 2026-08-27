from __future__ import annotations

from pathlib import Path

import pytest

from adsage_pipelines.manifest import CatalogPointer, resolve_pointer_version, utc_now


def test_catalog_pointer_cannot_escape_immutable_versions_root(tmp_path: Path) -> None:
    layer_root = tmp_path / "gold"
    outside = tmp_path / "outside"
    outside.mkdir()
    pointer = CatalogPointer(
        pipeline="silver-to-gold",
        run_id="outside",
        version_path="../outside",
        manifest_path="_manifests/outside.json",
        published_at=utc_now(),
    )

    with pytest.raises(OSError, match="escapes"):
        resolve_pointer_version(layer_root, pointer)


def test_catalog_pointer_run_must_match_version_directory(tmp_path: Path) -> None:
    version = tmp_path / "gold" / "versions" / "actual-run"
    version.mkdir(parents=True)
    pointer = CatalogPointer(
        pipeline="silver-to-gold",
        run_id="different-run",
        version_path="versions/actual-run",
        manifest_path="_manifests/different-run.json",
        published_at=utc_now(),
    )

    with pytest.raises(OSError, match="run_id"):
        resolve_pointer_version(tmp_path / "gold", pointer)
