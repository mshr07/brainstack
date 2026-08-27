# Operations

## Service-level indicators

Measure availability, error classifications, p50/p95/p99 end-to-end latency,
provider/retrieval/SQL latency, completion/approval rates, queue age, saturation,
token/cost use and cache behavior. Objectives and alerts remain targets until
real baselines exist. Metrics must not use tenant, user, conversation or request
IDs as labels.

## Degraded modes

| Failure | Behavior |
| --- | --- |
| primary model | deadline/budget-aware fallback provider; disclose fallback |
| all models | return evidence/tool results when safe or typed unavailable state; never fabricate |
| PostgreSQL | reject durable mutations; health not ready; do not claim audit/persistence |
| Redis | bypass safe caches, use conservative in-process rate policy; no authorization bypass |
| Neo4j | disable graph-dependent result or use published catalog relationships with limitation |
| retrieval empty | ask clarification or report no governed evidence |
| SQL generation/validation | bounded repair for eligible failures, otherwise no execution |
| SQL timeout | cancel server-side, audit timeout, no automatic expensive retry |
| stale metadata | block risky query or label read-only documentation answer with version/freshness |
| step/token/cost budget | deterministic terminal budget state with partial evidence |
| client disconnect | propagate cancellation; finish only required audit cleanup |

Readiness checks mandatory dependencies needed for safe service. Liveness checks
only process health and never restart on a downstream outage. Circuit breakers
protect providers/graph, bulkheads prevent one tenant/tool from consuming all
capacity, and exponential backoff with full jitter is used only for idempotent
retryable operations.

## Local operations

Run `make infra-up`, inspect `docker compose ps`, then start the services using
the commands printed by `make dev`. `make down` preserves named volumes;
`docker compose down -v` destroys local dependency data and must be intentional.

Configuration comes from environment variables. Copy `.env.example` and change
local credentials. Production configurations must use secret references and must
not use the example issuer/token/passwords.

The local lake is operated separately with `make seed`, `make data-run`, and
`make data-test`. Each Silver/Gold run writes an immutable version and advances
`_current.json` only after Spark quality gates and, for Gold, DuckDB formula
assertions pass. Diagnose a failed run from its `_manifests/<run-id>.json` and
reason-coded Silver quarantine. An unchanged input/configuration rerun is a
no-op. Rollback must select a previously completed immutable version and update
the pointer atomically after review; never edit Parquet objects in place.

## Deployment and rollback

Containers are immutable, non-root and versioned by commit. Helm uses rolling
updates, readiness/liveness/startup probes, resource requests/limits, HPA and
PodDisruptionBudget. Database changes use expand/migrate/contract; Flyway
migrations are forward-only after merge. Roll back application before contracting
schemas. Prompt/model/retriever configuration has independent immutable versions
and rollback pointers.

Worker events carry idempotency keys and outbox IDs. Consumers claim with bounded
visibility, record completion atomically, and send poison work to a DLQ after a
bounded attempt policy. Operators replay only after cause and tenant scope are
reviewed.

## Incident diagnostics

Start with request ID/trace ID, error class, circuit state and dependency health.
Use traces for high-cardinality request detail, logs for redacted events, and
metrics for aggregate impact. Never enable raw prompt/query-result logging as an
incident shortcut. Audit access and emergency configuration changes.

## Cost controls

Developer environments default to local dependencies and scale-to-zero app
processes. AWS uses lifecycle rules, Athena workgroup scan caps, autoscaling,
short non-production database schedules where allowed, token/cost budgets and
per-tenant quotas. Terraform plans must include a cost review; no cost estimate
is presented as a measured bill.
