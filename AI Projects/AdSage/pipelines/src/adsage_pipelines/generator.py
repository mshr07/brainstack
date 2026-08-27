"""Seeded, deterministic synthetic advertising hierarchy and event generator."""

from __future__ import annotations

import hashlib
import json
import os
import random
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime, time, timedelta
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from typing import Any
from uuid import NAMESPACE_URL, uuid5
from zoneinfo import ZoneInfo

import pyarrow as pa  # type: ignore[import-untyped]
import pyarrow.parquet as pq  # type: ignore[import-untyped]
from pydantic import BaseModel, ConfigDict

from adsage_pipelines.config import GenerationConfig
from adsage_pipelines.manifest import (
    PipelineManifest,
    QualityResult,
    atomic_write_json,
    read_manifest,
    sha256_file,
    snapshot_files,
    utc_now,
)
from adsage_pipelines.schemas import DIMENSION_DATASETS, EVENT_DATASETS, expected_schema

GENERATOR_VERSION = "2.0.0"


class GenerationResult(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    source_batch: str
    manifest_path: Path
    dataset_rows: dict[str, int]
    written_files: int
    skipped: bool


@dataclass(frozen=True)
class ServingUnit:
    advertiser_id: str
    timezone: str
    campaign_id: str
    ad_group_id: str
    ad_id: str
    product_id: str
    keyword_id: str
    audience_id: str
    experiment_id: str


def _stable_id(config: GenerationConfig, kind: str, *parts: object) -> str:
    identity = ":".join(
        [str(config.seed), str(config.tenant_id), kind, *(str(part) for part in parts)]
    )
    return str(uuid5(NAMESPACE_URL, f"adsage.synthetic:{identity}"))


def _source_batch(config: GenerationConfig) -> str:
    encoded = json.dumps(config.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    return f"synthetic-{hashlib.sha256(encoded.encode()).hexdigest()[:20]}"


def _dimension_metadata(config: GenerationConfig, source_batch: str) -> dict[str, Any]:
    return {
        "tenant_id": str(config.tenant_id),
        "snapshot_date": config.start_date,
        "schema_version": config.schema_version,
        "source_batch": source_batch,
        "source_is_synthetic": True,
    }


def _generate_dimensions(
    config: GenerationConfig, source_batch: str
) -> tuple[dict[str, list[dict[str, Any]]], list[ServingUnit], list[str]]:
    rows: dict[str, list[dict[str, Any]]] = {dataset: [] for dataset in DIMENSION_DATASETS}
    serving_units: list[ServingUnit] = []
    placement_ids: list[str] = []
    metadata = _dimension_metadata(config, source_batch)
    timezones = ("America/Los_Angeles", "Europe/London", "Asia/Kolkata")
    objectives = ("SALES", "AWARENESS", "CONSIDERATION")
    formats = ("DISPLAY", "VIDEO", "NATIVE")

    for placement_index, (name, channel) in enumerate(
        (("Search results", "SEARCH"), ("Product detail", "COMMERCE"), ("Publisher", "DISPLAY"))
    ):
        placement_id = _stable_id(config, "placement", placement_index)
        placement_ids.append(placement_id)
        rows["placements"].append(
            {
                "placement_id": placement_id,
                "placement_name": name,
                "channel": channel,
                **metadata,
            }
        )

    for advertiser_index in range(config.advertisers):
        advertiser_id = _stable_id(config, "advertiser", advertiser_index)
        timezone = timezones[advertiser_index % len(timezones)]
        rows["advertisers"].append(
            {
                "advertiser_id": advertiser_id,
                "advertiser_name": f"Synthetic Advertiser {advertiser_index + 1}",
                "timezone": timezone,
                "currency": "USD",
                **metadata,
            }
        )
        for campaign_index in range(config.campaigns_per_advertiser):
            campaign_id = _stable_id(config, "campaign", advertiser_index, campaign_index)
            rows["campaigns"].append(
                {
                    "campaign_id": campaign_id,
                    "advertiser_id": advertiser_id,
                    "campaign_name": f"Campaign {advertiser_index + 1}-{campaign_index + 1}",
                    "objective": objectives[campaign_index % len(objectives)],
                    "status": "ACTIVE",
                    **metadata,
                }
            )
            product_id = _stable_id(config, "product", advertiser_index, campaign_index)
            audience_id = _stable_id(config, "audience", advertiser_index, campaign_index)
            experiment_id = _stable_id(config, "experiment", advertiser_index, campaign_index)
            rows["products"].append(
                {
                    "product_id": product_id,
                    "campaign_id": campaign_id,
                    "product_name": f"Synthetic Product {campaign_index + 1}",
                    "category": ("HOME", "ELECTRONICS", "APPAREL")[campaign_index % 3],
                    **metadata,
                }
            )
            rows["audiences"].append(
                {
                    "audience_id": audience_id,
                    "campaign_id": campaign_id,
                    "audience_name": f"Synthetic Audience {campaign_index + 1}",
                    **metadata,
                }
            )
            rows["experiments"].append(
                {
                    "experiment_id": experiment_id,
                    "campaign_id": campaign_id,
                    "experiment_name": f"Bid Test {campaign_index + 1}",
                    "variant": ("CONTROL", "TREATMENT")[campaign_index % 2],
                    **metadata,
                }
            )
            for ad_group_index in range(config.ad_groups_per_campaign):
                ad_group_id = _stable_id(
                    config, "ad-group", advertiser_index, campaign_index, ad_group_index
                )
                keyword_id = _stable_id(
                    config, "keyword", advertiser_index, campaign_index, ad_group_index
                )
                rows["ad_groups"].append(
                    {
                        "ad_group_id": ad_group_id,
                        "campaign_id": campaign_id,
                        "ad_group_name": (
                            f"Ad Group {advertiser_index + 1}-{campaign_index + 1}-"
                            f"{ad_group_index + 1}"
                        ),
                        **metadata,
                    }
                )
                rows["keywords"].append(
                    {
                        "keyword_id": keyword_id,
                        "ad_group_id": ad_group_id,
                        "keyword_text": (
                            f"synthetic keyword {campaign_index + 1} {ad_group_index + 1}"
                        ),
                        "match_type": ("EXACT", "PHRASE")[ad_group_index % 2],
                        **metadata,
                    }
                )
                for ad_index in range(config.ads_per_ad_group):
                    ad_id = _stable_id(
                        config,
                        "ad",
                        advertiser_index,
                        campaign_index,
                        ad_group_index,
                        ad_index,
                    )
                    rows["ads"].append(
                        {
                            "ad_id": ad_id,
                            "ad_group_id": ad_group_id,
                            "ad_name": (
                                f"Ad {advertiser_index + 1}-{campaign_index + 1}-"
                                f"{ad_group_index + 1}-{ad_index + 1}"
                            ),
                            "creative_format": formats[ad_index % len(formats)],
                            **metadata,
                        }
                    )
                    serving_units.append(
                        ServingUnit(
                            advertiser_id=advertiser_id,
                            timezone=timezone,
                            campaign_id=campaign_id,
                            ad_group_id=ad_group_id,
                            ad_id=ad_id,
                            product_id=product_id,
                            keyword_id=keyword_id,
                            audience_id=audience_id,
                            experiment_id=experiment_id,
                        )
                    )
    return rows, serving_units, placement_ids


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)


def _ingestion_time(
    *,
    event_time: datetime,
    event_index: int,
    rng: random.Random,
    config: GenerationConfig,
) -> datetime:
    if event_index == 3 and config.beyond_window_probability > 0:
        return event_time + timedelta(days=10, minutes=7)
    if event_index == 2 and config.late_arrival_probability > 0:
        return event_time + timedelta(days=2, minutes=7)
    roll = Decimal(str(rng.random()))
    if roll < config.beyond_window_probability:
        return event_time + timedelta(days=10, minutes=rng.randint(1, 59))
    if roll < config.beyond_window_probability + config.late_arrival_probability:
        return event_time + timedelta(days=rng.randint(1, 3), minutes=rng.randint(1, 59))
    return event_time + timedelta(minutes=rng.randint(5, 180))


def _event_base(
    *,
    config: GenerationConfig,
    source_batch: str,
    event_id: str,
    event_time: datetime,
    ingested_at: datetime,
    unit: ServingUnit,
    placement_id: str,
    event_index: int,
) -> dict[str, Any]:
    local_date = event_time.astimezone(ZoneInfo(unit.timezone)).date()
    campaign_id = unit.campaign_id
    if event_index == 0 and config.invalid_probability > 0:
        campaign_id = _stable_id(config, "unknown-campaign")
    row: dict[str, Any] = {
        "event_id": event_id,
        "tenant_id": str(config.tenant_id),
        "event_time": event_time,
        "ingested_at": ingested_at,
        "event_date": local_date,
        "ingestion_hour": ingested_at.strftime("%H"),
        "schema_version": config.schema_version,
        "attribution_version": config.attribution_version,
        "source_batch": source_batch,
        "source_is_synthetic": True,
        "advertiser_id": unit.advertiser_id,
        "campaign_id": campaign_id,
        "ad_group_id": unit.ad_group_id,
        "ad_id": unit.ad_id,
        "product_id": unit.product_id,
        "keyword_id": unit.keyword_id if event_index % 5 else None,
        "audience_id": unit.audience_id,
        "placement_id": placement_id,
        "experiment_id": unit.experiment_id if event_index % 2 else None,
        "country_code": ("US", "GB", "IN")[event_index % 3],
        "device_type": ("DESKTOP", "MOBILE", "TABLET")[event_index % 3],
    }
    if config.schema_version >= 2:
        row["device_os"] = ("OTHER", "IOS", "ANDROID")[event_index % 3]
    return row


def _with_duplicate(
    rows: list[dict[str, Any]], event_index: int, rng: random.Random, config: GenerationConfig
) -> None:
    should_duplicate = event_index == 1 and config.duplicate_probability > 0
    should_duplicate = should_duplicate or Decimal(str(rng.random())) < config.duplicate_probability
    if should_duplicate:
        duplicate = dict(rows[-1])
        duplicate["ingested_at"] = duplicate["ingested_at"] + timedelta(minutes=1)
        duplicate["ingestion_hour"] = duplicate["ingested_at"].strftime("%H")
        rows.append(duplicate)


def _generate_events(
    config: GenerationConfig,
    source_batch: str,
    serving_units: list[ServingUnit],
    placement_ids: list[str],
) -> dict[str, list[dict[str, Any]]]:
    rows: dict[str, list[dict[str, Any]]] = {dataset: [] for dataset in EVENT_DATASETS}
    # Reproducibility is the requirement; this RNG never generates secrets or credentials.
    rng = random.Random(config.seed)  # noqa: S311
    event_index = 0
    for day_offset in range(config.days):
        business_day = config.start_date + timedelta(days=day_offset)
        for daily_index in range(config.impressions_per_day):
            unit = serving_units[event_index % len(serving_units)]
            placement_id = placement_ids[event_index % len(placement_ids)]
            local_seconds = int((daily_index + 0.5) * 86_400 / config.impressions_per_day)
            local_time = datetime.combine(
                business_day, time.min, ZoneInfo(unit.timezone)
            ) + timedelta(seconds=local_seconds)
            impression_time = local_time.astimezone(UTC)
            impression_ingested = _ingestion_time(
                event_time=impression_time, event_index=event_index, rng=rng, config=config
            )
            impression_id = _stable_id(config, "impression", day_offset, daily_index)
            common = _event_base(
                config=config,
                source_batch=source_batch,
                event_id=impression_id,
                event_time=impression_time,
                ingested_at=impression_ingested,
                unit=unit,
                placement_id=placement_id,
                event_index=event_index,
            )
            rows["impression_events"].append({**common, "viewable": event_index % 5 != 0})
            _with_duplicate(rows["impression_events"], event_index, rng, config)

            spend_id = _stable_id(config, "spend", day_offset, daily_index)
            spend = _quantize_money(Decimal("0.008") + Decimal(event_index % 13) / 1000)
            spend_common = {
                **common,
                "event_id": spend_id,
                "event_time": impression_time + timedelta(seconds=1),
                "ingested_at": impression_ingested + timedelta(seconds=2),
            }
            rows["spend_events"].append(
                {
                    **spend_common,
                    "parent_impression_id": impression_id,
                    "advertising_spend": spend,
                    "currency": "USD",
                }
            )
            _with_duplicate(rows["spend_events"], event_index, rng, config)

            clicked = Decimal(str(rng.random())) < config.click_probability
            if clicked:
                click_id = _stable_id(config, "click", day_offset, daily_index)
                click_time = impression_time + timedelta(seconds=10 + event_index % 90)
                click_common = {
                    **common,
                    "event_id": click_id,
                    "event_time": click_time,
                    "event_date": click_time.astimezone(ZoneInfo(unit.timezone)).date(),
                    "ingested_at": max(impression_ingested, click_time + timedelta(minutes=5)),
                }
                click_common["ingestion_hour"] = click_common["ingested_at"].strftime("%H")
                rows["click_events"].append({**click_common, "parent_impression_id": impression_id})
                _with_duplicate(rows["click_events"], event_index, rng, config)

                converted = Decimal(str(rng.random())) < config.conversion_probability
                if converted:
                    conversion_id = _stable_id(config, "conversion", day_offset, daily_index)
                    conversion_time = click_time + timedelta(minutes=5 + event_index % 55)
                    conversion_common = {
                        **common,
                        "event_id": conversion_id,
                        "event_time": conversion_time,
                        "event_date": conversion_time.astimezone(ZoneInfo(unit.timezone)).date(),
                        "ingested_at": max(
                            click_common["ingested_at"], conversion_time + timedelta(minutes=15)
                        ),
                    }
                    conversion_common["ingestion_hour"] = conversion_common["ingested_at"].strftime(
                        "%H"
                    )
                    sale = _quantize_money(Decimal("18") + Decimal(event_index % 40))
                    rows["conversion_events"].append(
                        {
                            **conversion_common,
                            "parent_click_id": click_id,
                            "conversion_value": sale,
                            "currency": "USD",
                        }
                    )
                    attribution_id = _stable_id(config, "attribution", day_offset, daily_index)
                    attribution_ingested_at = conversion_common["ingested_at"] + timedelta(
                        minutes=30
                    )
                    rows["attribution_events"].append(
                        {
                            **conversion_common,
                            "event_id": attribution_id,
                            "ingested_at": attribution_ingested_at,
                            "ingestion_hour": attribution_ingested_at.strftime("%H"),
                            "parent_conversion_id": conversion_id,
                            "attributed_conversions": Decimal("1.000000"),
                            "attributed_sales": sale,
                            "currency": "USD",
                        }
                    )
            event_index += 1
    return rows


def _partition_key(dataset: str, row: dict[str, Any]) -> tuple[str, ...]:
    if dataset in DIMENSION_DATASETS:
        return (f"snapshot_date={row['snapshot_date'].isoformat()}",)
    return (
        f"event_date={row['event_date'].isoformat()}",
        f"ingestion_hour={row['ingestion_hour']}",
    )


def _write_immutable_table(path: Path, table: pa.Table) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    pq.write_table(
        table,
        temporary,
        compression="zstd",
        use_dictionary=True,
        version="2.6",
        write_statistics=True,
    )
    try:
        os.link(temporary, path)
    except FileExistsError:
        if sha256_file(path) != sha256_file(temporary):
            raise FileExistsError(
                f"immutable Bronze object differs from generated content: {path}"
            ) from None
    finally:
        temporary.unlink()


def _write_dataset(
    *,
    bronze_root: Path,
    dataset: str,
    rows: list[dict[str, Any]],
    source_batch: str,
    schema_version: int,
) -> list[Path]:
    grouped: dict[tuple[str, ...], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[_partition_key(dataset, row)].append(row)
    written: list[Path] = []
    for partition, partition_rows in sorted(grouped.items()):
        destination = bronze_root.joinpath(dataset, *partition, f"{source_batch}.parquet")
        table = pa.Table.from_pylist(
            partition_rows,
            schema=expected_schema(dataset, schema_version),
        )
        _write_immutable_table(destination, table)
        written.append(destination)
    return written


def generate_bronze(config: GenerationConfig, lake_root: Path) -> GenerationResult:
    """Generate a committed immutable batch; rerunning the same config is a no-op."""

    lake_root = lake_root.resolve()
    started_at = utc_now()
    bronze_root = lake_root / "bronze"
    source_batch = _source_batch(config)
    manifest_path = bronze_root / "_manifests" / f"{source_batch}.json"
    if manifest_path.is_file():
        manifest = read_manifest(manifest_path)
        counts = manifest.configuration.get("dataset_rows", {})
        return GenerationResult(
            source_batch=source_batch,
            manifest_path=manifest_path,
            dataset_rows={str(key): int(value) for key, value in counts.items()},
            written_files=len(manifest.output_objects),
            skipped=True,
        )

    dimensions, serving_units, placement_ids = _generate_dimensions(config, source_batch)
    events = _generate_events(config, source_batch, serving_units, placement_ids)
    datasets = {**dimensions, **events}
    written: list[Path] = []
    for dataset, dataset_rows in datasets.items():
        written.extend(
            _write_dataset(
                bronze_root=bronze_root,
                dataset=dataset,
                rows=dataset_rows,
                source_batch=source_batch,
                schema_version=config.schema_version,
            )
        )
    inputs = snapshot_files(written, lake_root)
    counts = {dataset: len(dataset_rows) for dataset, dataset_rows in datasets.items()}
    total_rows = sum(counts.values())
    manifest = PipelineManifest(
        run_id=source_batch,
        pipeline="bronze-generator",
        pipeline_version=GENERATOR_VERSION,
        schema_version=config.schema_version,
        status="COMPLETED",
        started_at=started_at,
        completed_at=utc_now(),
        inputs=(),
        output_objects=inputs,
        output_version="bronze",
        output_partitions=tuple(
            sorted({path.parent.relative_to(bronze_root).as_posix() for path in written})
        ),
        quality=QualityResult(
            input_rows=total_rows,
            accepted_rows=total_rows,
            quarantine_rows=0,
            passed=True,
        ),
        configuration={
            "generation": config.model_dump(mode="json"),
            "dataset_rows": counts,
        },
    )
    atomic_write_json(manifest_path, manifest)
    return GenerationResult(
        source_batch=source_batch,
        manifest_path=manifest_path,
        dataset_rows=counts,
        written_files=len(written),
        skipped=False,
    )


def committed_bronze_files(lake_root: Path) -> dict[str, list[Path]]:
    """Return only objects referenced by completed manifests and verify immutability."""

    lake_root = lake_root.resolve()
    bronze_root = lake_root / "bronze"
    bronze_root_resolved = bronze_root.resolve()
    manifest_root = bronze_root / "_manifests"
    files: dict[str, list[Path]] = {
        dataset: [] for dataset in (*DIMENSION_DATASETS, *EVENT_DATASETS)
    }
    if not manifest_root.is_dir():
        raise FileNotFoundError(f"no committed Bronze manifests under {manifest_root}")
    seen: set[Path] = set()
    for manifest_path in sorted(manifest_root.glob("*.json")):
        manifest = read_manifest(manifest_path)
        if manifest.pipeline != "bronze-generator" or manifest.status != "COMPLETED":
            continue
        for item in manifest.output_objects:
            path = (lake_root / item.path).resolve()
            try:
                path.relative_to(bronze_root_resolved)
            except ValueError as error:
                raise OSError(f"manifest object escapes the Bronze root: {item.path}") from error
            if path.suffix != ".parquet":
                raise OSError(f"manifest object is not Parquet: {item.path}")
            if path in seen:
                continue
            if not path.is_file() or path.stat().st_size != item.size_bytes:
                raise OSError(f"committed Bronze object is missing or changed size: {path}")
            if sha256_file(path) != item.sha256:
                raise OSError(f"committed Bronze object failed checksum validation: {path}")
            try:
                dataset = path.relative_to(bronze_root_resolved).parts[0]
                files[dataset].append(path)
            except (KeyError, ValueError) as error:
                raise OSError(f"manifest references an unknown Bronze object: {path}") from error
            seen.add(path)
    if not any(files.values()):
        raise FileNotFoundError(f"no committed Bronze objects under {bronze_root}")
    return files
