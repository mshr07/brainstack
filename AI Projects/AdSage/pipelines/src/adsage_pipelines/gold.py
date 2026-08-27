"""Silver-to-Gold canonical campaign daily metrics."""

from __future__ import annotations

import os
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from pyspark.sql import Column, DataFrame, SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import DecimalType

from adsage_pipelines.config import QualityConfig
from adsage_pipelines.duckdb_checks import validate_gold_dataset
from adsage_pipelines.manifest import (
    InputObject,
    PipelineManifest,
    QualityResult,
    atomic_write_json,
    compute_run_id,
    publish_staged_version,
    read_manifest,
    read_pointer,
    resolve_pointer_version,
    restore_missing_pointer,
    snapshot_files,
    utc_now,
)
from adsage_pipelines.quality import DataQualityError
from adsage_pipelines.silver import PipelineRunResult

GOLD_PIPELINE_VERSION = "2.0.0"
GOLD_SCHEMA_VERSION = 1
GRAIN = (
    "tenant_id",
    "metric_date",
    "advertiser_id",
    "campaign_id",
    "country_code",
    "device_type",
    "placement_id",
    "currency",
    "attribution_version",
)


def _ratio(numerator: Column, denominator: Column, multiplier: Decimal = Decimal(1)) -> Column:
    expression = (F.lit(multiplier) * numerator) / denominator
    return F.when(denominator != 0, F.bround(expression, 8).cast(DecimalType(38, 8)))


def _aggregate(facts: DataFrame) -> DataFrame:
    aggregates = facts.groupBy(*GRAIN).agg(
        F.sum("impressions").cast("long").alias("impressions"),
        F.sum("clicks").cast("long").alias("clicks"),
        F.sum("advertising_spend").cast(DecimalType(28, 6)).alias("advertising_spend"),
        F.sum("attributed_conversions").cast(DecimalType(28, 6)).alias("attributed_conversions"),
        F.sum("attributed_sales").cast(DecimalType(28, 6)).alias("attributed_sales"),
        F.max("ingested_at").alias("data_through"),
        F.sum(F.col("is_late").cast("long")).alias("late_event_rows"),
    )
    return (
        aggregates.withColumn("ctr", _ratio(F.col("clicks"), F.col("impressions")))
        .withColumn("cpc", _ratio(F.col("advertising_spend"), F.col("clicks")))
        .withColumn(
            "cpm",
            _ratio(F.col("advertising_spend"), F.col("impressions"), multiplier=Decimal(1000)),
        )
        .withColumn("cvr", _ratio(F.col("attributed_conversions"), F.col("clicks")))
        .withColumn("roas", _ratio(F.col("attributed_sales"), F.col("advertising_spend")))
        .withColumn("acos", _ratio(F.col("advertising_spend"), F.col("attributed_sales")))
        .withColumn("cpa", _ratio(F.col("advertising_spend"), F.col("attributed_conversions")))
        .withColumn("pipeline_schema_version", F.lit(GOLD_SCHEMA_VERSION))
    )


def _spark_quality(facts: DataFrame, metrics: DataFrame, config: QualityConfig) -> QualityResult:
    input_rows = facts.count()
    accepted_rows = metrics.count()
    duplicate_grain = metrics.groupBy(*GRAIN).count().where(F.col("count") > 1).count()
    negative_measures = metrics.where(
        (F.col("impressions") < 0)
        | (F.col("clicks") < 0)
        | (F.col("advertising_spend") < 0)
        | (F.col("attributed_conversions") < 0)
        | (F.col("attributed_sales") < 0)
    ).count()
    null_measures = metrics.where(
        F.col("impressions").isNull()
        | F.col("clicks").isNull()
        | F.col("advertising_spend").isNull()
        | F.col("attributed_conversions").isNull()
        | F.col("attributed_sales").isNull()
    ).count()
    failures = {
        key: value
        for key, value in {
            "DUPLICATE_GRAIN": duplicate_grain,
            "NEGATIVE_ADDITIVE_MEASURE": negative_measures,
            "NULL_ADDITIVE_MEASURE": null_measures,
        }.items()
        if value
    }
    return QualityResult(
        input_rows=input_rows,
        accepted_rows=accepted_rows,
        quarantine_rows=sum(failures.values()),
        quarantine_rate=(
            Decimal(sum(failures.values())) / Decimal(accepted_rows)
            if accepted_rows
            else Decimal(1)
        ),
        late_rows=facts.where(F.col("is_late")).count(),
        quarantine_by_reason=failures,
        passed=accepted_rows >= config.min_accepted_rows and not failures,
    )


def _failed_manifest(
    *,
    run_id: str,
    started_at: datetime,
    inputs: tuple[InputObject, ...],
    quality: QualityResult,
    configuration: dict[str, Any],
) -> PipelineManifest:
    return PipelineManifest(
        run_id=run_id,
        pipeline="silver-to-gold",
        pipeline_version=GOLD_PIPELINE_VERSION,
        schema_version=GOLD_SCHEMA_VERSION,
        status="FAILED",
        started_at=started_at,
        completed_at=utc_now(),
        inputs=inputs,
        output_version=None,
        output_partitions=(),
        quality=quality,
        configuration=configuration,
        error_code="QUALITY_GATE_FAILED",
    )


