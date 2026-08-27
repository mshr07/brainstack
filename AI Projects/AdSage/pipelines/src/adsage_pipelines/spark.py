"""Constrained local Spark session construction."""

from __future__ import annotations

from pathlib import Path

from pyspark.sql import SparkSession

from adsage_pipelines.config import SparkConfig


def create_spark_session(config: SparkConfig, lake_root: Path) -> SparkSession:
    """Create a deterministic UTC Spark session suitable for local and CI execution."""

    warehouse = lake_root / "_spark_warehouse"
    warehouse.mkdir(parents=True, exist_ok=True)
    session = (
        SparkSession.builder.appName("adsage-data-pipelines")
        .master(config.master)
        .config("spark.ui.enabled", "false")
        .config("spark.sql.session.timeZone", "UTC")
        .config("spark.sql.shuffle.partitions", str(config.shuffle_partitions))
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.parquet.mergeSchema", "true")
        .config("spark.driver.bindAddress", "127.0.0.1")
        .config("spark.sql.warehouse.dir", str(warehouse.resolve()))
        .getOrCreate()
    )
    session.sparkContext.setLogLevel("WARN")
    return session
