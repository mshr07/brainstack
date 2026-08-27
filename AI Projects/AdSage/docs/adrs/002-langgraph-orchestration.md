# ADR-002: Explicit LangGraph orchestration

- Status: Accepted
- Date: 2026-08-27

## Context

Questions may need clarification, retrieval, graph traversal, SQL, analytics or
approval, but uncontrolled model-directed loops are unsafe and hard to test.

## Alternatives

A linear chain is simple but cannot cleanly model approval/resume and conditional
capabilities. A custom workflow engine duplicates graph/checkpoint semantics.
Free-form autonomous agents provide flexibility at unacceptable control cost.

## Decision

Use LangGraph `StateGraph` with typed state, fixed nodes/subgraphs, explicit
routers, persisted interrupts, and terminal failure states. Deterministic code
performs deterministic decisions.

## Consequences and tradeoffs

The graph is inspectable, resumable and testable, and allows only intentional
parallelism. It adds framework coupling and migration/version concerns; the
language-neutral state schema and application ports limit that coupling.
