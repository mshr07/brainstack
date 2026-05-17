import sys
from pathlib import Path

import pytest
from pyspark.sql import functions as F

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.validation.data_quality import split_valid_invalid, validate_foreign_key, validate_primary_key
from src.utils.spark_session import get_spark


@pytest.fixture(scope="session")
def spark():
    session = get_spark("data-quality-tests")
    session.sparkContext.setLogLevel("ERROR")
    yield session
    session.stop()


def test_split_valid_invalid(spark):
    df = spark.createDataFrame([(1, "ok"), (2, None)], ["id", "status"])
    valid, invalid = split_valid_invalid(df, F.col("status").isNotNull(), "missing_status")

    assert valid.count() == 1
    assert invalid.count() == 1
    assert invalid.select("quarantine_reason").first()[0] == "missing_status"


def test_validate_primary_key_detects_nulls_and_duplicates(spark):
    df = spark.createDataFrame([(1, "a"), (1, "duplicate"), (None, "missing")], ["id", "value"])
    violations = validate_primary_key(df, ["id"])

    assert violations.count() == 3


def test_validate_foreign_key_returns_orphans(spark):
    child = spark.createDataFrame([(1, "C1"), (2, "C404")], ["order_id", "customer_id"])
    parent = spark.createDataFrame([("C1",)], ["customer_id"])

    orphans = validate_foreign_key(child, parent, "customer_id", "customer_id")

    assert orphans.count() == 1
    assert orphans.first()["customer_id"] == "C404"
