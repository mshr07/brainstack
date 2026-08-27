from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pyarrow.parquet as pq
import pytest

from adsage_pipelines.config import GenerationConfig
from adsage_pipelines.generator import committed_bronze_files, generate_bronze


def _config() -> GenerationConfig:
    return GenerationConfig(
        seed=7,
        days=1,
        campaigns_per_advertiser=2,
        impressions_per_day=16,
        click_probability=Decimal("0.8"),
        conversion_probability=Decimal("0.6"),
        duplicate_probability=Decimal("0.1"),
        late_arrival_probability=Decimal("0.2"),
        beyond_window_probability=Decimal("0.01"),
        invalid_probability=Decimal("0.01"),
    )


def _logical_rows(root: Path) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for dataset, files in committed_bronze_files(root).items():
        rows = []
        for path in files:
            rows.extend(repr(row) for row in pq.ParquetFile(path).read().to_pylist())
        result[dataset] = sorted(rows)
    return result


def test_generation_is_deterministic_committed_and_idempotent(tmp_path: Path) -> None:
    first_root = tmp_path / "first"
    second_root = tmp_path / "second"
    first = generate_bronze(_config(), first_root)
    second = generate_bronze(_config(), second_root)

    assert first.dataset_rows == second.dataset_rows
    assert _logical_rows(first_root) == _logical_rows(second_root)
    assert first.dataset_rows["impression_events"] > _config().impressions_per_day
    assert first.dataset_rows["click_events"] > 0
    assert first.dataset_rows["attribution_events"] > 0

    rerun = generate_bronze(_config(), first_root)
    assert rerun.skipped is True
    assert rerun.source_batch == first.source_batch


def test_committed_reader_detects_object_tampering(tmp_path: Path) -> None:
    generate_bronze(_config(), tmp_path)
    object_path = next((tmp_path / "bronze" / "impression_events").rglob("*.parquet"))
    object_path.write_bytes(object_path.read_bytes() + b"tampered")

    with pytest.raises(OSError, match="changed size"):
        committed_bronze_files(tmp_path)


def test_committed_reader_supports_validated_relative_lake_root(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.chdir(tmp_path)
    relative_root = Path("relative-lake")
    generate_bronze(_config(), relative_root)

    files = committed_bronze_files(relative_root)

    assert files["impression_events"]
