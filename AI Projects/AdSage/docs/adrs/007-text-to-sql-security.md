# ADR-007: Policy-enforced text-to-SQL gateway

- Status: Accepted
- Date: 2026-08-27

## Context

Generated SQL is untrusted and can be destructive, expensive, semantically wrong,
or cross tenant boundaries even when syntactically valid.

## Alternatives

Prompt-only rules are non-deterministic. Regex filtering cannot understand SQL.
A read-only database role stops writes but not exfiltration or denial of service.
Template-only queries are safer but too narrow for the target analytics.

## Decision

Generate from a structured semantic plan, parse with sqlglot, resolve every object,
enforce SELECT/function/join/grain/metric/tenant/partition/limit policy, cost-check,
bind parameters, audit, then run through an isolated read-only adapter. Revalidate
after approval and before execution.

## Consequences and tradeoffs

Defense in depth makes unsafe SQL fail closed. It is substantial engineering and
limits dialect features; unsupported queries require curated templates or human
review. The complete threat model is in `SECURITY.md`.
