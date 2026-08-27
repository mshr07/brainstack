"""Command-line entry point for the complete local synthetic lake flow."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from adsage_pipelines.config import AppConfig, load_config
from adsage_pipelines.duckdb_checks import validate_current_gold
from adsage_pipelines.generator import generate_bronze
from adsage_pipelines.glossary import load_glossary
from adsage_pipelines.gold import run_gold
from adsage_pipelines.silver import run_silver
from adsage_pipelines.spark import create_spark_session

DEFAULT_CONFIG = Path("pipelines/config/local.yaml")
DEFAULT_GLOSSARY = Path("pipelines/resources/glossary/metrics.v1.yaml")


def _json_value(value: BaseModel | dict[str, Any]) -> str:
    payload = value.model_dump(mode="json") if isinstance(value, BaseModel) else value
    return json.dumps(payload, indent=2, sort_keys=True)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="adsage-data", description="Generate and transform the synthetic AdSage lake"
    )
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    subcommands = parser.add_subparsers(dest="command", required=True)
    subcommands.add_parser("generate", help="append one deterministic committed Bronze batch")
    subcommands.add_parser("silver", help="validate and publish the current Bronze snapshot")
    subcommands.add_parser("gold", help="aggregate and publish canonical daily metrics")
    subcommands.add_parser("run", help="generate, transform, and validate all medallion layers")
    subcommands.add_parser("validate", help="run independent DuckDB assertions on current Gold")
    glossary = subcommands.add_parser("glossary", help="validate the canonical metric seed")
    glossary.add_argument("--path", type=Path, default=DEFAULT_GLOSSARY)
    return parser


def _run_with_spark(config: AppConfig, command: str) -> dict[str, Any]:
    spark = create_spark_session(config.spark, config.lake_root)
    try:
        if command == "silver":
            return run_silver(spark, config.lake_root, config.quality).model_dump(mode="json")
        if command == "gold":
            return run_gold(spark, config.lake_root, config.quality).model_dump(mode="json")
        silver = run_silver(spark, config.lake_root, config.quality)
        gold = run_gold(spark, config.lake_root, config.quality)
        validation = validate_current_gold(config.lake_root)
        return {
            "silver": silver.model_dump(mode="json"),
            "gold": gold.model_dump(mode="json"),
            "duckdb": validation.model_dump(mode="json"),
        }
    finally:
        spark.stop()


def main() -> None:
    arguments = _parser().parse_args()
    config = load_config(arguments.config)
    if arguments.command == "generate":
        result: BaseModel | dict[str, Any] = generate_bronze(config.generation, config.lake_root)
    elif arguments.command in {"silver", "gold"}:
        result = _run_with_spark(config, arguments.command)
    elif arguments.command == "run":
        generation = generate_bronze(config.generation, config.lake_root)
        result = {
            "bronze": generation.model_dump(mode="json"),
            **_run_with_spark(config, arguments.command),
        }
    elif arguments.command == "validate":
        result = validate_current_gold(config.lake_root)
    else:
        result = load_glossary(arguments.path)
    print(_json_value(result))


if __name__ == "__main__":
    main()
