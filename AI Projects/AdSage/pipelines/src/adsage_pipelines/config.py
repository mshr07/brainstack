"""Typed configuration at the data pipeline boundary."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Self
from uuid import UUID

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    """Reject misspelled settings instead of silently changing pipeline behavior."""

    model_config = ConfigDict(extra="forbid", frozen=True)


class GenerationConfig(StrictModel):
    seed: int = 20260827
    tenant_id: UUID = UUID("11111111-1111-4111-8111-111111111111")
    start_date: date = date(2026, 8, 1)
    days: int = Field(default=4, ge=1, le=366)
    advertisers: int = Field(default=1, ge=1, le=10)
    campaigns_per_advertiser: int = Field(default=3, ge=1, le=25)
    ad_groups_per_campaign: int = Field(default=2, ge=1, le=25)
    ads_per_ad_group: int = Field(default=2, ge=1, le=25)
    impressions_per_day: int = Field(default=60, ge=1, le=100_000)
    click_probability: Decimal = Field(default=Decimal("0.18"), ge=0, le=1)
    conversion_probability: Decimal = Field(default=Decimal("0.12"), ge=0, le=1)
    duplicate_probability: Decimal = Field(default=Decimal("0.02"), ge=0, le=1)
    late_arrival_probability: Decimal = Field(default=Decimal("0.08"), ge=0, le=1)
    beyond_window_probability: Decimal = Field(default=Decimal("0.005"), ge=0, le=1)
    invalid_probability: Decimal = Field(default=Decimal("0.005"), ge=0, le=1)
    schema_version: int = Field(default=2, ge=1, le=2)
    attribution_version: str = Field(default="last_click_v1", pattern=r"^[a-z0-9_]{3,40}$")


class QualityConfig(StrictModel):
    max_quarantine_rate: Decimal = Field(default=Decimal("0.05"), ge=0, le=1)
    correction_window_days: int = Field(default=7, ge=1, le=90)
    min_accepted_rows: int = Field(default=1, ge=1)


class SparkConfig(StrictModel):
    master: str = Field(default="local[2]", pattern=r"^local(?:\[(?:\*|\d+)\])?$")
    shuffle_partitions: int = Field(default=4, ge=1, le=200)


class AppConfig(StrictModel):
    lake_root: Path = Path("data/lake")
    generation: GenerationConfig = GenerationConfig()
    quality: QualityConfig = QualityConfig()
    spark: SparkConfig = SparkConfig()

    @model_validator(mode="after")
    def require_safe_lake_root(self) -> Self:
        if str(self.lake_root) in {"", ".", "/", "~"}:
            raise ValueError("lake_root must be a dedicated data directory")
        return self


def load_config(path: Path) -> AppConfig:
    """Load and strictly validate a YAML application configuration."""

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError(f"configuration must contain a mapping: {path}")
    return AppConfig.model_validate(raw)
