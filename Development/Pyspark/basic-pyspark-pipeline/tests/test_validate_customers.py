import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.phase_01_spark.spark_session import create_spark_session
from src.phase_04_validation.validate_customers import validate_customers


@pytest.fixture(scope="session")
def spark():
    session = create_spark_session("basic-pipeline-tests")
    yield session
    session.stop()


def test_validate_customers_splits_good_and_bad_rows(spark):
    df = spark.createDataFrame(
        [
            (1, "Aarav", "aarav@example.com", 28, "2026-01-01", 100.0),
            (2, "Bad Email", "bad-email", 22, "2026-01-01", 200.0),
        ],
        "customer_id int, name string, email string, age int, signup_date string, amount_spent double",
    )
    df = df.withColumn("signup_date", df.signup_date.cast("date"))

    good_df, bad_df = validate_customers(df)

    assert good_df.count() == 1
    assert bad_df.count() == 1
    assert bad_df.first()["validation_error"] == "invalid_email"
