import sys
from pathlib import Path
from typing import Dict

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from pyspark.sql import DataFrame

from src.aggregation.gold_tables import build_gold_tables
from src.config.settings import BRONZE_DIR, GOLD_DIR, QUARANTINE_DIR, SILVER_DIR, ensure_directories, validate_raw_data_available
from src.enrichment.customer_enrichment import build_customer_enrichment
from src.ingestion.bronze_ingestion import ingest_bronze
from src.loading.data_writer import write_table
from src.transformation.silver_customers import transform_customers
from src.transformation.silver_delivery import transform_delivery_events
from src.transformation.silver_orders import transform_orders
from src.transformation.silver_payments import transform_payments
from src.transformation.silver_products import transform_products
from src.utils.logger import get_logger
from src.utils.spark_session import get_spark
from src.validation.data_quality import run_quality_checks, union_quarantine_tables


logger = get_logger(__name__)


def _write_named_tables(tables: Dict[str, DataFrame], base_dir: Path, partitioning: Dict[str, list] | None = None) -> None:
    partitioning = partitioning or {}
    for name, df in tables.items():
        write_table(df, base_dir / name, partition_cols=partitioning.get(name), coalesce_files=True)
        logger.info("Wrote %-28s rows=%s path=%s", name, df.count(), base_dir / name)


def main() -> None:
    ensure_directories()
    validate_raw_data_available()
    spark = get_spark()

    try:
        logger.info("Pipeline started")
        logger.info("Using static raw test data from the data/raw directory.")

        bronze = ingest_bronze(spark)

        customers, bad_customers = transform_customers(bronze["customers"])
        products, bad_products = transform_products(bronze["products"], bronze["inventory_snapshot"])
        orders, order_items, bad_orders = transform_orders(bronze["orders"], bronze["order_items"], customers, products)
        payments, bad_payments = transform_payments(bronze["payments"], orders)
        delivery_events, bad_delivery = transform_delivery_events(bronze["delivery_events"], orders)

        silver = {
            "customers": customers,
            "products": products,
            "orders": orders,
            "order_items": order_items,
            "payments": payments,
            "delivery_events": delivery_events,
        }
        _write_named_tables(
            silver,
            SILVER_DIR,
            partitioning={"orders": ["order_date"], "payments": ["payment_date"]},
        )

        quarantine = union_quarantine_tables([bad_customers, bad_products, bad_orders, bad_payments, bad_delivery])
        write_table(quarantine, QUARANTINE_DIR / "bad_records", coalesce_files=True)
        logger.info("Wrote quarantine bad_records rows=%s path=%s", quarantine.count(), QUARANTINE_DIR / "bad_records")

        quality_metrics = run_quality_checks(silver)
        logger.info("Data quality metrics: %s", quality_metrics)

        enrichment = build_customer_enrichment(customers, orders, payments, bronze["clickstream_logs"])
        _write_named_tables(enrichment, SILVER_DIR)

        gold = build_gold_tables(
            customers=customers,
            products=products,
            orders=orders,
            order_items=order_items,
            payments=payments,
            delivery_events=delivery_events,
            fraud_reference=bronze["fraud_reference"],
            enrichment=enrichment,
        )
        _write_named_tables(
            gold,
            GOLD_DIR,
            partitioning={
                "daily_sales_summary": ["order_date"],
                "delivery_performance_report": ["order_date"],
            },
        )

        logger.info("Example output: daily_sales_summary")
        gold["daily_sales_summary"].show(10, truncate=False)
        logger.info("Example output: customer_360")
        gold["customer_360"].select("customer_id", "full_name", "city", "total_orders", "customer_lifetime_value", "customer_segment").show(
            10, truncate=False
        )
        logger.info("Physical plan for product_performance")
        gold["product_performance"].explain(mode="formatted")

        summary = {
            "bronze_tables": len(bronze),
            "silver_tables": len(silver),
            "gold_tables": len(gold),
            "quarantined_records": quarantine.count(),
            "bronze_path": str(BRONZE_DIR),
            "silver_path": str(SILVER_DIR),
            "gold_path": str(GOLD_DIR),
        }
        print("\nPIPELINE SUMMARY")
        for key, value in summary.items():
            print(f"{key}: {value}")
        logger.info("Pipeline completed successfully")
    except Exception:
        logger.exception("Pipeline failed")
        raise
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
