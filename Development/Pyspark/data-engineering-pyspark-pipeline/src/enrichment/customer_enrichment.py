from typing import Dict

from pyspark.sql import DataFrame, Window
from pyspark.sql import functions as F

from src.ingestion.bronze_ingestion import CORRUPT_COL


def build_customer_enrichment(
    customers: DataFrame,
    orders: DataFrame,
    payments: DataFrame,
    clickstream_logs: DataFrame,
) -> Dict[str, DataFrame]:
    clickstream_clean = (
        clickstream_logs.filter(F.col(CORRUPT_COL).isNull())
        .withColumn("customer_id", F.upper(F.trim("customer_id")))
        .withColumn("event_ts", F.to_timestamp("event_ts"))
        .withColumn("utm_source", F.col("attributes").getItem("utm_source"))
        .withColumn("app_version", F.col("attributes").getItem("app_version"))
        .withColumn("device_os", F.col("device.os"))
        .withColumn("device_browser", F.col("device.browser"))
    )

    clickstream_events = (
        clickstream_clean.select(
            "event_id",
            "customer_id",
            "session_id",
            "event_ts",
            "utm_source",
            "app_version",
            "device_os",
            "device_browser",
            F.explode_outer("events").alias("event_detail"),
        )
        .select(
            "event_id",
            "customer_id",
            "session_id",
            "event_ts",
            "utm_source",
            "app_version",
            "device_os",
            "device_browser",
            F.col("event_detail.type").alias("event_type"),
            F.col("event_detail.product_id").alias("product_id"),
            F.col("event_detail.position").alias("product_position"),
        )
        .filter(F.col("customer_id").rlike("^C[0-9]{4}$"))
    )

    order_metrics = orders.groupBy("customer_id").agg(
        F.countDistinct("order_id").alias("total_orders"),
        F.round(F.sum("total_order_value"), 2).alias("customer_lifetime_value"),
        F.min("order_date").alias("first_order_date"),
        F.max("order_date").alias("last_order_date"),
        F.avg("total_order_value").alias("avg_order_value"),
        F.collect_set("channel").alias("channels_used"),
    )

    successful_payment_metrics = (
        orders.join(payments.filter(F.col("payment_status_class") == "success"), "order_id", "left")
        .groupBy("customer_id")
        .agg(F.count("payment_id").alias("successful_payments"), F.round(F.sum("amount"), 2).alias("successful_payment_amount"))
    )

    click_metrics = clickstream_events.groupBy("customer_id").agg(
        F.count("*").alias("click_events"),
        F.countDistinct("session_id").alias("sessions"),
        F.collect_set("event_type").alias("event_types"),
        F.max("event_ts").alias("last_click_ts"),
    )

    customer_360 = (
        customers.join(order_metrics, "customer_id", "left")
        .join(successful_payment_metrics, "customer_id", "left")
        .join(click_metrics, "customer_id", "left")
        .fillna(
            {
                "total_orders": 0,
                "customer_lifetime_value": 0.0,
                "avg_order_value": 0.0,
                "successful_payments": 0,
                "successful_payment_amount": 0.0,
                "click_events": 0,
                "sessions": 0,
            }
        )
        .withColumn("repeat_customer_flag", F.col("total_orders") > 1)
        .withColumn(
            "customer_segment",
            F.when(F.col("customer_lifetime_value") >= 50000, "high_value")
            .when(F.col("customer_lifetime_value") >= 15000, "mid_value")
            .otherwise("standard"),
        )
        .withColumn("days_since_last_order", F.datediff(F.current_date(), F.col("last_order_date")))
        .withColumn("enriched_at", F.current_timestamp())
    )

    dim_customer_current = customer_360.select(
        F.abs(F.xxhash64("customer_id")).alias("customer_sk"),
        "customer_id",
        "full_name",
        "email",
        "phone",
        "city",
        "state",
        "loyalty_tier",
        "customer_segment",
        F.current_timestamp().alias("effective_from"),
        F.lit(None).cast("timestamp").alias("effective_to"),
        F.lit(True).alias("is_current"),
    )

    city_history = customers.select("customer_id", "city", "created_ts").withColumn("change_type", F.lit("signup_city"))
    latest_city = customers.select("customer_id", "city", F.current_timestamp().alias("created_ts")).withColumn(
        "change_type", F.lit("current_city")
    )
    scd_source = city_history.unionByName(latest_city)
    scd_window = Window.partitionBy("customer_id").orderBy("created_ts")
    dim_customer_history = (
        scd_source.withColumn("effective_from", F.col("created_ts"))
        .withColumn("effective_to", F.lead("created_ts").over(scd_window))
        .withColumn("is_current", F.col("effective_to").isNull())
        .withColumn("customer_history_sk", F.abs(F.xxhash64("customer_id", "city", "effective_from")))
    )

    return {
        "customer_360": customer_360,
        "clickstream_events": clickstream_events,
        "dim_customer_current": dim_customer_current,
        "dim_customer_history": dim_customer_history,
    }
