# System design and contracts

## Primary domain model

The advertising hierarchy is tenant-scoped:

```text
Advertiser 1--* Campaign 1--* AdGroup 1--* Ad
Campaign *--* Product       Campaign *--* Audience
AdGroup *--* Keyword        Ad *--1 Placement (per serving event)
Campaign 1--* Experiment

Impression -> optional Click -> optional Conversion
      |              |               |
      `-- campaign/ad/ad-group/placement/audience/product dimensions
Spend <- delivery ledger; attributed sales <- versioned attribution result
```

Stable synthetic IDs are UUIDs. Money uses fixed-precision decimal plus currency;
times are UTC instants; business dates are derived using the advertiser timezone.
Events carry schema/attribution versions. Conversion attribution is a separate
versioned fact so changing an attribution model never rewrites raw conversion
events.

Canonical metrics are metadata, not prompt prose:

| Metric | Canonical formula | Aggregation rule |
| --- | --- | --- |
| impressions | `SUM(impressions)` | additive |
| clicks | `SUM(clicks)` | additive |
| CTR | `SUM(clicks) / NULLIF(SUM(impressions), 0)` | recompute ratio |
| spend | `SUM(advertising_spend)` | additive in one currency |
| CPC | `SUM(advertising_spend) / NULLIF(SUM(clicks), 0)` | recompute ratio |
| CPM | `1000 * SUM(advertising_spend) / NULLIF(SUM(impressions), 0)` | recompute ratio |
| conversions | `SUM(attributed_conversions)` | attribution-version bound |
| CVR | `SUM(attributed_conversions) / NULLIF(SUM(clicks), 0)` | recompute ratio |
| attributed sales | `SUM(attributed_sales)` | currency/attribution-version bound |
| ROAS | `SUM(attributed_sales) / NULLIF(SUM(advertising_spend), 0)` | recompute ratio |
| ACOS | `SUM(advertising_spend) / NULLIF(SUM(attributed_sales), 0)` | recompute ratio |
| CPA | `SUM(advertising_spend) / NULLIF(SUM(attributed_conversions), 0)` | recompute ratio |

The published glossary adds description, required dimensions/measures, allowed
grain/aggregation, owner, semantic version, and validity interval.

## Platform database model

All user-owned rows include `tenant_id`; timestamps are UTC; mutable records use
optimistic versioning. Phase 1 migrations create the first four tables.

| Table | Important fields/invariants |
| --- | --- |
| `conversation` | UUID, tenant, owner subject, title, status, created/updated; tenant+UUID indexed |
| `conversation_message` | UUID, conversation, role, sanitized content, request ID, sequence, created; unique conversation+sequence |
| `orchestration_run` | run/request/conversation, state, intent, deadlines/budgets, prompt/model metadata, token/cost, terminal error |
| `audit_event` | append-only actor, action, resource, decision, policy version, redacted details, trace/request/time |
| `idempotency_record` | tenant+subject+route+key unique, request hash, state, encrypted/capped response, expiry |
| `approval_request` | type, proposed action, evidence, risk/cost, state, reviewer/decision/version |
| `feedback` | run, rating, optional correction, status; raw feedback never trains automatically |
| `metadata_entity/version` | stable identity plus immutable proposal/published versions and provenance |
| `metric_definition` | formula AST, requirements, owner, version/effective interval, publication state |
| `document/chunk` | source/version/ACL/checksum/classification plus text/vector/search document |
| `evaluation_case/run/result` | versioned expectations, configuration snapshot, per-metric results |

PostgreSQL row security is defense in depth; the application always predicates by
tenant. Pgvector indexes are chosen after corpus/recall measurement rather than
hard-coded as an assumed win.

## API contracts

The versioned OpenAPI files in `contracts/openapi` are authoritative.

### Public platform API

- `POST /v1/conversations` creates a conversation; idempotency required.
- `GET /v1/conversations` lists only the caller's visible conversations.
- `POST /v1/conversations/{id}/messages` submits one question and returns `202`
  with run/status locations; SSE is the normal response channel.
- `GET /v1/runs/{id}/events` streams typed `status`, `plan`, `tool`, `evidence`,
  `sql-preview`, `approval-required`, `answer`, and `error` events.
- `POST /v1/approvals/{id}/decision` performs approve/edit/reject under optimistic
  concurrency and an administrative scope.
- `POST /v1/runs/{id}/feedback` records thumbs/correction.
- `GET /v1/metadata/...` provides published, authorized catalog views.

Every mutation accepts `Idempotency-Key`; every response contains `X-Request-Id`.
Errors use RFC 9457 Problem Details and never expose provider/database internals.
List endpoints use opaque cursors and bounded page sizes.

### Internal orchestration API

`POST /internal/v1/orchestrations` accepts IDs, trusted principal capabilities,
question, locale/timezone, deadlines and budgets. It returns a typed terminal or
approval state, structured plan/tool/evidence/validation summaries, answer and
limitations. The internal credential authenticates the calling workload; the
principal context constrains rather than authenticates the end user.

Production uses workload identity/mTLS plus a signed short-lived delegation
token. The local Phase 1 bearer token is an explicit development mechanism and
is never the production default.

### Tool/MCP contracts

Tools are discriminated JSON objects with strict schemas and versioned results:
`search_metadata`, `get_schema`, `find_join_path`, `get_metric_definition`,
`run_safe_sql`, `search_documentation`, `get_campaign_summary`,
`detect_campaign_anomalies`, and `submit_feedback`. A tool receives a server-
constructed capability context, deadline, result/byte limit, and audit ID. MCP
is a façade through the same application ports; it cannot call query stores
directly.

## Typed agent state

`contracts/schemas/agent-state.schema.json` is the language-neutral contract.
The Python `AgentState` mirrors it and distinguishes inputs, budgets, decisions,
evidence, tool results, validation results, approval, answer, and terminal error.
Reducers append immutable event collections; nodes do not share mutable globals.

Important invariants:

- `step_count <= max_steps`, `repair_count <= max_repairs`.
- all work ends before `deadline_at` and within context/result/token/cost budgets;
- executed tools must appear in the approved plan and capability set;
- an answer claim cites evidence or is explicitly labeled as a limitation;
- approval interrupts persist the resumable state and expected version;
- no field contains private chain-of-thought.

## LangGraph workflow

```text
START -> guardrail -> deterministic intent gate
                     |-> clarification -> END
                     |-> metadata ----\
                     |-> documents -----+-> context builder
                     |-> graph --------/
                     `-> analytical plan -> SQL plan/generate/validate
                                               | invalid -> bounded repair
                                               | high cost -> approval interrupt
                                               `-> execute -> analytics