def run_gold(
    spark: SparkSession,
    lake_root: Path,
    quality_config: QualityConfig,
) -> PipelineRunResult:
    """Create one Gold version and validate canonical formulas before publication."""

    lake_root = lake_root.resolve()
    started_at = utc_now()
    silver_root = lake_root / "silver"
    silver_pointer = read_pointer(silver_root)
    fact_root = resolve_pointer_version(silver_root, silver_pointer) / "campaign_event_facts"
    fact_files = sorted(fact_root.rglob("*.parquet"))
    if not fact_files:
        raise FileNotFoundError(f"no published Silver facts under {fact_root}")
    inputs = snapshot_files(fact_files, lake_root)
    configuration: dict[str, Any] = {
        "quality": quality_config.model_dump(mode="json"),
        "silver_run_id": silver_pointer.run_id,
        "grain": list(GRAIN),
    }
    run_id = compute_run_id("silver-to-gold", GOLD_PIPELINE_VERSION, configuration, inputs)
    layer_root = lake_root / "gold"
    manifest_path = layer_root / "_manifests" / f"{run_id}.json"
    version_path = layer_root / "versions" / run_id
    if manifest_path.is_file() and version_path.is_dir():
        manifest = read_manifest(manifest_path)
        restore_missing_pointer(layer_root, manifest)
        return PipelineRunResult(
            run_id=run_id,
            version_path=version_path,
            manifest_path=manifest_path,
            quality=manifest.quality,
            skipped=True,
        )

    facts = spark.read.option("mergeSchema", "true").parquet(*(str(path) for path in fact_files))
    # Spark does not recover Hive partition columns when handed explicit object paths.
    # The physical event_date is retained so the partition value can be reconstructed.
    if "metric_date" not in facts.columns:
        facts = facts.withColumn("metric_date", F.col("event_date"))
    metrics = _aggregate(facts).cache()
    quality = _spark_quality(facts, metrics, quality_config)
    if not quality.passed:
        manifest = _failed_manifest(
            run_id=run_id,
            started_at=started_at,
            inputs=inputs,
            quality=quality,
            configuration=configuration,
        )
        atomic_write_json(manifest_path, manifest)
        raise DataQualityError(
            "Gold publication blocked by additive-measure quality gates", quality
        )

    attempt = started_at.strftime("%Y%m%dT%H%M%S%fZ")
    stage = layer_root / "_staging" / f"{run_id}.{os.getpid()}.{attempt}"
    if stage.exists():
        raise FileExistsError(f"staging path already exists: {stage}")
    metrics = metrics.withColumn("pipeline_run_id", F.lit(run_id))
    metrics.write.mode("errorifexists").partitionBy("metric_date").parquet(
        str(stage / "campaign_daily_metrics")
    )
    duckdb_result = validate_gold_dataset(stage / "campaign_daily_metrics")
    if not duckdb_result.passed:
        failures = {key: count for key, count in duckdb_result.failures.items() if count}
        quality = QualityResult(
            input_rows=quality.input_rows,
            accepted_rows=quality.accepted_rows,
            quarantine_rows=sum(failures.values()),
            duplicate_rows=quality.duplicate_rows,
            late_rows=quality.late_rows,
            quarantine_rate=(
                Decimal(sum(failures.values())) / Decimal(quality.accepted_rows)
                if quality.accepted_rows
                else Decimal(1)
            ),
            quarantine_by_reason=failures,
            passed=False,
        )
        manifest = _failed_manifest(
            run_id=run_id,
            started_at=started_at,
            inputs=inputs,
            quality=quality,
            configuration=configuration,
        )
        atomic_write_json(manifest_path, manifest)
        atomic_write_json(stage / "quality.json", quality)
        raise DataQualityError("Gold publication blocked by DuckDB formula assertions", quality)

    partitions = tuple(
        sorted(
            str(row["metric_date"]) for row in metrics.select("metric_date").distinct().collect()
        )
    )
    manifest = PipelineManifest(
        run_id=run_id,
        pipeline="silver-to-gold",
        pipeline_version=GOLD_PIPELINE_VERSION,
        schema_version=GOLD_SCHEMA_VERSION,
        status="COMPLETED",
        started_at=started_at,
        completed_at=utc_now(),
        inputs=inputs,
        output_version=f"versions/{run_id}",
        output_partitions=partitions,
        quality=quality,
        configuration=configuration,
    )
    atomic_write_json(stage / "quality.json", quality)
    atomic_write_json(stage / "manifest.json", manifest)
    publish_staged_version(
        layer_root=layer_root,
        stage=stage,
        run_id=run_id,
        manifest=manifest,
    )
    return PipelineRunResult(
        run_id=run_id,
        version_path=version_path,
        manifest_path=manifest_path,
        quality=quality,
        skipped=False,
    )
