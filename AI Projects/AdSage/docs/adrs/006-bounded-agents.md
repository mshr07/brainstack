# ADR-006: Bounded capability subgraphs instead of autonomous agents

- Status: Accepted
- Date: 2026-08-27

## Context

Model-directed agents can loop, spend unpredictably, invoke inappropriate tools,
and obscure failure. Some questions still require multiple semantic capabilities.

## Alternatives

One model call lacks tool verification and recovery. A free-form supervisor with
recursive workers maximizes flexibility but violates reliability/security goals.

## Decision

The supervisor selects a structured, allowlisted capability plan executed by
fixed subgraphs. Enforce total deadline, steps, tool calls, repairs, context,
tokens, result bytes and estimated cost. Parallelize only independent reads.

## Consequences and tradeoffs

Execution is predictable, auditable, cancelable and testable. Some novel questions
will need clarification or a new graph rather than improvisation; that is an
intentional safety/operability tradeoff.
