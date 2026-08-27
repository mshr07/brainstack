# ADR-009: Tiered memory with explicit lifecycles

- Status: Accepted
- Date: 2026-08-27

## Context

Long conversations exceed context windows and may contain sensitive content.
Blind replay increases cost and prompt-injection exposure.

## Alternatives

Full-history prompts preserve detail but do not scale. Stateless turns lose user
context. An external memory product adds dependency before requirements are known.

## Decision

Separate recent short-term messages, per-run working state, and versioned
conversation summaries behind a memory port. Rank context within explicit token
allocations; store references to sensitive evidence where possible. Apply
tenant-aware retention, TTL, deletion and summary coverage/version rules.

## Consequences and tradeoffs

Context is bounded, explainable and replaceable. Summaries may omit nuance, so
the UI and planner can retrieve authorized original turns and report coverage.
Summary quality and privacy become evaluation requirements.
