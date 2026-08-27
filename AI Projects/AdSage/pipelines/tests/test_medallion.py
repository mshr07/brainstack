from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest
from pyspark.sql import SparkSession

from adsage_pipelines.config import GenerationConfig, QualityConfig
from adsage_pipelines.duckdb_checks import validate_current_gold
from adsage_pipelines.generator import generate_bronze
from adsage_pipelines.gold import run_gold
from adsage_pipelines.manifest import read_pointer
from adsage_pipelines.quality import DataQualityError
from adsage_pipelines.silver import run_silver

pytestmark = pytest.mark.spark


def _generation(schema_version: int = 2) -> GenerationConfig:
    return GenerationConfig(
        seed=42,
        days=2,
        impressions_per_day=30,
        click_probability=Decimal("0.55"),
        conversion_probability=Decimal("0.35"),
        duplicate_probability=Decimal("0.04"),
        late_arrival_probability=Decimal("0.12"),
        beyond_window_probability=Decimal("0.01"),
        invalid_probability=Decimal("0.01"),
        schema_version=schema_version,
    )


def test_medallion_flow_handles_evolution_late_data_quarantine_and_reruns(
    spark: SparkSession, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.chdir(tmp_path)
    lake_root = Path("relative-lake")
    generate_bronze(_generation(schema_version=1), lake_root)
    generate_bronze(_generation(schema_version=2), lake_root)
    quality = QualityConfig(max_quarantine_rate=Decimal("0.10"), correction_window_days=7)

    silver = run_silver(spark, lake_root, quality)
    assert silver.quality.passed is True
    assert silver.quality.duplicate_rows > 0
    assert silver.quality.late_rows > 0
    assert silver.quality.quarantine_rows > 0
    assert "LATE_BEYOND_CORRECTION_WINDOW" in silver.quality.quarantine_by_reason
    assert "UNKNOWN_CAMPAIGN" in silver.quality.quarantine_by_reason
    assert run_silver(spark, lake_root, quality).skipped is True
    (lake_root / "silver" / "_current.json").unlink()
    assert run_silver(spark, lake_root, quality).skipped is True
    assert read_pointer(lake_root / "silver").run_id == silver.run_id

    gold = run_gold(spark, lake_root, quality)
    assert gold.quality.passed is True
    assert run_gold(spark, lake_root, quality).skipped is True
    (lake_root / "gold" / "_current.json").unlink()
    assert run_gold(spark, lake_root, quality).skipped is True
    validation = validate_current_gold(lake_root)
    assert validation.passed is True
    assert validation.row_count > 0
    assert read_pointer(lake_root / "silver").run_id == silver.run_id
    assert read_pointer(lake_root / "gold").run_id == gold.run_id


def test_failed_quality_gate_does_not_publish(spark: SparkSession, tmp_path: Path) -> None:
    generate_bronze(_generation(), tmp_path)
    quality = QualityConfig(max_quarantine_rate=Decimal("0"), correction_window_days=7)

    with pytest.raises(DataQualityError) as raised:
        run_silver(spark, tmp_path, quality)

    assert raised.value.quality.quarantine_rows > 0
    assert not (tmp_path / "silver" / "_current.json").exists()
