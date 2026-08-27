# Final architecture

## Goals and constraints

AdSage answers analytical and data-discovery questions over synthetic
advertising data while preserving deterministic security and metric semantics.
The design optimizes for correctness, evidence, bounded execution, graceful
degradation, and a local path that needs no cloud or model credentials.

The architecture separates stable platform policy from faster-moving AI/data
logic. It uses a technology only where its workload is defensible: PostgreSQL
for transactional state and vectors, Redis for ephemeral coordination and
policy-scoped caches, Neo4j for variable-depth lineage/join traversal, Parquet
for analytical storage, and Spark for repeatable high-volume transforms.

## Service boundaries

| Boundary | Owns | Does not own |
| --- | --- | --- |
| Web application | accessible interaction, streaming display, SQL/result/citation views, feedback and HITL forms | trust, authorization, SQL policy, provider secrets |
| Platform service (Java) | public APIs, OIDC/JWT validation, RBAC, conversation/session lifecycle, audit, rate/idempotency policy, SSE gateway, approval workflow | prompt reasoning, retrieval ranking, SQL generation |
| AI orchestrator (Python) | bounded intent/planning graph, context budgets, provider routing, retrieval orchestration, safe-SQL planning/validation coordination, evidence/answer assembly | authentication authority, entitlement grants, arbitrary database access |
| Metadata service module | versioned metadata, glossary, provenance, review/publish state, embedding jobs | automatic trust of low-confidence proposals |
| Query gateway module | catalog resolution, AST/policy validation, cost check, isolated execution, result constraints | free-form SQL execution |
| Data pipelines | synthetic sources, Bronze/Silver/Gold transforms, quality/late-data controls, catalog publication | online conversations |
| MCP server | typed façade over already-authorized platform capabilities | alternate or privileged data path |
| Evaluation runner | immutable golden cases, deterministic metrics, optional judge adapters, release gate reports | online authorization or production prompt edits |

Phase 1 deploys the platform and AI boundaries as separate processes. Metadata,
query, MCP, and evaluation begin as cohesive modules with explicit ports; they
should become independent services only when scale, ownership, or failure
isolation justifies operational cost.

## Runtime request path

1. The web client sends a bearer token and an idempotency key to Spring.
2. Spring validates identity, tenant membership, scopes, rate limits, input, and
   conversation access. It creates the audit/request record transactionally.
3. Spring signs/forwards a minimized principal context, W3C trace context,
   request ID, deadline, and orchestration request over the internal channel.
4. The orchestrator applies deterministic guardrails, classifies intent, builds
   a bounded plan, then selects only necessary tools. Independent retrievals may
   run concurrently under one deadline.
5. Tools independently re-check the provided capability and tenant policy. SQL
   follows the complete validation path in `SECURITY.md`.
6. The critic checks that claims map to evidence and metric definitions. The
   answer contains citations, confidence factors, limitations, tool outcomes,
   and no private reasoning.
7. Spring persists the event/audit summary and streams policy-filtered events.

Cancellation propagates from the browser through both services. An overall
deadline dominates per-tool timeouts; retries consume a shared retry budget and
never extend the deadline.

## Data architecture

### Lake and medallion model

- **Bronze:** immutable source-shaped synthetic events, partitioned by
  `event_date` and ingestion hour. Each record has `event_id`, `event_time`,
  `ingested_at`, schema version, synthetic tenant, and source batch.
- **Silver:** validated, normalized and deduplicated facts/dimensions. Merge keys
  are stable event IDs; late arrivals use event-time watermarks plus correction
  windows. Invalid records enter a reason-coded quarantine.
- **Gold:** business-ready daily/hourly aggregates such as
  `campaign_daily_metrics`, partitioned by metric date. Additive numerator and
  denominator measures are retained; ratios are calculated from sums, never
  averaged.

Manifests record input snapshots, code/schema version, output partitions,
quality results, and run ID. Publishing uses staged output plus an atomic catalog
pointer so reruns are idempotent. Schema evolution allows backward-compatible
nullable additions automatically; type changes and removals require a new schema
version and review.

### Operational stores

- PostgreSQL: users' conversation references, message/audit metadata, approvals,
  feedback, prompt/model traces, metadata versions, evaluation runs, and
  pgvector embeddings. Tenant IDs participate in unique/index keys and row-level
  policy.
- Redis: rate-limit buckets, short-lived idempotency responses, conversation
  summaries, catalog/retrieval caches, and health state. Redis failure degrades
  caching; it does not bypass authorization or durable auditing.
- Neo4j: published dataset/column/metric lineage and safe join relationships.
  Every node/edge carries tenant/scope or global visibility. A graph outage
  disables graph-dependent explanations and falls back to catalog joins.
- Parquet/S3: analytical system of record. DuckDB reads the same layout locally;
  Athena reads it in AWS.

## Metadata architecture

The canonical model represents dataset, field, grain, owner, domain, keys,
partitions, freshness, quality, classifications, policies, sample queries,
lineage and versioned relationships. Metric definitions contain formula AST,
required measures/dimensions, aggregation policy, owner, version, and validity
interval. Only published versions are visible to answer generation.

