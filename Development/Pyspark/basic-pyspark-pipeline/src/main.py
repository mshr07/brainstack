import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.phase_01_spark.spark_session import create_spark_session
from src.phase_02_ingestion.ingest_customers import ingest_customers
from src.phase_03_transformation.transform_customers import transform_customers
from src.phase_04_validation.validate_customers import validate_customers
from src.phase_05_loading.write_outputs import write_bad_data, write_good_data


RAW_FILE = PROJECT_ROOT / "data" / "raw" / "customers.csv"
GOOD_OUTPUT = PROJECT_ROOT / "data" / "good" / "customers_good"
BAD_OUTPUT = PROJECT_ROOT / "data" / "bad" / "customers_bad"


def main() -> None:
    if not RAW_FILE.exists():
        raise FileNotFoundError(f"Missing input file: {RAW_FILE}")

    spark = create_spark_session()
    try:
        print("PHASE 1: SparkSession created")

        raw_df = ingest_customers(spark, RAW_FILE)
        print(f"PHASE 2: Ingested rows = {raw_df.count()}")

        transformed_df = transform_customers(raw_df)
        print("PHASE 3: Applied customer cleanup and segmentation")

        good_df, bad_df = validate_customers(transformed_df)
        good_count = good_df.count()
        bad_count = bad_df.count()
        print(f"PHASE 4: Data quality complete | good_rows={good_count} bad_rows={bad_count}")

        write_good_data(good_df, GOOD_OUTPUT)
        write_bad_data(bad_df, BAD_OUTPUT)
        print(f"PHASE 5: Good data written to {GOOD_OUTPUT}")
        print(f"PHASE 5: Bad data written to {BAD_OUTPUT}")

        print("\nSample good rows")
        good_df.show(truncate=False)

        print("\nSample bad rows")
        bad_df.select("customer_id", "name", "email", "age", "signup_date", "amount_spent", "validation_error").show(
            truncate=False
        )
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
