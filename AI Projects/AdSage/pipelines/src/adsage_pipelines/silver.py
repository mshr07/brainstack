"""Bronze-to-Silver validation, normalization, correction, and quarantine."""

from __future__ import annotations

import os
from collections.abc import Sequence
from decimal import Decimal
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict
from pyspark.sql import Column, DataFrame, SparkSession, Window
from pyspark.sql import functions as F
from pyspark.sql.types import DecimalType

from adsage_pipelines.config import QualityConfig
from adsage_pipelines.generator import committed_bronze_files
from adsage_pipelines.manifest import (
    PipelineManifest,
    QualityResult,
    atomic_write_json,
    compute_run_id,
    publish_staged_version,
    read_manifest,
    restore_missing_pointer,
    snapshot_files,
    utc_now,
)
from adsage_pipelines.quality import DataQualityError
from adsage_pipelines.schemas import DIMENSION_DATASETS, EVENT_DATASETS, validate_parquet_files

SILVER_PIPELINE_VERSION = "2.0.0"
SILVER_SCHEMA_VERSION = 1
DIMENSION_KEYS = {
    "advertisers": "advertiser_id",
    "campaigns": "campaign_id",
    "ad_groups": "ad_group_id",
    "ads": "ad_id",
    "products": "product_id",
    "keywords": "keyword_id",
    "audiences": "audience_id",
    "placements": "placement_id",
    "experiments": "experiment_id",
}
EVENT_TYPES = {
    "impression_events": "IMPRESSION",
    "click_events": "CLICK",
    "conversion_events": "CONVERSION",
    "attribution_events": "ATTRIBUTION",
    "spend_events": "SPEND",
}


