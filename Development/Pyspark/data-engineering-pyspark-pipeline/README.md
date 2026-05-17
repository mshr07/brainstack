# Real-World Data Engineering PySpark Pipeline

This project is a complete local data engineering pipeline that looks like a real e-commerce, food-delivery, and transaction analytics platform. It ingests included static dirty source files into bronze, cleans and validates them into silver, enriches customer and clickstream data, and publishes gold analytics tables for reporting and ML features.

The default implementation uses PySpark, Spark SQL, CSV, JSON, and Parquet so it runs locally with:

```bash
pip install -r requirements.txt
python src/main.py
```

PySpark 3.5 works best with Java 8, 11, or 17. The project auto-selects a compatible JDK on macOS when the default Java is newer than Spark supports. If your machine has only Java 24 or newer, install JDK 17 or JDK 11 before running Spark.

PostgreSQL, Airflow, and Great Expectations are natural next steps, but they are not required for the local end-to-end run. The current project uses only Python, PySpark, Spark SQL, CSV, JSON, and Parquet for the data pipeline.

## Architecture

```text
Raw source files
  customers.csv | products.csv | orders.csv | order_items.csv
  payments.json | delivery_events.csv | clickstream_logs.json
  fraud_reference.csv | inventory_snapshot.parquet
        |
        v
Bronze layer
  Explicit schemas, corrupt record capture, ingestion timestamp, source file name
        |
        v
Silver layer
  Cleaning, type casting, deduplication, primary/foreign key checks, quarantine
        |
        v
Enrichment
  Customer 360, clickstream explode, SCD examples, behavioral features
        |
        v
Gold layer
  BI-ready aggregates, fraud features, delivery reports, customer metrics
```

## Folder Structure

```text
data-engineering-pyspark-pipeline/
├── data/
│   ├── raw/
│   ├── bronze/
│   ├── silver/
│   ├── gold/
│   └── quarantine/
├── src/
│   ├── aggregation/
│   ├── config/
│   ├── enrichment/
│   ├── ingestion/
│   ├── loading/
│   ├── transformation/
│   ├── utils/
│   ├── validation/
│   └── main.py
├── tests/
├── notebooks/
├── jobs/
├── requirements.txt
├── README.md
└── docker-compose.yml
```

## Dataset

Static raw test data is included under `data/raw/`. The pipeline does not generate dummy data at runtime.

| Dataset | Format | Purpose | Dirty data examples |
|---|---|---|---|
| `customers.csv` | CSV | Customer profile dimension | null IDs, duplicate customers, bad email, invalid dates, malformed row |
| `products.csv` | CSV | Product catalog | bad prices, negative prices, duplicate products, inconsistent active flags |
| `orders.csv` | CSV | Order headers | missing customer IDs, invalid timestamps, unknown statuses, duplicate order |
| `order_items.csv` | CSV | Order line items | invalid product IDs, negative quantities, bad prices, duplicate item |
| `payments.json` | JSON | Payment attempts | nested structs, arrays, maps, bad statuses, corrupted JSON lines |
| `delivery_events.csv` | CSV | Delivery event tracking | invalid dates, duplicate events, missing order FKs |
| `clickstream_logs.json` | JSON | Web/app events | nested arrays and structs, maps, corrupted JSON |
| `fraud_reference.csv` | CSV | Risk lookup table | city, email domain, payment method, customer risk weights |
| `inventory_snapshot.parquet` | Parquet | Product inventory | demonstrates raw Parquet ingestion |

## Medallion Layers

### Bronze

Implemented in `src/ingestion/bronze_ingestion.py`.

Bronze reads raw CSV, JSON, and Parquet with explicit schemas. It adds `ingestion_timestamp`, `source_file_name`, and `source_system`, captures malformed records in `_corrupt_record`, and writes each raw source as Parquet under `data/bronze/`.

It also logs an `inferSchema` example for `customers.csv` so you can compare inferred vs explicit schemas.

### Silver

Implemented in `src/transformation/`.

Silver applies production-style cleaning:

- Standardizes casing with `lower`, `upper`, `initcap`, and `trim`
- Cleans phone and text fields with `regexp_replace`, `split`, `substring`, and `concat_ws`
- Parses dates with `to_date` and `to_timestamp`
- Casts prices, quantities, and weights
- Deduplicates with `row_number` windows
- Validates primary keys and foreign keys
- Uses left semi and left anti joins for FK validation
- Sends invalid records to `data/quarantine/bad_records`
- Adds audit timestamps

