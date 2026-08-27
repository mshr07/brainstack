# AdSage

AdSage is a production-oriented reference platform for conversational analytics
over a fully synthetic advertising lake. It is designed to demonstrate how a
secure platform service, a bounded AI orchestrator, governed analytical data,
and deterministic policy enforcement fit together. It does not reproduce or
claim any proprietary advertising system.

## Current status

Phases 1 and 2 are implemented. The foundation provides architecture and
decision records, versioned API/state contracts, local dependency topology, a
Java 21 platform scaffold, a bounded FastAPI/LangGraph orchestration endpoint,
a React shell, trace/request propagation, health/metrics endpoints, and tests.
The synthetic lake adds deterministic advertising dimensions/events, immutable
Bronze Parquet, quality-gated PySpark Silver/Gold versions, canonical metric
metadata, and independent DuckDB formula assertions.

The following are deliberately not claimed as complete yet: production
text-to-SQL execution, retrieval indexes, GraphRAG, MCP, anomaly modeling, cloud
resources, and full user workflows. Their contracts, boundaries, threats, and
delivery phases are documented.

## Architecture at a glance

```text
Browser -> Spring platform service -> AI orchestrator -> governed tools
               |                         |               |-- metadata/graph
               |                         |               |-- retrieval
               |                         |               `-- safe SQL
               |                         `-- model gateway
               `-- PostgreSQL / Redis / audit

Synthetic events -> Bronze Parquet -> Silver Parquet -> Gold Parquet/Athena
                                           |              |
                                           `--- catalog --+--> governed queries
```

Spring is the public trust boundary. The AI service receives a signed-in
principal context over an authenticated internal channel but cannot expand it.
Every AI workflow has deadlines, step/repair budgets, explicit terminal states,
and evidence-bearing responses.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md),
[SECURITY.md](SECURITY.md), and the [ADRs](docs/adrs/README.md).

## Repository layout

```text
apps/web/                           React + TypeScript client
contracts/                          OpenAPI and JSON Schema contracts
docs/adrs/                          Architecture decision records
infra/docker/                       Local dependency configuration
infra/helm/                         Phase 9 deployment boundary
infra/terraform/                    Phase 9 AWS boundary
observability/                      Metrics/dashboards configuration
pipelines/                          Phase 2 data generation and Spark ETL boundary
services/adsage-platform-service/   Java 21 Spring Boot public platform
services/ai-orchestrator/           Python FastAPI bounded AI workflows
tests/performance/                  Phase 10 k6 scenarios
```

## Local setup

Prerequisites: Java 21, Maven 3.9+, Python 3.12+, `uv`, Node 20+, npm 10+,
Docker with Compose, and GNU Make-compatible `make`.

```bash
cp .env.example .env
make bootstrap
make infra-up
make dev
```

`make dev` prints the three development commands so each process retains useful
logs. Run them in separate terminals. Local dependencies do not require AWS or
paid model credentials. The deterministic Phase 1 path is useful for contract
testing; it is not represented as a full analytical answer engine.

For host-run services, export the local file into each terminal first (for zsh:
`set -a; source .env; set +a`). Generate a one-hour local JWT with `make dev-token`
and paste it into the web sign-in screen. The token is validated for signature,
issuer, audience, expiry, scope, and tenant claim; the local profile does not
bypass authentication.

Useful endpoints:

- web: `http://localhost:5173`
- platform health: `http://localhost:8080/actuator/health`
- AI health: `http://localhost:8090/health`
- AI metrics: `http://localhost:8090/metrics`
- Neo4j browser: `http://localhost:7474`
- MinIO console: `http://localhost:9001`

## Commands

```bash
make bootstrap       # install locked/resolved development dependencies
make infra-up        # PostgreSQL/pgvector, Redis, Neo4j, MinIO
make seed             # generate/reuse one deterministic Bronze batch
make data-run         # publish and DuckDB-validate the local medallion lake
make test            # Java, Python, Spark/data, and web tests
make lint            # Java compile/static checks, Ruff, TypeScript/ESLint
make contract-check  # validate OpenAPI and JSON documents
make up              # build/start the complete Compose topology
make down            # stop local containers without deleting volumes
```

## Example target questions

- Compare ROAS for my top 10 US campaigns this month versus last month.
- Why did attributed revenue fall yesterday while impressions increased?
- Which datasets and canonical columns calculate ROAS?
- How is `campaign_daily_metrics` derived?
- What governed join path connects conversions to campaigns?

## Testing and evaluation

Tests validate service boundaries, contracts, trace propagation, bounded graph
behavior, prompt-injection handling, UI states, deterministic lake generation,
schema evolution, late-data/quarantine behavior, idempotent publication, and
canonical ratio results in Spark and DuckDB. AI quality is gated later by the
versioned golden set described in [EVALUATION.md](EVALUATION.md). No performance
or AI-quality result is claimed until its benchmark command records it.

## Deployment and tradeoffs

Local Compose favors accessibility: MinIO emulates S3 and later DuckDB can query
Parquet without an AWS account. The AWS target uses EKS, S3/Glue/Athena,
Lake Formation, Aurora PostgreSQL with pgvector, ElastiCache, and managed identity
services. Neo4j remains optional and degrades lineage/join-path features rather
than core platform access. See [OPERATIONS.md](OPERATIONS.md) for failure modes and
[ARCHITECTURE.md](ARCHITECTURE.md) for alternatives.

## Screenshots

Screenshots will be captured after the first end-to-end analytical workflow is
implemented; placeholders are intentionally not presented as completed UI.
