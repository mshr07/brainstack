# Synthetic lake and medallion pipelines

Phase 2 implements a credential-free local analytical lake over synthetic
advertising data. It is a separate Python 3.12+ package because pipeline runtime
dependencies and release cadence do not belong to the internal AI service.

## What is implemented

- seeded UUIDv5 advertiser, campaign, ad group, ad, product, keyword, audience,
  placement, and experiment dimensions;
- impression, click, raw conversion, versioned attribution, and spend-ledger
  facts with UTC instants, advertiser-local business dates, fixed-precision USD,
  schema/attribution versions, duplicate corrections, and late arrivals;
- immutable Zstandard-compressed Bronze Parquet partitioned by business date and
  ingestion hour; only checksum-verified objects in completed batch manifests
  are visible to downstream jobs;
- PySpark Silver validation, relationship and causal-parent checks, stable-ID
  latest-record deduplication, seven-day correction window, reason-coded
  quarantine, compatible v1/v2 schema merge, and a measured publication gate;
- PySpark Gold `campaign_daily_metrics` with additive source measures and
  ratios recomputed from sums at the declared grain;
- staged immutable Silver/Gold versions, content-addressed run IDs, complete or
  failed manifests, and an atomically replaced `_current.json` catalog pointer;
- independent DuckDB assertions for grain uniqueness, nonnegative measures,
  and CTR/CPC/CPM/CVR/ROAS/ACOS/CPA formulas;
- strict, versioned canonical metric metadata in
  `resources/glossary/metrics.v1.yaml`.

Generated lake data is ignored by Git. It is synthetic, but tenant and source
markers remain explicit so later authorization layers do not learn unsafe data
shapes.

## Run locally

Prerequisites are Python 3.12+, `uv`, and Java 21. From the repository root:

```bash
make seed       # append/idempotently reuse the configured Bronze batch
make data-run   # generate, publish Silver and Gold, then validate with DuckDB
make data-test  # unit plus local Spark integration tests
```

The equivalent CLI is:

```bash
PYTHONPATH=pipelines/src uv run --project pipelines adsage-data --config pipelines/config/local.yaml run
PYTHONPATH=pipelines/src uv run --project pipelines adsage-data validate
PYTHONPATH=pipelines/src uv run --project pipelines adsage-data glossary
```

The default output is `data/lake`. To create an independent snapshot, copy
`pipelines/config/local.yaml` and set `lake_root` to another dedicated directory.
Configuration rejects unknown keys and broad roots such as `/` or `.`.

## Lake layout

```text
data/lake/
  bronze/
    _manifests/<source-batch>.json
    impression_events/event_date=YYYY-MM-DD/ingestion_hour=HH/*.parquet
    ... dimensions and event datasets ...
  silver/
    _current.json
    _manifests/<run-id>.json
    versions/<run-id>/
      campaign_event_facts/metric_date=YYYY-MM-DD/*.parquet
      dimensions/<dataset>/*.parquet
      quarantine/campaign_event_facts/reason_code=<code>/*.parquet
      manifest.json
      quality.json
  gold/
    _current.json
    _manifests/<run-id>.json
    versions/<run-id>/campaign_daily_metrics/metric_date=YYYY-MM-DD/*.parquet
```

Run IDs bind the pipeline version, typed configuration, and SHA-256 input
snapshot. Repeating an identical run is a no-op. New or corrected Bronze inputs
produce a new immutable version. Publication never overwrites an existing data
version; rollback is an operator-reviewed pointer change to an existing version.

## Schema and quality policy

Every physical Bronze object is checked before Spark schema merge. Required
field removal, known-field type change, an unsupported schema version, or a new
non-nullable field blocks the run. Nullable additions are accepted; dataset
columns survive Silver's union-by-name path. Schema v2 demonstrates this with
the nullable `device_os` field.

Silver keeps the latest `ingested_at` for each `(tenant_id, event_type,
event_id)`. Events arriving more than the configured correction window after
event time, invalid dimension references, broken causal parents, invalid money
or attribution values, non-synthetic rows, and date/currency mismatches enter
quarantine with a stable reason code. Publication requires at least the minimum
accepted row count and a quarantine rate no higher than the configured limit.
Failed runs retain their manifest and do not advance `_current.json`.

Gold grain is:

```text
tenant_id, metric_date, advertiser_id, campaign_id, country_code,
device_type, placement_id, currency, attribution_version
```

Currency is USD in the current fixture. Multi-currency conversion is not
silently performed. DuckDB reads the same Parquet output as Spark and recomputes
every ratio, protecting against average-of-ratios and denominator mistakes.

## Operational boundary

Phase 2 publishes to a local filesystem. The architecture's S3/MinIO/Athena
adapters, distributed object-store commit protocol, external catalog, retention
jobs, and production scheduler remain future work. Local rename and pointer
replacement are atomic only on one filesystem; do not represent this publisher
as an S3 commit protocol.
