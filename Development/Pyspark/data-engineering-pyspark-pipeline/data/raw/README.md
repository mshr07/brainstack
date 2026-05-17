# Static Raw Test Data

This directory contains static CSV, JSON, and Parquet source files used by the pipeline.

The project intentionally does not generate dummy data at runtime. `src/main.py` validates that these files exist and then starts bronze ingestion.

Required files:

- `customers.csv`
- `products.csv`
- `orders.csv`
- `order_items.csv`
- `payments.json`
- `delivery_events.csv`
- `clickstream_logs.json`
- `fraud_reference.csv`
- `inventory_snapshot.parquet/`

The files include realistic dirty records: nulls, duplicates, invalid dates, malformed rows, inconsistent casing, wrong numeric values, orphan foreign keys, corrupted JSON lines, outliers, and late-arriving style dates.
