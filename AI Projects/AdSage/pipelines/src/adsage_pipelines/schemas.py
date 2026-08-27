"""Versioned Bronze contracts and schema-evolution policy."""

from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path

import pyarrow as pa  # type: ignore[import-untyped]
import pyarrow.parquet as pq  # type: ignore[import-untyped]

SUPPORTED_SCHEMA_VERSIONS = frozenset({1, 2})
DIMENSION_DATASETS = (
    "advertisers",
    "campaigns",
    "ad_groups",
    "ads",
    "products",
    "keywords",
    "audiences",
    "placements",
    "experiments",
)
EVENT_DATASETS = (
    "impression_events",
    "click_events",
    "conversion_events",
    "attribution_events",
    "spend_events",
)
BRONZE_DATASETS = DIMENSION_DATASETS + EVENT_DATASETS

MONEY_TYPE = pa.decimal128(18, 6)
COUNT_TYPE = pa.decimal128(18, 6)
UTC_TIMESTAMP = pa.timestamp("us", tz="UTC")


class SchemaEvolutionError(ValueError):
    """Raised when Bronze input is not a backward-compatible schema change."""


def _field(name: str, data_type: pa.DataType, *, nullable: bool = False) -> pa.Field:
    return pa.field(name, data_type, nullable=nullable)


def _dimension_base() -> list[pa.Field]:
    return [
        _field("tenant_id", pa.string()),
        _field("snapshot_date", pa.date32()),
        _field("schema_version", pa.int16()),
        _field("source_batch", pa.string()),
        _field("source_is_synthetic", pa.bool_()),
    ]


def dimension_schema(dataset: str) -> pa.Schema:
    fields: dict[str, list[pa.Field]] = {
        "advertisers": [
            _field("advertiser_id", pa.string()),
            _field("advertiser_name", pa.string()),
            _field("timezone", pa.string()),
            _field("currency", pa.string()),
        ],
        "campaigns": [
            _field("campaign_id", pa.string()),
            _field("advertiser_id", pa.string()),
            _field("campaign_name", pa.string()),
            _field("objective", pa.string()),
            _field("status", pa.string()),
        ],
        "ad_groups": [
            _field("ad_group_id", pa.string()),
            _field("campaign_id", pa.string()),
            _field("ad_group_name", pa.string()),
        ],
        "ads": [
            _field("ad_id", pa.string()),
            _field("ad_group_id", pa.string()),
            _field("ad_name", pa.string()),
            _field("creative_format", pa.string()),
        ],
        "products": [
            _field("product_id", pa.string()),
            _field("campaign_id", pa.string()),
            _field("product_name", pa.string()),
            _field("category", pa.string()),
        ],
        "keywords": [
            _field("keyword_id", pa.string()),
            _field("ad_group_id", pa.string()),
            _field("keyword_text", pa.string()),
            _field("match_type", pa.string()),
        ],
        "audiences": [
            _field("audience_id", pa.string()),
            _field("campaign_id", pa.string()),
            _field("audience_name", pa.string()),
        ],
        "placements": [
            _field("placement_id", pa.string()),
            _field("placement_name", pa.string()),
            _field("channel", pa.string()),
        ],
        "experiments": [
            _field("experiment_id", pa.string()),
            _field("campaign_id", pa.string()),
            _field("experiment_name", pa.string()),
            _field("variant", pa.string()),
        ],
    }
    try:
        return pa.schema(fields[dataset] + _dimension_base())
    except KeyError as error:
        raise ValueError(f"unknown dimension dataset: {dataset}") from error


