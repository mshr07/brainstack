# Phase 2 implementation review

## Delivered scope

Phase 2 is a data-first vertical slice under `pipelines`: deterministic synthetic
advertising hierarchy and event generation; manifested immutable Bronze Parquet;
PySpark Silver deduplication, correction-window handling, relationship checks,
reason-coded quarantine, and quality gating; PySpark Gold campaign daily metrics;
versioned staged publication; a canonical glossary seed; and independent DuckDB
grain and ratio assertions.

The implementation preserves the approved boundaries. Pipelines do not move
authentication or authorization into AI code, do not publish mock analytical
answers, and do not change the Phase 1 service or cross-service contracts.

## Security and failure review

- only completed, checksum-matching Bronze manifests enter a run;
- incompatible schemas fail before Spark's merge-by-name behavior;
- stable IDs and latest ingestion timestamps make correction reruns deterministic;
- invalid relationships, causal parents, dates, currency, money, attribution,
  non-synthetic rows, and over-window arrivals are quarantined;
- failed quality gates retain evidence and do not advance a catalog pointer;
- immutable output versions are never overwritten;
- DuckDB recomputes every published ratio from additive measures;
- generated data and virtual environments remain excluded from version control.

## Explicit limitations

Publication currently uses atomic rename and pointer replacement on one local
filesystem. It is not an S3/MinIO distributed commit protocol. There is no
external scheduler/catalog, retention automation, multi-currency conversion,
streaming watermark state, or production observability exporter yet. The Gold
dataset is not exposed to users because safe text-to-SQL and authorization-aware
query serving belong to later phases.

## Verification record

The default local `make data-run` generated 539 raw event rows, deduplicated 14,
accepted 516 into Silver, and quarantined 9 (5 unknown-campaign fixtures and 4
arrivals beyond the correction window). Thirty-five accepted rows were measured
as late within the window. Gold published 36 rows; DuckDB reported zero failures
across grain, negative-measure, and seven canonical ratio assertions. A
second identical run reported Bronze, Silver, and Gold as skipped, confirming the
content-addressed no-op path.

`make lint` passed Java, both Python packages, and web static checks. `make test`
passed 6 runnable Java tests, 9 AI tests, 13 data tests, 3 web tests, and all four
contract documents. The Docker-backed Java Flyway migration test remained
skipped because the local Docker daemon was unavailable; this pre-existing
environment limitation was not hidden or converted into a passing test.

No coverage, throughput, latency, cost, cloud, or AI-quality result was measured
or claimed.