class PipelineRunResult(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    run_id: str
    version_path: Path
    manifest_path: Path
    quality: QualityResult
    skipped: bool


def _read_parquet(spark: SparkSession, files: Sequence[Path]) -> DataFrame:
    if not files:
        raise FileNotFoundError("a required committed Bronze dataset is empty")
    return spark.read.option("mergeSchema", "true").parquet(*(str(path) for path in files))


def _deduplicate_dimension(frame: DataFrame, key: str) -> DataFrame:
    window = Window.partitionBy("tenant_id", key).orderBy(
        F.col("snapshot_date").desc(),
        F.col("schema_version").desc(),
        F.col("source_batch").desc(),
    )
    return (
        frame.withColumn("_row_number", F.row_number().over(window))
        .where(F.col("_row_number") == 1)
        .drop("_row_number")
    )


def _read_dimensions(spark: SparkSession, bronze: dict[str, list[Path]]) -> dict[str, DataFrame]:
    dimensions: dict[str, DataFrame] = {}
    for dataset in DIMENSION_DATASETS:
        files = bronze[dataset]
        validate_parquet_files(dataset, files)
        dimensions[dataset] = _deduplicate_dimension(
            _read_parquet(spark, files), DIMENSION_KEYS[dataset]
        ).cache()
    return dimensions


def _read_events(spark: SparkSession, bronze: dict[str, list[Path]]) -> DataFrame:
    frames: list[DataFrame] = []
    for dataset in EVENT_DATASETS:
        files = bronze[dataset]
        validate_parquet_files(dataset, files)
        frame = _read_parquet(spark, files).withColumn("event_type", F.lit(EVENT_TYPES[dataset]))
        frames.append(frame)
    combined = frames[0]
    for frame in frames[1:]:
        combined = combined.unionByName(frame, allowMissingColumns=True)
    return combined


def _join_reference(
    events: DataFrame,
    dimension: DataFrame,
    keys: Sequence[str],
    exists_column: str,
    extra_columns: Sequence[str] = (),
) -> DataFrame:
    reference = dimension.select(
        *(F.col(key) for key in keys),
        *(F.col(name).alias(f"_{name}") for name in extra_columns),
    ).dropDuplicates(list(keys))
    reference = reference.withColumn(exists_column, F.lit(True))
    return events.join(F.broadcast(reference), list(keys), "left")


def _join_parent(
    events: DataFrame,
    event_type: str,
    child_column: str,
    exists_column: str,
) -> DataFrame:
    parents = (
        events.where(F.col("event_type") == event_type)
        .select("tenant_id", F.col("event_id").alias(child_column))
        .dropDuplicates()
        .withColumn(exists_column, F.lit(True))
    )
    return events.join(F.broadcast(parents), ["tenant_id", child_column], "left")


def _reason_expression(correction_window_days: int) -> Column:
    age_seconds = F.unix_timestamp("ingested_at") - F.unix_timestamp("event_time")
    expected_date = F.expr("to_date(from_utc_timestamp(event_time, _timezone))")
    return (
        F.when(
            F.col("event_id").isNull()
            | F.col("tenant_id").isNull()
            | F.col("event_time").isNull()
            | F.col("ingested_at").isNull(),
            F.lit("MISSING_REQUIRED_FIELD"),
        )
        .when(F.col("source_is_synthetic") != F.lit(True), F.lit("NON_SYNTHETIC_INPUT"))
        .when(age_seconds < 0, F.lit("INGESTED_BEFORE_EVENT"))
        .when(
            age_seconds > F.lit(correction_window_days * 86_400),
            F.lit("LATE_BEYOND_CORRECTION_WINDOW"),
        )
        .when(F.col("_advertiser_exists").isNull(), F.lit("UNKNOWN_ADVERTISER"))
        .when(F.col("event_date") != expected_date, F.lit("INVALID_BUSINESS_DATE"))
        .when(F.col("_campaign_exists").isNull(), F.lit("UNKNOWN_CAMPAIGN"))
        .when(F.col("_ad_group_exists").isNull(), F.lit("UNKNOWN_AD_GROUP"))
        .when(F.col("_ad_exists").isNull(), F.lit("UNKNOWN_AD"))
        .when(F.col("_product_exists").isNull(), F.lit("UNKNOWN_PRODUCT"))
        .when(
            F.col("keyword_id").isNotNull() & F.col("_keyword_exists").isNull(),
            F.lit("UNKNOWN_KEYWORD"),
        )
        .when(F.col("_audience_exists").isNull(), F.lit("UNKNOWN_AUDIENCE"))
        .when(F.col("_placement_exists").isNull(), F.lit("UNKNOWN_PLACEMENT"))
        .when(
            F.col("experiment_id").isNotNull() & F.col("_experiment_exists").isNull(),
            F.lit("UNKNOWN_EXPERIMENT"),
        )
        .when(
            F.col("event_type").isin("CLICK", "SPEND")
            & F.col("_impression_parent_exists").isNull(),
            F.lit("UNKNOWN_IMPRESSION_PARENT"),
        )
        .when(
            (F.col("event_type") == "CONVERSION") & F.col("_click_parent_exists").isNull(),
            F.lit("UNKNOWN_CLICK_PARENT"),
        )
        .when(
            (F.col("event_type") == "ATTRIBUTION") & F.col("_conversion_parent_exists").isNull(),
            F.lit("UNKNOWN_CONVERSION_PARENT"),
        )
        .when(
            (F.col("event_type") == "SPEND")
            & (F.col("advertising_spend").isNull() | (F.col("advertising_spend") < 0)),
            F.lit("INVALID_SPEND"),
        )
        .when(
            (F.col("event_type") == "CONVERSION")
            & (F.col("conversion_value").isNull() | (F.col("conversion_value") < 0)),
            F.lit("INVALID_CONVERSION_VALUE"),
        )
        .when(
            (F.col("event_type") == "ATTRIBUTION")
            & (
                F.col("attributed_conversions").isNull()
                | (F.col("attributed_conversions") < 0)
                | (F.col("attributed_conversions") > 1)
                | F.col("attributed_sales").isNull()
                | (F.col("attributed_sales") < 0)
            ),
            F.lit("INVALID_ATTRIBUTION"),
        )
        .when(
            F.col("currency").isNotNull() & (F.col("currency") != F.col("_currency")),
            F.lit("CURRENCY_MISMATCH"),
        )
    )


def _validate_and_normalize(
    events: DataFrame,
    dimensions: dict[str, DataFrame],
    quality_config: QualityConfig,
) -> tuple[DataFrame, DataFrame, int, int]:
    input_rows = events.count()
    window = Window.partitionBy("tenant_id", "event_type", "event_id").orderBy(
        F.col("ingested_at").desc(), F.col("source_batch").desc()
    )
    events = events.withColumn("_row_number", F.row_number().over(window))
    duplicate_rows = events.where(F.col("_row_number") > 1).count()
    events = events.where(F.col("_row_number") == 1).drop("_row_number")

    events = _join_reference(
        events,
        dimensions["advertisers"],
        ["tenant_id", "advertiser_id"],
        "_advertiser_exists",
        ["timezone", "currency"],
    )
    events = _join_reference(
        events,
        dimensions["campaigns"],
        ["tenant_id", "advertiser_id", "campaign_id"],
        "_campaign_exists",
    )
    events = _join_reference(
        events,
        dimensions["ad_groups"],
        ["tenant_id", "campaign_id", "ad_group_id"],
        "_ad_group_exists",
    )
    events = _join_reference(
        events,
        dimensions["ads"],
        ["tenant_id", "ad_group_id", "ad_id"],
        "_ad_exists",
    )
    events = _join_reference(
        events,
        dimensions["products"],
        ["tenant_id", "campaign_id", "product_id"],
        "_product_exists",
    )
    events = _join_reference(
        events,
        dimensions["keywords"],
        ["tenant_id", "ad_group_id", "keyword_id"],
        "_keyword_exists",
    )
    events = _join_reference(
        events,
        dimensions["audiences"],
        ["tenant_id", "campaign_id", "audience_id"],
        "_audience_exists",
    )
    events = _join_reference(
        events,
        dimensions["placements"],
        ["tenant_id", "placement_id"],
        "_placement_exists",
    )
    events = _join_reference(
        events,
        dimensions["experiments"],
        ["tenant_id", "campaign_id", "experiment_id"],
        "_experiment_exists",
    )
    events = _join_parent(events, "IMPRESSION", "parent_impression_id", "_impression_parent_exists")
    events = _join_parent(events, "CLICK", "parent_click_id", "_click_parent_exists")
    events = _join_parent(events, "CONVERSION", "parent_conversion_id", "_conversion_parent_exists")

    age_seconds = F.unix_timestamp("ingested_at") - F.unix_timestamp("event_time")
    zero_decimal = F.lit(Decimal("0.000000")).cast(DecimalType(18, 6))
    events = (
        events.withColumn("reason_code", _reason_expression(quality_config.correction_window_days))
        .withColumn("metric_date", F.col("event_date"))
        .withColumn("is_late", age_seconds > F.lit(86_400))
        .withColumn("currency", F.coalesce("currency", "_currency"))
        .withColumn(
            "impressions", F.when(F.col("event_type") == "IMPRESSION", F.lit(1)).otherwise(0)
        )
        .withColumn("clicks", F.when(F.col("event_type") == "CLICK", F.lit(1)).otherwise(0))
        .withColumn("advertising_spend", F.coalesce("advertising_spend", zero_decimal))
        .withColumn("attributed_conversions", F.coalesce("attributed_conversions", zero_decimal))
        .withColumn("attributed_sales", F.coalesce("attributed_sales", zero_decimal))
        .withColumn("pipeline_schema_version", F.lit(SILVER_SCHEMA_VERSION))
    )
    internal_columns = [name for name in events.columns if name.startswith("_")]
    events = events.drop(*internal_columns)
    accepted = events.where(F.col("reason_code").isNull()).drop("reason_code")
    quarantine = events.where(F.col("reason_code").isNotNull()).withColumn(
        "pipeline_run_id", F.lit("pending")
    )
    return accepted, quarantine, input_rows, duplicate_rows


def _quality_result(
    *,
    accepted: DataFrame,
    quarantine: DataFrame,
    input_rows: int,
    duplicate_rows: int,
    config: QualityConfig,
) -> QualityResult:
    accepted_rows = accepted.count()
    quarantine_rows = quarantine.count()
    late_rows = accepted.where(F.col("is_late")).count()
    reasons = {
        str(row["reason_code"]): int(row["count"])
        for row in quarantine.groupBy("reason_code").count().collect()
    }
    denominator = accepted_rows + quarantine_rows
    quarantine_rate = Decimal(quarantine_rows) / Decimal(denominator) if denominator else Decimal(1)
    passed = (
        accepted_rows >= config.min_accepted_rows and quarantine_rate <= config.max_quarantine_rate
    )
    return QualityResult(
        input_rows=input_rows,
        accepted_rows=accepted_rows,
        quarantine_rows=quarantine_rows,
        duplicate_rows=duplicate_rows,
        late_rows=late_rows,
        quarantine_rate=quarantine_rate,
        quarantine_by_reason=reasons,
        passed=passed,
    )


def run_silver(
    spark: SparkSession,
    lake_root: Path,
    quality_config: QualityConfig,
) -> PipelineRunResult:
    """Create and quality-gate one content-addressed Silver version."""

    lake_root = lake_root.resolve()
    started_at = utc_now()
    bronze = committed_bronze_files(lake_root)
    all_files = [path for files in bronze.values() for path in files]
    inputs = snapshot_files(all_files, lake_root)
    configuration: dict[str, Any] = quality_config.model_dump(mode="json")
    run_id = compute_run_id("bronze-to-silver", SILVER_PIPELINE_VERSION, configuration, inputs)
    layer_root = lake_root / "silver"
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

    dimensions = _read_dimensions(spark, bronze)
    raw_events = _read_events(spark, bronze)
    accepted, quarantine, input_rows, duplicate_rows = _validate_and_normalize(
        raw_events, dimensions, quality_config
    )
    quality = _quality_result(
        accepted=accepted,
        quarantine=quarantine,
        input_rows=input_rows,
        duplicate_rows=duplicate_rows,
        config=quality_config,
    )
    partitions = tuple(
        sorted(
            str(row["metric_date"]) for row in accepted.select("metric_date").distinct().collect()
        )
    )
    completed_at = utc_now()
    manifest = PipelineManifest(
        run_id=run_id,
        pipeline="bronze-to-silver",
        pipeline_version=SILVER_PIPELINE_VERSION,
        schema_version=SILVER_SCHEMA_VERSION,
        status="COMPLETED" if quality.passed else "FAILED",
        started_at=started_at,
        completed_at=completed_at,
        inputs=inputs,
        output_version=f"versions/{run_id}" if quality.passed else None,
        output_partitions=partitions if quality.passed else (),
        quality=quality,
        configuration=configuration,
        error_code=None if quality.passed else "QUALITY_GATE_FAILED",
    )
    if not quality.passed:
        atomic_write_json(manifest_path, manifest)
        raise DataQualityError(
            "Silver publication blocked by the configured quarantine or row-count gate", quality
        )

    attempt = started_at.strftime("%Y%m%dT%H%M%S%fZ")
    stage = layer_root / "_staging" / f"{run_id}.{os.getpid()}.{attempt}"
    if stage.exists():
        raise FileExistsError(f"staging path already exists: {stage}")
    accepted = accepted.withColumn("pipeline_run_id", F.lit(run_id))
    quarantine = quarantine.drop("pipeline_run_id").withColumn("pipeline_run_id", F.lit(run_id))
    accepted.write.mode("errorifexists").partitionBy("metric_date").parquet(
        str(stage / "campaign_event_facts")
    )
    quarantine.write.mode("errorifexists").partitionBy("reason_code").parquet(
        str(stage / "quarantine" / "campaign_event_facts")
    )
    for dataset, dimension in dimensions.items():
        dimension.write.mode("errorifexists").parquet(str(stage / "dimensions" / dataset))
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
