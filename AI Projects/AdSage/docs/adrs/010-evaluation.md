# ADR-010: Deterministic-first, versioned evaluation

- Status: Accepted
- Date: 2026-08-27

## Context

AI quality spans retrieval, SQL, tools, answers, security, latency and cost.
Aggregate LLM-judge scores alone are unstable and can hide critical failures.

## Alternatives

Manual review is valuable but slow and non-repeatable. LLM-only evaluation is
subjective. Exact-match-only evaluation misses semantically correct responses.

## Decision

Version golden cases, data/catalog snapshots, prompts, models and configurations.
Prefer deterministic intent/object/AST/execution/fact/citation/security measures.
Use pinned rubric-based judges only for subjective dimensions, with judge metadata
and variance. Release gates include zero-tolerance security cases and measured
latency/cost budgets.

## Consequences and tradeoffs

Regressions are reproducible and failures diagnosable. Fixture maintenance and
snapshot infrastructure are real costs; semantic judge results remain supporting
evidence, not authorization or sole release criteria.
