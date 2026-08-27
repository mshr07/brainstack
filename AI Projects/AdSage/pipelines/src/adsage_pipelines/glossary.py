"""Strict loader for the canonical metric metadata seed."""

from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field


class MetricDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    metric_id: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    display_name: str
    description: str
    formula: str
    aggregation_rule: Literal["additive", "recompute_ratio", "attribution_bound"]
    required_measures: tuple[str, ...]
    allowed_grain: tuple[str, ...]
    owner: str
    semantic_version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    valid_from: date


class GlossarySeed(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    glossary_version: int
    metrics: tuple[MetricDefinition, ...]


def load_glossary(path: Path) -> GlossarySeed:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    glossary = GlossarySeed.model_validate(raw)
    identifiers = [metric.metric_id for metric in glossary.metrics]
    if len(identifiers) != len(set(identifiers)):
        raise ValueError("glossary metric_id values must be unique")
    return glossary
