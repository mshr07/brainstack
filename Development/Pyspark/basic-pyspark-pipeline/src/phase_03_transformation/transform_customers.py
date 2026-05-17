from pyspark.sql import DataFrame
from pyspark.sql import functions as F


def transform_customers(df: DataFrame) -> DataFrame:
    return (
        df.withColumn("customer_id", F.trim("customer_id").cast("int"))
        .withColumn("name", F.initcap(F.trim("name")))
        .withColumn("email", F.lower(F.trim("email")))
        .withColumn("age", F.trim("age").cast("int"))
        .withColumn("city", F.initcap(F.trim("city")))
        .withColumn("signup_date", F.to_date("signup_date", "yyyy-MM-dd"))
        .withColumn("amount_spent", F.trim("amount_spent").cast("double"))
        .withColumn(
            "customer_segment",
            F.when(F.col("amount_spent") >= 1000, "high_value")
            .when(F.col("amount_spent") >= 500, "medium_value")
            .otherwise("low_value"),
        )
        .withColumn("processed_at", F.current_timestamp())
    )