context/tool results -> verification critic -> response generator -> END
any node -> typed fallback/terminal failure -> END
```

The supervisor chooses a fixed capability subgraph from a structured plan; it
does not recursively invent agents. Metadata/doc retrieval may execute in
parallel because independent latency dominates. SQL validation remains ordered.
Deterministic parsing, authorization, arithmetic, schema checks and policies do
not call an LLM. Model calls are reserved for ambiguous intent, semantic
rewriting, constrained SQL-plan generation, explanations and subjective
evaluation.

Phase 1 implements `START -> guardrail -> deterministic intent -> response` with
step/deadline limits. Later phases add nodes without changing public state
invariants.

## Context, memory, prompts, and model gateway

The context manager assigns explicit token reservations to system policy,
glossary, task state, recent turns, summary, evidence, SQL examples/tool results,
and answer. It ranks by mandatory policy, task relevance, recency and evidence
quality; compression cannot remove citation identity or canonical formulas.

Short-term messages are durable under retention policy; working state expires
after the run/approval window; conversation summaries are versioned, TTL-bound
and regenerated when their covered message range changes. Sensitive tool output
is referenced rather than copied where possible. The memory port supports future
backends without coupling graph nodes to Redis/PostgreSQL.

Prompts live under `services/ai-orchestrator/prompts/<capability>/<name>/vN.yaml`.
A registry verifies checksum/schema and records prompt name/version, provider,
model, parameters and trace for every call. Deployment chooses an active version
and can roll back without source changes.

The model gateway exposes structured generation and embedding ports. Routing
filters providers by privacy, health, context and schema support, then scores
task fit, latency and estimated cost. OpenAI, Bedrock and OpenAI-compatible local
adapters are optional. Deadline-aware retries use jitter, fallback consumes the
same token/cost budget, and provider health drives a circuit breaker. Tests use
recorded/deterministic adapters and never claim their answers are production AI.

## Anomaly analytics

The planned anomaly service builds per-campaign metric time series after quality
and minimum-volume checks. Robust rolling baselines/z-scores provide explainable
signals; Isolation Forest adds multivariate candidates. Seasonality, promotions,
attribution delays and sparse denominators are reported limitations. Models are
versioned by features/window/training range and evaluated on seeded synthetic
anomalies plus false-positive controls. The tool returns observations and model
metadata, never causal claims.
