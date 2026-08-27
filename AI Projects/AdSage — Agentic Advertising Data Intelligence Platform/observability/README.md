# Observability boundary

Phase 1 exposes application health/Prometheus endpoints and propagates correlation
context. Phase 8 adds the OpenTelemetry collector, Prometheus scrape configuration,
Grafana dashboards and Langfuse-compatible LLM trace exporter described in
`ARCHITECTURE.md`. High-cardinality identifiers belong in traces/logs, not labels.
