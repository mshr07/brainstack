from __future__ import annotations

from pathlib import Path

import pytest
from pydantic import ValidationError

from adsage_pipelines.config import AppConfig, load_config

LOCAL_CONFIG = Path(__file__).parents[1] / "config" / "local.yaml"


def test_configuration_rejects_unknown_keys_and_unsafe_root() -> None:
    with pytest.raises(ValidationError):
        AppConfig.model_validate({"lake_root": "data/lake", "quality_gate": {}})
    with pytest.raises(ValidationError):
        AppConfig(lake_root=Path("/"))


def test_local_configuration_is_valid() -> None:
    config = load_config(LOCAL_CONFIG)

    assert config.spark.master == "local[2]"
    assert config.lake_root == Path("data/lake")
