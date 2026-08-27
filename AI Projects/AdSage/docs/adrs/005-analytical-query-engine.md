# ADR-005: DuckDB locally and Athena on AWS

- Status: Accepted
- Date: 2026-08-27

## Context

Analysts need SQL over partitioned Parquet locally without AWS and at cloud scale
without operating a permanent warehouse. Query policy must be engine-independent.

## Alternatives

PostgreSQL is convenient but unsuitable for lake scans. Trino offers consistent
local/cloud behavior but adds a cluster. Redshift provides predictable warehouse
performance with more cost/operations. Spark SQL has high interactive latency.

## Decision

Use DuckDB for local/integration analytical execution and Athena workgroups over
S3/Glue in AWS. Generate a neutral query plan and validate a configured sqlglot
dialect before adapter-specific SQL/explain/cost enforcement.

## Consequences and tradeoffs

Local development stays fast and cloud infrastructure is serverless. Dialect and
cost models differ, so equivalence/contract fixtures are required. Repeated heavy
workloads may later justify Trino/Redshift, based on measurements.
