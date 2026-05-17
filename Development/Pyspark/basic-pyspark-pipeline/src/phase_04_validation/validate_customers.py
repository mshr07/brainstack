from typing import Tuple

from pyspark.sql import DataFrame, Window
from pyspark.sql import functions as F


def validate_customers(df: DataFrame) -> Tuple[DataFrame, DataFrame]:
    duplicate_window = Window.partitionBy("customer_id")
    checked = (
        df.withColumn("duplicate_count", F.count("*").over(duplicate_window))
        .withColumn(
            "validation_error",
            F.concat_ws(
                "; ",
                F.when(F.col("customer_id").isNull(), "missing_customer_id"),
                F.when(F.col("duplicate_count") > 1, "duplicate_customer_id"),
                F.when(F.col("name").isNull() | (F.length("name") == 0), "missing_name"),
                F.when(
                    F.col("email").isNull()
                    | (~F.col("email").rlike(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")),
                    "invalid_email",
                ),
                F.when(F.col("age").isNull() | (F.col("age") < 0) | (F.col("age") > 120), "invalid_age"),
                F.when(F.col("signup_date").isNull(), "invalid_signup_date"),
                F.when(F.col("amount_spent").isNull() | (F.col("amount_spent") < 0), "invalid_amount_spent"),
            ),
        )
    )

    good_rows = checked.filter(F.col("validation_error") == "").drop("duplicate_count", "validation_error")
    bad_rows = checked.filter(F.col("validation_error") != "").drop("duplicate_count")
    return good_rows, bad_rows
