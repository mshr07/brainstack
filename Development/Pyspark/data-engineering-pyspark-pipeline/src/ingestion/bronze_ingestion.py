from pathlib import Path
from typing import Dict

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql.functions import current_timestamp, input_file_name, lit
from pyspark.sql.types import (
    ArrayType,
    DoubleType,
    IntegerType,
    MapType,
    StringType,
    StructField,
    StructType,
)

from src.config.settings import BRONZE_DIR, RAW_DATA_FILES
from src.loading.data_writer import write_table
from src.utils.logger import get_logger

logger = get_logger(__name__)


CORRUPT_COL = "_corrupt_record"

CUSTOMER_SCHEMA = StructType(
    [
        StructField("customer_id", StringType()),
        StructField("first_name", StringType()),
        StructField("last_name", StringType()),
        StructField("email", StringType()),
        StructField("phone", StringType()),
        StructField("city", StringType()),
        StructField("state", StringType()),
        StructField("signup_date", StringType()),
        StructField("created_at", StringType()),
        StructField("loyalty_tier", StringType()),
        StructField(CORRUPT_COL, StringType()),
    ]
)

PRODUCT_SCHEMA = StructType(
    [
        StructField("product_id", StringType()),
        StructField("product_name", StringType()),
        StructField("category", StringType()),
        StructField("brand", StringType()),
        StructField("price", StringType()),
        StructField("cost", StringType()),
        StructField("active_flag", StringType()),
        StructField("updated_at", StringType()),
        StructField(CORRUPT_COL, StringType()),
    ]
)

ORDER_SCHEMA = StructType(
    [
        StructField("order_id", StringType()),
        StructField("customer_id", StringType()),
        StructField("order_ts", StringType()),
        StructField("order_status", StringType()),
        StructField("channel", StringType()),
        StructField("city", StringType()),
        StructField("coupon_code", StringType()),
        StructField(CORRUPT_COL, StringType()),
    ]
)

ORDER_ITEM_SCHEMA = StructType(
    [
        StructField("order_item_id", StringType()),
        StructField("order_id", StringType()),
        StructField("product_id", StringType()),
        StructField("quantity", StringType()),
        StructField("unit_price", StringType()),
        StructField("discount_pct", StringType()),
        StructField(CORRUPT_COL, StringType()),
    ]
)

PAYMENT_SCHEMA = StructType(
    [
        StructField("payment_id", StringType()),
        StructField("order_id", StringType()),
        StructField("payment_ts", StringType()),
        StructField("amount", StringType()),
        StructField("payment_method", StringType()),
        StructField("payment_status", StringType()),
        StructField(
            "gateway_response",
            StructType(
                [
                    StructField("gateway", StringType()),
                    StructField("code", StringType()),
                    StructField("latency_ms", IntegerType()),
                ]
            ),
        ),
        StructField("risk_signals", ArrayType(StringType())),
        StructField("metadata", MapType(StringType(), StringType())),
        StructField(CORRUPT_COL, StringType()),
    ]
)

DELIVERY_SCHEMA = StructType(
    [
        StructField("delivery_event_id", StringType()),
        StructField("order_id", StringType()),
        StructField("event_name", StringType()),
        StructField("event_ts", StringType()),
        StructField("driver_id", StringType()),
        StructField("distance_km", StringType()),
        StructField(CORRUPT_COL, StringType()),
    ]
)

CLICKSTREAM_SCHEMA = StructType(
    [
        StructField("event_id", StringType()),
        StructField("customer_id", StringType()),
        StructField("session_id", StringType()),
        StructField("event_ts", StringType()),
        StructField(
            "events",
            ArrayType(
                StructType(
                    [
                        StructField("type", StringType()),
                        StructField("product_id", StringType()),
                        StructField("position", IntegerType()),
                    ]
                )
            ),
        ),
        StructField("attributes", MapType(StringType(), StringType())),
        StructField("device", StructType([StructField("os", StringType()), StructField("browser", StringType())])),
        StructField(CORRUPT_COL, StringType()),
    ]
)

FRAUD_REFERENCE_SCHEMA = StructType(
    [
        StructField("reference_type", StringType()),
        StructField("reference_value", StringType()),
        StructField("risk_weight", StringType()),
        StructField(CORRUPT_COL, StringType()),
    ]
)


def _add_bronze_audit(df: DataFrame, source_name: str) -> DataFrame:
    return (
        df.withColumn("ingestion_timestamp", current_timestamp())
        .withColumn("source_file_name", input_file_name())
        .withColumn("source_system", lit(source_name))
    )


def _read_csv(spark: SparkSession, path: Path, schema: StructType, source_name: str) -> DataFrame:
    return _add_bronze_audit(
        spark.read.option("header", True)
        .option("mode", "PERMISSIVE")
        .option("columnNameOfCorruptRecord", CORRUPT_COL)
        .schema(schema)
        .csv(str(path)),
        source_name,
    )


def _read_json(spark: SparkSession, path: Path, schema: StructType, source_name: str) -> DataFrame:
    return _add_bronze_audit(
        spark.read.option("mode", "PERMISSIVE").option("columnNameOfCorruptRecord", CORRUPT_COL).schema(schema).json(str(path)),
        source_name,
    )


def _read_parquet(spark: SparkSession, path: Path, source_name: str) -> DataFrame:
    return _add_bronze_audit(spark.read.parquet(str(path)), source_name)


def ingest_bronze(spark: SparkSession) -> Dict[str, DataFrame]:
    logger.info("Starting bronze ingestion")

    inferred_customer_sample = spark.read.option("header", True).option("inferSchema", True).csv(str(RAW_DATA_FILES["customers"]))
    logger.info("Infer schema demonstration for customers.csv:")
    inferred_customer_sample.printSchema()

    bronze = {
        "customers": _read_csv(spark, RAW_DATA_FILES["customers"], CUSTOMER_SCHEMA, "customers_csv"),
        "products": _read_csv(spark, RAW_DATA_FILES["products"], PRODUCT_SCHEMA, "products_csv"),
        "orders": _read_csv(spark, RAW_DATA_FILES["orders"], ORDER_SCHEMA, "orders_csv"),
        "order_items": _read_csv(spark, RAW_DATA_FILES["order_items"], ORDER_ITEM_SCHEMA, "order_items_csv"),
        "payments": _read_json(spark, RAW_DATA_FILES["payments"], PAYMENT_SCHEMA, "payments_json"),
        "delivery_events": _read_csv(spark, RAW_DATA_FILES["delivery_events"], DELIVERY_SCHEMA, "delivery_events_csv"),
        "clickstream_logs": _read_json(spark, RAW_DATA_FILES["clickstream_logs"], CLICKSTREAM_SCHEMA, "clickstream_json"),
        "fraud_reference": _read_csv(spark, RAW_DATA_FILES["fraud_reference"], FRAUD_REFERENCE_SCHEMA, "fraud_reference_csv"),
        "inventory_snapshot": _read_parquet(spark, RAW_DATA_FILES["inventory_snapshot"], "inventory_snapshot_parquet"),
    }

    for name, df in bronze.items():
        output_path = BRONZE_DIR / name
        write_table(df, output_path, coalesce_files=True)
        logger.info("Wrote bronze table %-20s rows=%s path=%s", name, df.count(), output_path)

    return bronze
