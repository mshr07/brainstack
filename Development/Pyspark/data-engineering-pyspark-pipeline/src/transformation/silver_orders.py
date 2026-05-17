from typing import Tuple

from pyspark.sql import DataFrame, Window
from pyspark.sql import functions as F

from src.config.settings import LATE_ARRIVING_DAYS
from src.ingestion.bronze_ingestion import CORRUPT_COL
from src.validation.data_quality import with_quarantine_reason


def transform_orders(
    bronze_orders: DataFrame,
    bronze_order_items: DataFrame,
    silver_customers: DataFrame,
    silver_products: DataFrame,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    orders = (
        bronze_orders.withColumn("order_id", F.upper(F.trim("order_id")))
        .withColumn("customer_id", F.upper(F.trim("customer_id")))
        .withColumn(
            "order_ts",
            F.coalesce(F.to_timestamp("order_ts", "yyyy-MM-dd HH:mm:ss"), F.to_timestamp("order_ts", "yyyy/MM/dd HH:mm:ss")),
        )
        .withColumn("order_date", F.to_date("order_ts"))
        .withColumn("order_status", F.lower(F.trim("order_status")))
        .withColumn("channel", F.lower(F.trim(F.coalesce(F.col("channel"), F.lit("unknown")))))
        .withColumn("city", F.initcap(F.trim("city")))
        .withColumn("coupon_code", F.upper(F.trim(F.coalesce(F.col("coupon_code"), F.lit("")))))
        .withColumn("is_cancelled", F.col("order_status").isin("cancelled", "returned"))
        .withColumn("is_late_arriving", F.datediff(F.to_date("ingestion_timestamp"), F.col("order_date")) > F.lit(LATE_ARRIVING_DAYS))
    )

    allowed_status = ["created", "paid", "delivered", "cancelled", "returned"]
    valid_order_condition = (
        F.col(CORRUPT_COL).isNull()
        & F.col("order_id").rlike("^O[0-9]{5}$")
        & F.col("customer_id").rlike("^C[0-9]{4}$")
        & F.col("order_ts").isNotNull()
        & F.col("order_status").isin(*allowed_status)
    )
    valid_orders = orders.filter(valid_order_condition)
    invalid_orders = with_quarantine_reason(orders.filter(~valid_order_condition), "invalid_order_record")

    customer_keys = silver_customers.select("customer_id").dropDuplicates()
    fk_bad_orders = with_quarantine_reason(valid_orders.join(customer_keys, "customer_id", "left_anti"), "missing_customer_fk")
    valid_orders = valid_orders.join(customer_keys, "customer_id", "left_semi")

    window = Window.partitionBy("order_id").orderBy(F.col("order_ts").desc_nulls_last(), F.col("ingestion_timestamp").desc())
    ranked_orders = valid_orders.withColumn("row_number_for_dedupe", F.row_number().over(window))
    duplicate_orders = with_quarantine_reason(ranked_orders.filter(F.col("row_number_for_dedupe") > 1), "duplicate_order_id")
    cleaned_orders = ranked_orders.filter(F.col("row_number_for_dedupe") == 1).drop("row_number_for_dedupe", CORRUPT_COL)

    items = (
        bronze_order_items.withColumn("order_item_id", F.upper(F.trim("order_item_id")))
        .withColumn("order_id", F.upper(F.trim("order_id")))
        .withColumn("product_id", F.upper(F.trim("product_id")))
        .withColumn("quantity", F.col("quantity").cast("int"))
        .withColumn("unit_price", F.col("unit_price").cast("double"))
        .withColumn("discount_pct", F.coalesce(F.col("discount_pct").cast("double"), F.lit(0.0)))
        .withColumn("gross_item_amount", F.col("quantity") * F.col("unit_price"))
        .withColumn("discount_amount", F.round(F.col("gross_item_amount") * F.col("discount_pct") / 100, 2))
        .withColumn("net_item_amount", F.round(F.col("gross_item_amount") - F.col("discount_amount"), 2))
    )
    valid_item_condition = (
        F.col(CORRUPT_COL).isNull()
        & F.col("order_item_id").isNotNull()
        & F.col("order_id").rlike("^O[0-9]{5}$")
        & F.col("product_id").rlike("^P[0-9]{4}$")
        & (F.col("quantity") > 0)
        & (F.col("unit_price") > 0)
        & F.col("discount_pct").between(0, 80)
    )
    valid_items = items.filter(valid_item_condition)
    invalid_items = with_quarantine_reason(items.filter(~valid_item_condition), "invalid_order_item_record")

    product_keys = silver_products.select("product_id").dropDuplicates()
    item_fk_bad_products = with_quarantine_reason(valid_items.join(product_keys, "product_id", "left_anti"), "missing_product_fk")
    item_fk_bad_orders = with_quarantine_reason(
        valid_items.join(cleaned_orders.select("order_id"), "order_id", "left_anti"), "missing_order_fk"
    )
    valid_items = valid_items.join(product_keys, "product_id", "left_semi").join(cleaned_orders.select("order_id"), "order_id", "left_semi")
    cleaned_items = (
        valid_items.dropDuplicates(["order_item_id"])
        .drop(CORRUPT_COL)
        .withColumn("silver_created_at", F.current_timestamp())
        .withColumn("silver_updated_at", F.current_timestamp())
    )

    totals = cleaned_items.groupBy("order_id").agg(
        F.round(F.sum("gross_item_amount"), 2).alias("gross_order_amount"),
        F.round(F.sum("discount_amount"), 2).alias("discount_amount"),
        F.round(F.sum("net_item_amount"), 2).alias("total_order_value"),
        F.count("*").alias("item_count"),
        F.collect_set("product_id").alias("product_ids"),
    )

    cleaned_orders = (
        cleaned_orders.join(totals, "order_id", "left")
        .fillna({"gross_order_amount": 0.0, "discount_amount": 0.0, "total_order_value": 0.0, "item_count": 0})
        .withColumn("silver_created_at", F.current_timestamp())
        .withColumn("silver_updated_at", F.current_timestamp())
    )

    quarantine = invalid_orders.unionByName(fk_bad_orders, allowMissingColumns=True).unionByName(
        duplicate_orders, allowMissingColumns=True
    )
    item_quarantine = (
        invalid_items.unionByName(item_fk_bad_products, allowMissingColumns=True)
        .unionByName(item_fk_bad_orders, allowMissingColumns=True)
        .withColumn("entity_name", F.lit("order_item"))
    )
    return cleaned_orders, cleaned_items, quarantine.unionByName(item_quarantine, allowMissingColumns=True)
