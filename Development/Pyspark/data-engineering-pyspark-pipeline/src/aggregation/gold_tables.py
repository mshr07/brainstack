from typing import Dict

from pyspark.sql import DataFrame, Window
from pyspark.sql import functions as F

from src.config.settings import SKEW_SALT_BUCKETS


def build_gold_tables(
    customers: DataFrame,
    products: DataFrame,
    orders: DataFrame,
    order_items: DataFrame,
    payments: DataFrame,
    delivery_events: DataFrame,
    fraud_reference: DataFrame,
    enrichment: Dict[str, DataFrame],
) -> Dict[str, DataFrame]:
    orders.cache()
    order_items.cache()
    payments.cache()

    order_fact = (
        orders.alias("o")
        .join(customers.select("customer_id", "city", "state", "email_domain").alias("c"), "customer_id", "left")
        .select(
            "o.order_id",
            "o.customer_id",
            "o.order_date",
            "o.order_ts",
            F.coalesce(F.col("o.city"), F.col("c.city")).alias("city"),
            "c.state",
            "c.email_domain",
            "o.order_status",
            "o.channel",
            "o.is_cancelled",
            "o.is_late_arriving",
            "o.total_order_value",
            "o.discount_amount",
            "o.item_count",
        )
    )

    order_fact.createOrReplaceTempView("order_fact")
    daily_sales_summary = orders.sparkSession.sql(
        """
        SELECT
            order_date,
            COUNT(DISTINCT order_id) AS total_orders,
            ROUND(SUM(total_order_value), 2) AS gross_revenue,
            ROUND(SUM(discount_amount), 2) AS total_discount,
            ROUND(AVG(total_order_value), 2) AS avg_order_value,
            SUM(CASE WHEN is_cancelled THEN 1 ELSE 0 END) AS cancelled_orders
        FROM order_fact
        GROUP BY order_date
        ORDER BY order_date
        """
    )
    trend_window = Window.orderBy("order_date").rowsBetween(Window.unboundedPreceding, Window.currentRow)
    moving_window = Window.orderBy("order_date").rowsBetween(-6, 0)
    daily_sales_summary = (
        daily_sales_summary.withColumn("cumulative_revenue", F.round(F.sum("gross_revenue").over(trend_window), 2))
        .withColumn("seven_day_moving_avg_revenue", F.round(F.avg("gross_revenue").over(moving_window), 2))
        .withColumn("next_day_revenue", F.lead("gross_revenue").over(Window.orderBy("order_date")))
    )

    salted_items = order_items.withColumn("salt_bucket", F.pmod(F.abs(F.xxhash64("order_id")), F.lit(SKEW_SALT_BUCKETS)))
    salted_product_revenue = salted_items.groupBy("product_id", "salt_bucket").agg(
        F.sum("quantity").alias("partial_units_sold"),
        F.sum("net_item_amount").alias("partial_revenue"),
        F.avg("discount_pct").alias("partial_avg_discount"),
    )
    product_performance = (
        salted_product_revenue.groupBy("product_id")
        .agg(
            F.sum("partial_units_sold").alias("units_sold"),
            F.round(F.sum("partial_revenue"), 2).alias("product_revenue"),
            F.round(F.avg("partial_avg_discount"), 2).alias("avg_discount_pct"),
        )
        .join(F.broadcast(products.select("product_id", "product_name", "category", "brand", "margin_pct")), "product_id", "left")
        .withColumn("revenue_rank", F.rank().over(Window.orderBy(F.col("product_revenue").desc())))
        .withColumn("dense_revenue_rank", F.dense_rank().over(Window.orderBy(F.col("product_revenue").desc())))
        .orderBy(F.col("product_revenue").desc())
    )

    payment_failure_report = (
        payments.groupBy("payment_date", "payment_method", "gateway")
        .agg(
            F.count("*").alias("payment_attempts"),
            F.sum(F.when(F.col("payment_status_class") == "failure", 1).otherwise(0)).alias("failed_payments"),
            F.round(F.avg("gateway_latency_ms"), 2).alias("avg_gateway_latency_ms"),
            F.round(F.sum("amount"), 2).alias("attempted_amount"),
        )
        .withColumn("failed_payment_pct", F.round(F.col("failed_payments") / F.col("payment_attempts") * 100, 2))
        .orderBy(F.col("failed_payment_pct").desc())
    )

    delivered = (
        delivery_events.groupBy("order_id")
        .pivot("event_name", ["assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"])
        .agg(F.min("event_ts"))
    )
    delivery_performance_report = (
        orders.select("order_id", "order_date", "city")
        .join(delivered, "order_id", "left")
        .withColumn("delivery_minutes", F.round((F.col("delivered").cast("long") - F.col("assigned").cast("long")) / 60, 2))
        .withColumn("pickup_minutes", F.round((F.col("picked_up").cast("long") - F.col("assigned").cast("long")) / 60, 2))
        .withColumn("is_delivery_delayed", F.col("delivery_minutes") > 90)
        .groupBy("order_date", "city")
        .agg(
            F.count("*").alias("orders_with_delivery_tracking"),
            F.round(F.avg("delivery_minutes"), 2).alias("avg_delivery_minutes"),
            F.round(F.max("delivery_minutes"), 2).alias("max_delivery_minutes"),
            F.sum(F.when(F.col("is_delivery_delayed"), 1).otherwise(0)).alias("delayed_deliveries"),
        )
    )

    revenue_by_city = (
        order_fact.groupBy("city")
        .agg(
            F.countDistinct("order_id").alias("orders"),
            F.round(F.sum("total_order_value"), 2).alias("revenue"),
            F.round(F.avg("total_order_value"), 2).alias("avg_order_value"),
            F.collect_list("order_status").alias("observed_statuses"),
        )
        .orderBy(F.col("revenue").desc())
    )

    top_customers = (
        enrichment["customer_360"]
        .select("customer_id", "full_name", "city", "loyalty_tier", "total_orders", "customer_lifetime_value", "repeat_customer_flag")
        .withColumn("customer_rank", F.row_number().over(Window.orderBy(F.col("customer_lifetime_value").desc())))
        .filter(F.col("customer_rank") <= 25)
    )

    repeat_customer_metrics = (
        enrichment["customer_360"]
        .withColumn("signup_month", F.date_format("signup_date", "yyyy-MM"))
        .groupBy("signup_month", "city")
        .agg(
            F.count("*").alias("customers"),
            F.sum(F.when(F.col("repeat_customer_flag"), 1).otherwise(0)).alias("repeat_customers"),
            F.round(F.avg("customer_lifetime_value"), 2).alias("avg_ltv"),
        )
        .withColumn("repeat_customer_pct", F.round(F.col("repeat_customers") / F.col("customers") * 100, 2))
    )

    city_risk = fraud_reference.filter(F.col("reference_type") == "city").select(
        F.col("reference_value").alias("city"), F.col("risk_weight").cast("double").alias("city_risk_weight")
    )
    domain_risk = fraud_reference.filter(F.col("reference_type") == "email_domain").select(
        F.col("reference_value").alias("email_domain"), F.col("risk_weight").cast("double").alias("domain_risk_weight")
    )
    method_risk = fraud_reference.filter(F.col("reference_type") == "payment_method").select(
        F.col("reference_value").alias("payment_method"), F.col("risk_weight").cast("double").alias("method_risk_weight")
    )
    customer_risk = fraud_reference.filter(F.col("reference_type") == "customer_id").select(
        F.col("reference_value").alias("customer_id"), F.col("risk_weight").cast("double").alias("customer_risk_weight")
    )
    latest_payment = payments.withColumn(
        "payment_rank", F.row_number().over(Window.partitionBy("order_id").orderBy(F.col("payment_ts").desc_nulls_last()))
    ).filter(F.col("payment_rank") == 1)
    delivery_delay = delivery_performance_report.select(
        F.col("order_date").alias("delay_order_date"), F.col("city").alias("delay_city"), "avg_delivery_minutes"
    )

    fraud_risk_features = (
        order_fact.join(latest_payment.select("order_id", "payment_method", "payment_status_class", "risk_signal_count"), "order_id", "left")
        .join(city_risk, "city", "left")
        .join(domain_risk, "email_domain", "left")
        .join(method_risk, "payment_method", "left")
        .join(customer_risk, "customer_id", "left")
        .join(
            delivery_delay,
            (F.col("order_date") == F.col("delay_order_date")) & (F.col("city") == F.col("delay_city")),
            "left",
        )
        .fillna(
            {
                "city_risk_weight": 0.0,
                "domain_risk_weight": 0.0,
                "method_risk_weight": 0.0,
                "customer_risk_weight": 0.0,
                "risk_signal_count": 0,
                "avg_delivery_minutes": 0.0,
            }
        )
        .withColumn("high_amount_weight", F.when(F.col("total_order_value") > 5000, 20).otherwise(0))
        .withColumn("failed_payment_weight", F.when(F.col("payment_status_class") == "failure", 25).otherwise(0))
        .withColumn("night_order_weight", F.when(F.hour("order_ts").between(0, 5), 10).otherwise(0))
        .withColumn("delivery_delay_weight", F.when(F.col("avg_delivery_minutes") > 90, 10).otherwise(0))
        .withColumn(
            "fraud_risk_score",
            F.least(
                F.lit(100.0),
                F.col("city_risk_weight")
                + F.col("domain_risk_weight")
                + F.col("method_risk_weight")
                + F.col("customer_risk_weight")
                + F.col("high_amount_weight")
                + F.col("failed_payment_weight")
                + F.col("night_order_weight")
                + F.col("delivery_delay_weight")
                + F.col("risk_signal_count") * 5,
            ),
        )
        .withColumn(
            "fraud_risk_band",
            F.when(F.col("fraud_risk_score") >= 70, "high")
            .when(F.col("fraud_risk_score") >= 35, "medium")
            .otherwise("low"),
        )
        .drop("delay_order_date", "delay_city")
    )

    customer_360 = enrichment["customer_360"]

    for df in [orders, order_items, payments]:
        df.unpersist()

    return {
        "daily_sales_summary": daily_sales_summary,
        "customer_360": customer_360,
        "product_performance": product_performance,
        "payment_failure_report": payment_failure_report,
        "fraud_risk_features": fraud_risk_features,
        "delivery_performance_report": delivery_performance_report,
        "revenue_by_city": revenue_by_city,
        "top_customers": top_customers,
        "repeat_customer_metrics": repeat_customer_metrics,
    }
