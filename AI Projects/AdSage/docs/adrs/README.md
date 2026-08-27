# Architecture decision records

ADRs are immutable after acceptance except for status and supersession links.
Create a new ADR when changing a durable decision.

| ADR | Decision | Status |
| --- | --- | --- |
| [001](001-java-python-boundaries.md) | Java public platform plus Python AI/data boundary | Accepted |
| [002](002-langgraph-orchestration.md) | Explicit LangGraph state machine | Accepted |
| [003](003-vector-store.md) | PostgreSQL/pgvector first | Accepted |
| [004](004-graph-database.md) | Neo4j for governed traversal, with fallback | Accepted |
| [005](005-analytical-query-engine.md) | DuckDB local and Athena AWS over Parquet | Accepted |
| [006](006-bounded-agents.md) | Bounded capability subgraphs | Accepted |
| [007](007-text-to-sql-security.md) | Parsed policy gateway before execution | Accepted |
| [008](008-model-routing.md) | Provider-independent policy router | Accepted |
| [009](009-memory.md) | Tiered, lifecycle-bound memory | Accepted |
| [010](010-evaluation.md) | Deterministic-first versioned evaluation | Accepted |
