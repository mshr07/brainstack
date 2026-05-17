from typing import Tuple

from pyspark.sql import DataFrame, Window
from pyspark.sql import functions as F
from pyspark.sql.types import StringType

from src.ingestion.bronze_ingestion import CORRUPT_COL
from src.validation.data_quality import with_quarantine_reason


@F.udf(returnType=StringType())
def normalize_gateway_udf(gateway: str) -> str:
    if gateway is None:
        return "unknown"
    return gateway.strip().lower()


def transform_payments(bronze_payments: DataFrame, silver_orders: DataFrame) -> Tuple[DataFrame, DataFrame]:
    normalized = (
        bronze_payments.withColumn("payment_id", F.upper(F.trim("payment_id")))
        .withColumn("order_id", F.upper(F.trim("order_id")))
        .withColumn("payment_ts", F.to_timestamp("payment_ts"))
        .withColumn("payment_date", F.to_date("payment_ts"))
        .withColumn("amount", F.col("amount").cast("double"))
        .withColumn("payment_method", F.lower(F.trim("payment_method")))
        .withColumn("payment_status", F.upper(F.trim("payment_status")))
        .withColumn("gateway", normalize_gateway_udf(F.col("gateway_response.gateway")))
        .withColumn("gateway_code", F.col("gateway_response.code"))
        .withColumn("gateway_latency_ms", F.col("gateway_response.latency_ms").cast("int"))
        .withColumn("risk_signal_count", F.size(F.coalesce(F.col("risk_signals"), F.array())))
        .withColumn("ip_country", F.col("metadata").getItem("ip_country"))
        .withColumn("device_id", F.col("metadata").getItem("device_id"))
        .withColumn(
            "payment_status_class",
            F.when(F.col("payment_status").isin("SUCCESS"), "success")
            .when(F.col("payment_status").isin("FAILED", "DECLINED", "CHARGEBACK"), "failure")
            .when(F.col("payment_status").isin("PENDING"), "pending")
            .otherwise("unknown"),
        )
    )

    valid_condition = (
        F.col(CORRUPT_COL).isNull()
        & F.col("payment_id").rlike("^PAY[0-9]{5}$")
        & F.col("order_id").rlike("^O[0-9]{5}$")
        & F.col("payment_ts").isNotNull()
        & (F.col("amount") > 0)
        & F.col("payment_status_class").isin("success", "failure", "pending")
    )
    valid = normalized.filter(valid_condition)
    invalid = with_quarantine_reason(normalized.filter(~valid_condition), "invalid_payment_record")

    order_keys = silver_orders.select("order_id").dropDuplicates()
    fk_bad = with_quarantine_reason(valid.join(order_keys, "order_id", "left_anti"), "missing_order_fk")
    valid = valid.join(order_keys, "order_id", "left_semi")

    window = Window.partitionBy("payment_id").orderBy(F.col("payment_ts").desc_nulls_last())
    ranked = valid.withColumn("row_number_for_dedupe", F.row_number().over(window))
    duplicates = with_quarantine_reason(ranked.filter(F.col("row_number_for_dedupe") > 1), "duplicate_payment_id")

    cleaned = (
        ranked.filter(F.col("row_number_for_dedupe") == 1)
        .drop("row_number_for_dedupe", CORRUPT_COL)
        .withColumn("is_successful_payment", F.col("payment_status_class") == F.lit("success"))
        .withColumn("silver_created_at", F.current_timestamp())
        .withColumn("silver_updated_at", F.current_timestamp())
    )
    quarantine = invalid.unionByName(fk_bad, allowMissingColumns=True).unionByName(duplicates, allowMissingColumns=True)
    return cleaned, quarantine
