from pathlib import Path

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql.functions import current_timestamp, input_file_name
from pyspark.sql.types import StringType, StructField, StructType


CUSTOMER_SCHEMA = StructType(
    [
        StructField("customer_id", StringType(), True),
        StructField("name", StringType(), True),
        StructField("email", StringType(), True),
        StructField("age", StringType(), True),
        StructField("city", StringType(), True),
        StructField("signup_date", StringType(), True),
        StructField("amount_spent", StringType(), True),
    ]
)


def ingest_customers(spark: SparkSession, input_path: Path) -> DataFrame:
    return (
        spark.read.option("header", True)
        .schema(CUSTOMER_SCHEMA)
        .csv(str(input_path))
        .withColumn("ingestion_timestamp", current_timestamp())
        .withColumn("source_file", input_file_name())
    )
