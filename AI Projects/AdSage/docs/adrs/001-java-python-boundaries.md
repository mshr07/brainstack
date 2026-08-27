# ADR-001: Java platform and Python AI/data boundaries

- Status: Accepted
- Date: 2026-08-27

## Context

Public identity, lifecycle and audit policy benefit from a strongly governed
service stack; AI orchestration and Spark/ML libraries evolve in Python.

## Alternatives

One Python service reduces process count but mixes trust and experimentation.
One Java service weakens access to mature AI/data libraries. Many small services
create premature operational and distributed-transaction cost.

## Decision

Use a Java 21 Spring Boot public platform service and an internal Python FastAPI
AI orchestrator. Keep metadata/query/evaluation as modules behind ports until
scale, ownership or isolation requires separation. Contracts are OpenAPI/JSON
Schema and trace/capability context is explicit.

## Consequences and tradeoffs

Teams use each ecosystem where strongest and the security boundary is clear.
Costs include two runtimes, contract/version testing, network latency, partial
failure, and cross-service tracing. A thin vertical contract test is mandatory.