### Gold

Implemented in `src/aggregation/gold_tables.py`.

Gold creates analytics-ready tables:

- `daily_sales_summary`
- `customer_360`
- `product_performance`
- `payment_failure_report`
- `fraud_risk_features`
- `delivery_performance_report`
- `revenue_by_city`
- `top_customers`
- `repeat_customer_metrics`

These tables are written to `data/gold/` as Parquet, with selected tables partitioned by date.

## How To Run

From the project root:

```bash
pip install -r requirements.txt
python src/main.py
```

Or:

```bash
chmod +x jobs/run_pipeline.sh
./jobs/run_pipeline.sh
```

Run tests:

```bash
pytest -q
```

The pipeline is idempotent for local learning. It validates the included raw test files, then overwrites bronze, silver, gold, and quarantine outputs on each run.

## Sample Output

After a successful run, the console prints a summary like:

```text
PIPELINE SUMMARY
bronze_tables: 9
silver_tables: 6
gold_tables: 9
quarantined_records: 991
bronze_path: .../data/bronze
silver_path: .../data/silver
gold_path: .../data/gold
```

It also shows sample rows from `daily_sales_summary` and `customer_360`, then prints a formatted explain plan for `product_performance`.

## PySpark Topics Covered

| Topic | Where used |
|---|---|
| SparkSession creation | `src/utils/spark_session.py` |
| DataFrame creation | unit tests |
| Read CSV, JSON, Parquet | `src/ingestion/bronze_ingestion.py` |
| Write Parquet | `src/loading/data_writer.py` |
| Explicit schemas | `src/ingestion/bronze_ingestion.py` |
| inferSchema comparison | `ingest_bronze()` |
| `show`, `printSchema`, `explain` | `src/main.py`, bronze ingestion |
| `select`, `filter`, `where` | transformations and aggregations |
| `withColumn`, `drop`, rename via alias | transformations and gold tables |
| `cast` | all silver transformations |
| `alias` | `gold_tables.py` |
| `distinct`, `dropDuplicates` | FK checks and silver deduplication |
| `orderBy`, `sort`, `limit` style ranking | gold tables |
| `unionByName` | quarantine consolidation |
| Inner/left/right/full/semi/anti concepts | joins use left, semi, anti; README explains full/right use cases |
| Aggregations | all gold tables |
| `count`, `sum`, `avg`, `min`, `max` | gold metrics |
| `collect_list`, `collect_set` | orders and revenue reports |
| `when/otherwise` | business classifications |
| `isNull`, `isNotNull` | validation |
| `coalesce`, `fillna`, `dropna` concept | silver cleaning |
| `regexp_replace`, `split`, `concat_ws`, `substring` | customer cleaning |
| Date functions | order, payment, delivery transformations |
| Window functions | dedupe, rank, lag, lead, running revenue |
| `row_number`, `rank`, `dense_rank` | silver and product performance |
| Running totals and moving averages | `daily_sales_summary` |
| `repartition`, `coalesce` | writer and performance notes |
| Cache/persist | `gold_tables.py` |
| Broadcast joins | product enrichment and product performance |
| Data skew and salting | product performance aggregation |
| UDFs | payment gateway normalization |
| Avoiding UDFs | built-ins are used everywhere else |
| Spark SQL temp views | `daily_sales_summary` |
| `explode` | clickstream enrichment |
| Arrays, structs, maps | payment and clickstream JSON |
| Pivot | delivery event report |
| Unpivot concept | use Spark SQL `stack()` when converting wide metric columns to long metric rows |
| Partitioning | writes by `order_date` and `payment_date` |

## Real-World Concepts Covered

- ETL and ELT: raw data is extracted and loaded to bronze, then transformed into silver and gold.
- Batch pipeline: `src/main.py` runs the complete batch flow.
- Incremental loading: `is_late_arriving` demonstrates watermark-style late data logic using `LATE_ARRIVING_DAYS`.
- Deduplication: business keys are deduped with window functions.
- SCD Type 1 and Type 2: current customer dimension and customer history examples are built in enrichment.
- Fact and dimension modeling: orders and order items form fact tables; customers and products form dimensions.
- Star schema: gold tables join fact data with dimensions for reporting.
- Surrogate keys: product and customer keys use `xxhash64`.
- Audit columns: bronze and silver include ingestion and processing timestamps.
- Error handling: pipeline logs failures and raises exceptions.
- Quarantine: invalid and orphan records are stored in `data/quarantine/bad_records`.
- Data quality checks: reusable functions live in `src/validation/data_quality.py`.
- Schema evolution: explicit schemas are centralized in ingestion; Parquet can evolve with added nullable columns.
- Configuration management: `src/config/settings.py` reads environment variables.
- Idempotency: rerunning validates the static raw files and overwrites derived layers.
- Unit tests: `tests/test_data_quality.py`.