Ingestion produces a detected schema and deterministic profiling. The curation
model may propose descriptions, domain, sensitivity, and joins with confidence
and evidence. Policy routes sensitive, conflicting, or low-confidence proposals
to human review. Accepted proposals create an immutable publication, record
actor/provenance, update embeddings, and transactionally enqueue graph refresh.
Rejections are retained for evaluation, never silently republished.

Retrieval APIs are capability-scoped: search metadata, get schema/version, find
join path, get metric definition, and lineage. Cache invalidation uses the
published metadata version as part of each key.

## RAG architecture

Sources include published schema metadata, glossary definitions, approved SQL,
analyst docs, runbooks, FAQs, quality/lineage docs, and reviewed corrections.
An ingestion record preserves source URI, version, ACL, checksum, loader,
classification and effective interval. Chunkers are pluggable: recursive text is
the baseline; semantic chunking is enabled only after evaluation.

At query time, ACL/date/domain filters are mandatory before ranking. Dense
pgvector retrieval and PostgreSQL full-text retrieval run in parallel, are
normalized, and fuse with reciprocal-rank fusion. Optional query rewriting,
multi-query expansion, MMR, reranking and compression each have configuration,
latency budgets, provenance, and ablation tests. Retrieved chunks remain
untrusted. Citations bind final claims to immutable source/version/chunk IDs.

GraphRAG is selected for lineage, join paths and metric dependency questions.
It expands only typed, policy-visible relationships with hop/result limits, then
combines graph facts with vector evidence. Simple definition lookups avoid graph
and agent overhead.

## Observability architecture

W3C `traceparent` and a validated `X-Request-Id` span browser, Spring, FastAPI,
retrieval, provider, SQL, graph and tools. OpenTelemetry exports traces and
metrics; structured logs use the same IDs. LLM spans follow a Langfuse-compatible
shape containing prompt name/version, provider/model, parameters, token counts,
cost estimate, evidence IDs and outcome—not prompt secrets or hidden reasoning.

Dashboards cover request/error/saturation rate; p50/p95/p99 latency; provider and
SQL latency/success/repair; retrieval measures; token/cost budgets; cache hits;
feedback; circuit state; and queue lag. Alert thresholds begin as explicitly
labeled targets and are tuned from measured baselines. High-cardinality IDs stay
in traces/logs, not metric labels.

## Local development architecture

Docker Compose runs PostgreSQL with pgvector, Redis, Neo4j, and MinIO on a private
network with health checks and persistent named volumes. Applications can run on
the host for fast reload or in the `app` Compose profile. Phase 2 Spark jobs
publish versioned local Parquet and DuckDB independently validates Gold formulas;
the later query adapter will read the same layout from local storage or MinIO.
Deterministic model and embedding adapters exist only for tests/development and
are visibly reported; real providers are enabled by credentials/configuration.
No AWS account is required.

## AWS target architecture

```text
Route53/WAF -> ALB -> EKS private workloads
                        |-- platform pods -> Aurora PostgreSQL/pgvector
                        |-- AI pods ------> ElastiCache / model endpoints
                        |-- workers ------> SQS
                        `-- query role ---> Athena -> Glue Catalog -> S3 lake
                                                      `-> Lake Formation grants
```

EKS is selected over ECS because independently scaled services, Spark operators/
jobs, admission policy, service telemetry, and portable Helm packaging justify
the control plane. Smaller environments should use ECS/Fargate or managed batch
jobs to reduce cost. Workloads use IRSA with separate IAM roles. S3 uses KMS,
versioning, lifecycle and access logs; Aurora and ElastiCache stay private;
secrets live in Secrets Manager; CloudWatch receives managed-service logs while
the OpenTelemetry collector exports application telemetry. Glue crawlers do not
automatically publish trusted schemas: a curation gate controls catalog updates.

Athena workgroups enforce output location, encryption and scan limits. Lake
Formation grants plus query-gateway policy provide defense in depth. SQS carries
durable evaluation, embedding, curation and graph-sync jobs; Kafka/MSK is deferred
until ordering/throughput requirements demonstrate a need.

## Repository tree (target)

```text
AdSage/
├── apps/web
├── contracts/{openapi,schemas}
├── docs/{adrs,design}
├── infra/{docker,helm,terraform}
├── observability/{otel,prometheus,grafana}
├── pipelines/{generator,spark,quality,tests}
├── services/
│   ├── adsage-platform-service
│   ├── ai-orchestrator
│   └── mcp-server                 # Phase 7
├── tests/{contract,e2e,performance,security}
└── .github/workflows
```

## Concurrency and resilience

Java uses a bounded executor only for independent downstream calls and SSE work;
blocking database and HTTP pools are separately bounded. Immutable request
contexts avoid shared mutable state. Idempotency state transitions are enforced
by unique tenant/key constraints and compare-and-set updates. Python uses async
I/O and structured task groups for independent retrieval; semaphores bound each
provider. Neither runtime creates per-request unbounded threads/tasks.

Bulkheads, deadline-aware exponential backoff with full jitter, circuit breakers,
and fallback providers apply only to retryable failures. Validation failures are
not retried. Degraded modes are explicit in the response and detailed in
`OPERATIONS.md`.