def _event_base(version: int) -> list[pa.Field]:
    fields = [
        _field("event_id", pa.string()),
        _field("tenant_id", pa.string()),
        _field("event_time", UTC_TIMESTAMP),
        _field("ingested_at", UTC_TIMESTAMP),
        _field("event_date", pa.date32()),
        _field("ingestion_hour", pa.string()),
        _field("schema_version", pa.int16()),
        _field("attribution_version", pa.string()),
        _field("source_batch", pa.string()),
        _field("source_is_synthetic", pa.bool_()),
        _field("advertiser_id", pa.string()),
        _field("campaign_id", pa.string()),
        _field("ad_group_id", pa.string()),
        _field("ad_id", pa.string()),
        _field("product_id", pa.string()),
        _field("keyword_id", pa.string(), nullable=True),
        _field("audience_id", pa.string()),
        _field("placement_id", pa.string()),
        _field("experiment_id", pa.string(), nullable=True),
        _field("country_code", pa.string()),
        _field("device_type", pa.string()),
    ]
    if version >= 2:
        fields.append(_field("device_os", pa.string(), nullable=True))
    return fields


def event_schema(dataset: str, version: int) -> pa.Schema:
    if version not in SUPPORTED_SCHEMA_VERSIONS:
        raise SchemaEvolutionError(f"unsupported schema version: {version}")
    payloads: dict[str, list[pa.Field]] = {
        "impression_events": [_field("viewable", pa.bool_())],
        "click_events": [_field("parent_impression_id", pa.string())],
        "conversion_events": [
            _field("parent_click_id", pa.string()),
            _field("conversion_value", MONEY_TYPE),
            _field("currency", pa.string()),
        ],
        "attribution_events": [
            _field("parent_conversion_id", pa.string()),
            _field("attributed_conversions", COUNT_TYPE),
            _field("attributed_sales", MONEY_TYPE),
            _field("currency", pa.string()),
        ],
        "spend_events": [
            _field("parent_impression_id", pa.string()),
            _field("advertising_spend", MONEY_TYPE),
            _field("currency", pa.string()),
        ],
    }
    try:
        return pa.schema(_event_base(version) + payloads[dataset])
    except KeyError as error:
        raise ValueError(f"unknown event dataset: {dataset}") from error


def expected_schema(dataset: str, version: int) -> pa.Schema:
    if dataset in DIMENSION_DATASETS:
        return dimension_schema(dataset)
    return event_schema(dataset, version)


def validate_arrow_schema(dataset: str, version: int, actual: pa.Schema) -> None:
    """Allow nullable additions but reject removals and type changes."""

    expected = expected_schema(dataset, version)
    actual_by_name = {field.name: field for field in actual}
    expected_by_name = {field.name: field for field in expected}

    missing = [
        field.name for field in expected if not field.nullable and field.name not in actual_by_name
    ]
    if missing:
        raise SchemaEvolutionError(f"{dataset} removed required fields: {sorted(missing)}")

    for name, expected_field in expected_by_name.items():
        actual_field = actual_by_name.get(name)
        if actual_field is not None and actual_field.type != expected_field.type:
            raise SchemaEvolutionError(
                f"{dataset}.{name} changed type from {expected_field.type} to {actual_field.type}"
            )

    incompatible_additions = [
        field.name for field in actual if field.name not in expected_by_name and not field.nullable
    ]
    if incompatible_additions:
        raise SchemaEvolutionError(
            f"{dataset} added non-nullable fields without review: {sorted(incompatible_additions)}"
        )


def validate_parquet_files(dataset: str, files: Iterable[Path]) -> None:
    """Validate every immutable object before Spark merges its schema."""

    for path in files:
        parquet_file = pq.ParquetFile(path)
        schema = parquet_file.schema_arrow
        if "schema_version" not in schema.names:
            raise SchemaEvolutionError(f"{path} has no schema_version")
        versions = (
            parquet_file.read(columns=["schema_version"])["schema_version"].unique().to_pylist()
        )
        if len(versions) != 1 or versions[0] not in SUPPORTED_SCHEMA_VERSIONS:
            raise SchemaEvolutionError(f"{path} has unsupported mixed schema versions: {versions}")
        validate_arrow_schema(dataset, int(versions[0]), schema)
