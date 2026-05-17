from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
BRONZE_DIR = DATA_DIR / "bronze"
SILVER_DIR = DATA_DIR / "silver"
GOLD_DIR = DATA_DIR / "gold"
QUARANTINE_DIR = DATA_DIR / "quarantine"
LOG_DIR = BASE_DIR / "logs"

APP_NAME = os.getenv("SPARK_APP_NAME", "RealWorldDataEngineeringPySparkPipeline")
MASTER = os.getenv("SPARK_MASTER", "local[*]")
OUTPUT_FORMAT = os.getenv("OUTPUT_FORMAT", "parquet").lower()

DEFAULT_SHUFFLE_PARTITIONS = int(os.getenv("SPARK_SQL_SHUFFLE_PARTITIONS", "8"))
SMALL_FILE_COALESCE_PARTITIONS = int(os.getenv("SMALL_FILE_COALESCE_PARTITIONS", "1"))
SKEW_SALT_BUCKETS = int(os.getenv("SKEW_SALT_BUCKETS", "8"))
LATE_ARRIVING_DAYS = int(os.getenv("LATE_ARRIVING_DAYS", "2"))

RAW_DATA_FILES = {
    "customers": RAW_DIR / "customers.csv",
    "products": RAW_DIR / "products.csv",
    "orders": RAW_DIR / "orders.csv",
    "order_items": RAW_DIR / "order_items.csv",
    "payments": RAW_DIR / "payments.json",
    "delivery_events": RAW_DIR / "delivery_events.csv",
    "clickstream_logs": RAW_DIR / "clickstream_logs.json",
    "fraud_reference": RAW_DIR / "fraud_reference.csv",
    "inventory_snapshot": RAW_DIR / "inventory_snapshot.parquet",
}


def ensure_directories() -> None:
    for directory in [
        RAW_DIR,
        BRONZE_DIR,
        SILVER_DIR,
        GOLD_DIR,
        QUARANTINE_DIR,
        LOG_DIR,
    ]:
        directory.mkdir(parents=True, exist_ok=True)


def missing_raw_data_files() -> list[Path]:
    return [path for path in RAW_DATA_FILES.values() if not path.exists()]


def validate_raw_data_available() -> None:
    missing = missing_raw_data_files()
    if missing:
        formatted_missing = "\n".join(f"- {path}" for path in missing)
        raise FileNotFoundError(
            "Static raw test data is required before running the pipeline. "
            f"Missing files or directories:\n{formatted_missing}"
        )
