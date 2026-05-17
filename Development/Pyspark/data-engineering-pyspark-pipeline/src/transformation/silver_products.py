from typing import Tuple

from pyspark.sql import DataFrame, Window
from pyspark.sql import functions as F

from src.ingestion.bronze_ingestion import CORRUPT_COL
from src.validation.data_quality import with_quarantine_reason


def transform_products(bronze_products: DataFrame, inventory_snapshot: DataFrame) -> Tuple[DataFrame, DataFrame]:
    normalized = (
        bronze_products.withColumn("product_id", F.upper(F.trim("product_id")))
        .withColumn("product_name", F.initcap(F.trim("product_name")))
        .withColumn("category", F.initcap(F.trim("category")))
        .withColumn("brand", F.initcap(F.trim("brand")))
        .withColumn("price", F.col("price").cast("double"))
        .withColumn("cost", F.col("cost").cast("double"))
        .withColumn(
            "is_active",
            F.when(F.lower(F.trim("active_flag")).isin("y", "yes", "true", "1"), F.lit(True))
            .when(F.lower(F.trim("active_flag")).isin("n", "no", "false", "0"), F.lit(False))
            .otherwise(F.lit(None).cast("boolean")),
        )
        .withColumn("updated_ts", F.to_timestamp("updated_at", "yyyy-MM-dd HH:mm:ss"))
        .withColumn("surrogate_product_key", F.abs(F.xxhash64("product_id")))
    )

    valid_condition = (
        F.col(CORRUPT_COL).isNull()
        & F.col("product_id").rlike("^P[0-9]{4}$")
        & F.col("price").isNotNull()
        & (F.col("price") > 0)
        & F.col("cost").isNotNull()
        & (F.col("cost") >= 0)
        & F.col("is_active").isNotNull()
    )
    valid = normalized.filter(valid_condition)
    invalid = with_quarantine_reason(normalized.filter(~valid_condition), "invalid_product_record")

    window = Window.partitionBy("product_id").orderBy(F.col("updated_ts").desc_nulls_last())
    ranked = valid.withColumn("row_number_for_dedupe", F.row_number().over(window))
    duplicates = with_quarantine_reason(ranked.filter(F.col("row_number_for_dedupe") > 1), "duplicate_product_id")

    inventory = inventory_snapshot.select(
        "product_id",
        F.col("available_qty").cast("int"),
        F.initcap("warehouse_region").alias("warehouse_region"),
        F.to_date("snapshot_date").alias("inventory_snapshot_date"),
    )

    cleaned = (
        ranked.filter(F.col("row_number_for_dedupe") == 1)
        .drop("row_number_for_dedupe", CORRUPT_COL, "active_flag", "updated_at")
        .join(F.broadcast(inventory), "product_id", "left")
        .fillna({"available_qty": 0, "warehouse_region": "Unknown"})
        .withColumn("margin_pct", F.round((F.col("price") - F.col("cost")) / F.col("price") * 100, 2))
        .withColumn("silver_created_at", F.current_timestamp())
        .withColumn("silver_updated_at", F.current_timestamp())
    )
    quarantine = invalid.unionByName(duplicates, allowMissingColumns=True)
    return cleaned, quarantine
