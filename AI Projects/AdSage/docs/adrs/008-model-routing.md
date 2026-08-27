# ADR-008: Provider-independent policy-based model routing

- Status: Accepted
- Date: 2026-08-27

## Context

Tasks vary in structured-output needs, privacy, context, latency and cost; provider
availability and credentials vary by environment.

## Alternatives

One hard-coded provider is simple but creates lock-in and weak resilience. A
generic lowest-cost router may violate privacy or reliability. Direct provider
SDK use across nodes scatters policy and observability.

## Decision

Expose gateway ports for structured generation and embeddings. Filter providers
by privacy/capability/health/context, then score configured task fit, latency and
estimated cost. Apply shared deadline, retry, circuit, fallback and token/cost
budgets. Support OpenAI, Bedrock and OpenAI-compatible adapters when configured.

## Consequences and tradeoffs

Application code and evaluation are portable and policy is centralized. Provider
feature differences still leak through capability metadata, and fallbacks can
change quality; each route/provider/version is traced and evaluated.