## Performance Notes

Spark has a driver process that plans work and executors that run tasks. Transformations are lazy; actions such as `count`, `show`, and writes trigger execution. Narrow transformations like `select` and `filter` avoid shuffles, while wide transformations like `groupBy`, joins, and window functions can shuffle data.

This project demonstrates:

- Column pruning by selecting only needed columns before joins
- Predicate pushdown through Parquet reads
- Broadcast joins for small dimension data
- Cache before repeated gold aggregations
- Salting for a skewed product aggregation
- Date partitioning for common analytical filters
- Coalescing small local outputs to reduce small files
- Avoiding `collect()` in pipeline logic
- Using built-in functions instead of UDFs except for one explicit UDF teaching example
- `explain(mode="formatted")` to inspect physical plans

In production, tune file sizes to roughly 128-512 MB, use partition columns with high business value and moderate cardinality, compact small files, and avoid over-partitioning by user IDs or unique keys.

## Business Logic

The pipeline calculates:

- Total order value and discount amount
- Payment success, failure, and pending classes
- Customer lifetime value
- Repeat customer flags
- High-value customer segments
- Fraud risk scores
- Delivery delay metrics
- Cancelled order indicators
- Product revenue ranking
- Daily revenue trend and cumulative revenue
- City-wise sales
- Failed payment percentage

## Docker

`docker-compose.yml` starts a local PostgreSQL database for extension work:

```bash
docker compose up -d
```

The default pipeline does not require PostgreSQL. A common extension is to write gold tables to Postgres using the Spark JDBC writer and a PostgreSQL JDBC driver.

## Interview Explanation

### Project Summary

"I built a PySpark medallion architecture pipeline that simulates a real transaction and delivery data platform. It ingests dirty CSV, JSON, and Parquet files, captures corrupt records in bronze, cleans and validates data in silver, enriches customers with order, payment, and clickstream behavior, and publishes gold analytics tables for reporting and fraud features."

### Problem Statement

Operational systems produce messy data from multiple sources. Analytics and ML teams need trusted, joined, historical, and business-ready tables. This pipeline turns raw operational data into reliable analytical datasets.

### Architecture

Raw files land in `data/raw`, bronze preserves source fidelity with audit metadata, silver enforces data quality and relationships, and gold builds business tables such as customer 360, sales summaries, payment failures, delivery performance, and fraud risk features.

### Data Flow

`src/main.py` validates the included dirty source files, creates a SparkSession, runs bronze ingestion, runs silver transformations and validation, writes quarantine records, builds enrichment tables, creates gold outputs, and prints processing metrics.

### Transformations

Important transformations include email and phone cleanup, timestamp parsing, order total calculations, duplicate removal with `row_number`, FK checks with semi and anti joins, nested JSON flattening with `explode`, delivery lifecycle pivoting, payment classification, and customer lifetime value aggregation.

### Optimization Techniques

The project uses explicit schemas, column selection, broadcast joins, caching for repeated gold workloads, salting for skewed product revenue aggregation, partitioned writes, coalesced local outputs, and explain plans.

### Data Quality Handling

Bad records are not silently dropped. Invalid primary keys, malformed records, bad dates, invalid prices, duplicate business keys, and orphan foreign keys are written to quarantine with a reason and timestamp.

### Real-World Business Value

The gold layer supports executive sales dashboards, customer segmentation, product performance analysis, payment reliability monitoring, delivery SLA tracking, and fraud feature generation for ML.

### Possible Improvements

- Add merge-based incremental loading with a lakehouse table format if your production platform supports it
- Orchestrate with Airflow
- Add Great Expectations validation suites
- Write serving tables to PostgreSQL or a warehouse
- Add streaming ingestion with Kafka
- Add CI/CD and data contract checks
- Add ML training on `fraud_risk_features`

## Resume Bullet

Built an end-to-end PySpark medallion data platform that ingests dirty CSV/JSON/Parquet e-commerce data, applies schema enforcement, data quality validation, quarantine handling, dimensional enrichment, customer 360 modeling, fraud feature engineering, and gold-layer analytics with Spark SQL, window functions, broadcast joins, partitioning, and skew salting.
