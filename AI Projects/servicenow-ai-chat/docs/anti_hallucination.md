# Anti-Hallucination Strategy

The chatbot is designed to prioritize accuracy over creativity.

## Rules

- Answer only from retrieved Jira ticket context.
- Cite ticket IDs in factual claims.
- Never invent status, assignee, priority, blockers, root cause, dates, estimates, or implementation details.
- Say `The available Jira ticket data does not contain enough information` when context is missing.
- Separate facts, analysis, suggested solution, risks, missing information, and confidence.
- Mark solutions as recommendations based on available ticket details.

## Implementation

- `Retriever` limits the candidate tickets.
- `ContextBuilder` creates compact field blocks instead of raw JSON.
- `PromptBuilder` includes strict grounding rules for future LLM calls.
- `Guardrails` handles missing context and citation checks.
- `LLMService` currently generates deterministic grounded responses from retrieved ticket objects only.

## Confidence

Confidence is derived from retrieval mode and score:

- High: direct ticket lookup or strong retrieval score
- Medium: useful but weaker retrieval score
- Low: missing or weak ticket context
