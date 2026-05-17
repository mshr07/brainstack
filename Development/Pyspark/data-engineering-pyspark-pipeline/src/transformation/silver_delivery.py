from typing import Tuple

from pyspark.sql import DataFrame, Window
from pyspark.sql import functions as F

from src.ingestion.bronze_ingestion import CORRUPT_COL
from src.validation.data_quality import with_quarantine_reason


def transform_delivery_events(bronze_delivery: DataFrame, silver_orders: DataFrame) -> Tuple[DataFrame, DataFrame]:
    normalized = (
        bronze_delivery.withColumn("delivery_event_id", F.upper(F.trim("delivery_event_id")))
        .withColumn("order_id", F.upper(F.trim("order_id")))
        .withColumn("event_name", F.lower(F.trim("event_name")))
        .withColumn("event_ts", F.to_timestamp("event_ts", "yyyy-MM-dd HH:mm:ss"))
        .withColumn("driver_id", F.upper(F.trim("driver_id")))
        .withColumn("distance_km", F.col("distance_km").cast("double"))
    )

    valid_condition = (
        F.col(CORRUPT_COL).isNull()
        & F.col("delivery_event_id").isNotNull()
        & F.col("order_id").rlike("^O[0-9]{5}$")
        & F.col("event_name").isin("assigned", "picked_up", "out_for_delivery", "delivered", "cancelled")
        & F.col("event_ts").isNotNull()
        & (F.col("distance_km") >= 0)
    )
    valid = normalized.filter(valid_condition)
    invalid = with_quarantine_reason(normalized.filter(~valid_condition), "invalid_delivery_record")

    order_keys = silver_orders.select("order_id").dropDuplicates()
    fk_bad = with_quarantine_reason(valid.join(order_keys, "order_id", "left_anti"), "missing_order_fk")
    valid = valid.join(order_keys, "order_id", "left_semi")

    window = Window.partitionBy("order_id").orderBy("event_ts")
    cleaned = (
        valid.dropDuplicates(["delivery_event_id"])
        .withColumn("previous_event_name", F.lag("event_name").over(window))
        .withColumn("next_event_name", F.lead("event_name").over(window))
        .withColumn("previous_event_ts", F.lag("event_ts").over(window))
        .withColumn("minutes_since_previous_event", F.round((F.col("event_ts").cast("long") - F.col("previous_event_ts").cast("long")) / 60, 2))
        .withColumn("event_rank", F.dense_rank().over(window))
        .drop(CORRUPT_COL)
        .withColumn("silver_created_at", F.current_timestamp())
        .withColumn("silver_updated_at", F.current_timestamp())
    )
    quarantine = invalid.unionByName(fk_bad, allowMissingColumns=True)
    return cleaned, quarantine
