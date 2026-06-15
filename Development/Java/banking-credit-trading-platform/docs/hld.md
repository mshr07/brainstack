# High-Level Design

The platform is split by banking capability. Market data owns instruments and ticks. RFQ owns quote negotiation. OMS owns orders and executions. Risk owns limits and decisions. Reporting owns audit queries and regulatory-style exports. API Gateway owns authentication and protected facade APIs.

Data flow: market ticks enter market-data-service, RFQs are created in rfq-service, accepted quotes trigger order creation in oms-service, risk decisions validate orders, execution is simulated by OMS/FIX gateway, and audit/reporting surfaces lifecycle data.

Kafka topics: market-data.ticks, rfq.created, rfq.quoted, rfq.accepted, order.created, order.risk.checked, order.executed, risk.rejected, audit.events, incident.events. Each service includes correlation IDs so logs and events can be joined during support.

PostgreSQL is the runnable durable database. H2 is used as a simple local default. Redis caches active RFQs, market snapshots, reference data, client risk limits, and idempotency keys. The README and infra folder show Prometheus, Grafana, OpenTelemetry, and ELK support.
