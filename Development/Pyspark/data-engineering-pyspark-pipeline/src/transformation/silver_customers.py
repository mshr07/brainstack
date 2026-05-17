from typing import Tuple

from pyspark.sql import DataFrame, Window
from pyspark.sql import functions as F

from src.ingestion.bronze_ingestion import CORRUPT_COL
from src.validation.data_quality import with_quarantine_reason


def transform_customers(bronze_customers: DataFrame) -> Tuple[DataFrame, DataFrame]:
    normalized = (
        bronze_customers.withColumn("customer_id", F.upper(F.trim("customer_id")))
        .withColumn("first_name", F.initcap(F.trim("first_name")))
        .withColumn("last_name", F.initcap(F.trim("last_name")))
        .withColumn("email", F.lower(F.trim("email")))
        .withColumn("phone", F.regexp_replace(F.col("phone"), "[^0-9]", ""))
        .withColumn("city", F.initcap(F.trim("city")))
        .withColumn("state", F.upper(F.trim("state")))
        .withColumn("loyalty_tier", F.lower(F.trim(F.coalesce(F.col("loyalty_tier"), F.lit("bronze")))))
        .withColumn("signup_date", F.coalesce(F.to_date("signup_date", "yyyy-MM-dd"), F.to_date("signup_date", "MM-dd-yyyy")))
        .withColumn(
            "created_ts",
            F.coalesce(
                F.to_timestamp("created_at", "yyyy-MM-dd HH:mm:ss"),
                F.to_timestamp("created_at", "yyyy/MM/dd HH:mm:ss"),
                F.to_timestamp("created_at", "MM-dd-yyyy"),
            ),
        )
        .withColumn("full_name", F.concat_ws(" ", F.col("first_name"), F.col("last_name")))
        .withColumn("email_domain", F.split(F.col("email"), "@").getItem(1))
        .withColumn("phone_last4", F.substring(F.col("phone"), -4, 4))
        .fillna({"loyalty_tier": "bronze", "city": "Unknown", "state": "NA"})
    )

    valid_condition = (
        F.col(CORRUPT_COL).isNull()
        & F.col("customer_id").rlike("^C[0-9]{4}$")
        & F.col("email").rlike("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
        & (F.length("phone") >= 10)
        & F.col("signup_date").isNotNull()
        & F.col("created_ts").isNotNull()
    )
    valid = normalized.filter(valid_condition)
    invalid = with_quarantine_reason(normalized.filter(~valid_condition), "invalid_customer_record")

    window = Window.partitionBy("customer_id").orderBy(F.col("created_ts").desc_nulls_last(), F.col("ingestion_timestamp").desc())
    ranked = valid.withColumn("row_number_for_dedupe", F.row_number().over(window))
    duplicates = with_quarantine_reason(ranked.filter(F.col("row_number_for_dedupe") > 1), "duplicate_customer_id")

    cleaned = (
        ranked.filter(F.col("row_number_for_dedupe") == 1)
        .drop("row_number_for_dedupe", CORRUPT_COL, "created_at")
        .withColumn("is_active", F.lit(True))
        .withColumn("silver_created_at", F.current_timestamp())
        .withColumn("silver_updated_at", F.current_timestamp())
    )
    quarantine = invalid.unionByName(duplicates, allowMissingColumns=True)
    return cleaned, quarantine
