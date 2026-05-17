from functools import reduce
from typing import Dict, Iterable, List, Tuple

from pyspark.sql import DataFrame
from pyspark.sql import functions as F


def with_quarantine_reason(df: DataFrame, reason: str) -> DataFrame:
    return df.withColumn("quarantine_reason", F.lit(reason)).withColumn("quarantined_at", F.current_timestamp())


def split_valid_invalid(df: DataFrame, valid_condition, reason: str) -> Tuple[DataFrame, DataFrame]:
    valid_df = df.filter(valid_condition)
    invalid_df = with_quarantine_reason(df.filter(~valid_condition), reason)
    return valid_df, invalid_df


def require_columns(df: DataFrame, required_columns: Iterable[str]) -> None:
    missing = sorted(set(required_columns) - set(df.columns))
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def validate_primary_key(df: DataFrame, key_columns: List[str]) -> DataFrame:
    require_columns(df, key_columns)
    null_condition = reduce(lambda left, right: left | right, [F.col(col_name).isNull() for col_name in key_columns])
    duplicate_keys = df.groupBy(*key_columns).count().filter(F.col("count") > 1).drop("count")
    null_records = df.filter(null_condition)
    duplicate_records = df.join(duplicate_keys, key_columns, "inner")
    return null_records.unionByName(duplicate_records, allowMissingColumns=True).dropDuplicates()


def validate_foreign_key(child_df: DataFrame, parent_df: DataFrame, child_key: str, parent_key: str) -> DataFrame:
    require_columns(child_df, [child_key])
    require_columns(parent_df, [parent_key])
    parent_keys = parent_df.select(F.col(parent_key).alias(child_key)).dropDuplicates()
    return child_df.join(parent_keys, child_key, "left_anti")


def union_quarantine_tables(tables: Iterable[DataFrame]) -> DataFrame:
    materialized = [df for df in tables if df is not None]
    if not materialized:
        raise ValueError("At least one quarantine DataFrame is required")
    return reduce(lambda left, right: left.unionByName(right, allowMissingColumns=True), materialized)


def run_quality_checks(tables: Dict[str, DataFrame]) -> Dict[str, int]:
    metrics = {}
    for name, df in tables.items():
        metrics[f"{name}_rows"] = df.count()
        metrics[f"{name}_columns"] = len(df.columns)

    if "customers" in tables:
        metrics["customers_missing_email"] = tables["customers"].filter(F.col("email").isNull()).count()
    if "orders" in tables and "customers" in tables:
        metrics["orders_without_customer_fk"] = validate_foreign_key(
            tables["orders"], tables["customers"], "customer_id", "customer_id"
        ).count()
    if "payments" in tables and "orders" in tables:
        metrics["payments_without_order_fk"] = validate_foreign_key(tables["payments"], tables["orders"], "order_id", "order_id").count()
    return metrics
