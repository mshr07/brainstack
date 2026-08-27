# Implementation roadmap, risks, and acceptance criteria

## Assumptions

- The repository is a production-shaped reference implementation over synthetic
  data, not an already approved production deployment.
- One team initially owns the monorepo; module boundaries precede service splits.
- AWS is the target, but all core development and deterministic tests work locally.
- OIDC identity and model-provider credentials are external integrations; tests
  use local keys/adapters without claiming real-provider behavior.
- English and USD are the initial evaluation fixtures while schemas retain locale,
  timezone and currency explicitly.

## Delivery phases

1. **Foundation (implemented here):** governance docs/ADRs, versioned contracts,
   local dependencies, secure Java/Python/React scaffolds, bounded deterministic
   orchestration path, trace propagation, health/metrics, tests and CI baseline.
2. **Synthetic lake (implemented):** deterministic generator, domain dimensions/events,
   Bronze/Silver/Gold Spark pipelines, Parquet/DuckDB, schema evolution, late data,
   data quality and canonical glossary seed.
3. **Platform core:** persistent conversation/audit/idempotency, real OIDC/RBAC,
   Redis policies, SSE/cancellation, HITL state machine and integration tests.
4. **Metadata and RAG:** catalog/provenance/curation, pgvector/full-text ingestion,
   hybrid retrieval, citations and retrieval evaluation/ablations.
5. **Safe text-to-SQL:** semantic query plan, sqlglot validation, policy/cost query
   gateway, DuckDB/Athena adapters, repair budget and adversarial suite.
6. **GraphRAG and analytics:** Neo4j publication, governed lineage/join traversal,
   anomaly detection and combined evidence.
7. **MCP and complete agent workflow:** typed authenticated tools, integration
   tests, full bounded subgraphs, context/memory and provider routing.
8. **Evaluation/observability/UI:** full golden runner, feedback promotion,
   OpenTelemetry/Langfuse-compatible traces, dashboards and analyst/admin flows.
9. **Cloud delivery:** images, Helm/Kubernetes policies, modular Terraform, AWS
   integration, security scans, staged CI/CD and runbooks.
10. **Hardening:** k6 measurements, failure injection, capacity/cost baselines,
    query optimization, accessibility/E2E, recovery and threat-model review.

Each phase is a deployable slice with implementation, configuration, validation,
tests, telemetry, failure behavior, docs, security review and example usage.

## Major risks and mitigations

| Risk | Impact | Mitigation/decision trigger |
| --- | --- | --- |
| plausible but wrong SQL/answer | high | canonical formula AST, governed catalog, parser/policy/cost gates, result critic, citations, golden execution tests |
| tenant leakage through cache/retrieval/graph | critical | capability filtering at each store, tenant/policy cache keys, two-tenant tests, RLS defense |
| agent/provider unpredictability | high | fixed graph, typed state, step/deadline/token/cost/repair budgets, deterministic fallbacks |
| ratio/fan-out semantic errors | high | retain additive measures, grain/cardinality metadata, approved joins, equivalence fixtures |
| late/schema-changing data | medium | immutable Bronze, watermarks/correction window, manifests, quarantine, versioned publish gate |
| excessive platform complexity | medium | modular monoliths first; split only on measured scaling/ownership/isolation need |
| vector/graph technology without quality gain | medium | configurable adapters and ablation gates; PostgreSQL/catalog fallback |
| cloud and LLM cost | medium | local path, quotas, workgroup scan/token budgets, autoscale, cost trace |
| metadata curation corrupts trust | high | immutable proposals, confidence/policy review, provenance, explicit publication |
| observability leaks content | high | allowlisted structured events, redaction, no raw secrets/results/CoT, retention controls |

## Phase 1 acceptance criteria

- Required architecture documents and ten ADRs cover alternatives, decision,
  consequences and tradeoffs.
- Public/internal OpenAPI and agent-state/tool JSON Schemas parse and are versioned.
- `make bootstrap`, `make test`, `make lint`, and `make contract-check` are defined;
  local infrastructure has health checks and no paid-cloud dependency.
- Java 21 service starts with production JWT resource-server architecture, exposes
  health/metrics, validates requests, propagates request/trace context, and calls
  the internal AI port with explicit timeouts.
- FastAPI service authenticates its internal endpoint, validates typed state,
  executes a deadline/step-bounded LangGraph, refuses obvious prompt-injection
  control transfer, emits request IDs/metrics, and never exposes private reasoning.
- React strict-TypeScript shell renders a question form, success, loading and
  error/limitation states against a typed client.
- Unit/contract tests cover success and security/failure boundaries. CI runs the
  credential-free checks. Documentation states incomplete capabilities honestly.

## Product acceptance criteria (target)

The complete system is accepted only after an authorized user can ask each
example class, observe a bounded plan/tool status, approve high-cost work, receive
correct execution-grounded facts with immutable citations and canonical formulas,
and submit feedback; unauthorized/malicious cases execute no unsafe query or tool.
Synthetic data flows idempotently through quality-gated medallion layers; local
Compose and AWS staging deploy the same contracts; evaluation, security,
resilience and measured performance gates pass at configured, non-fabricated
thresholds.
