# RAG, Caching, And Grounding Design

## Retrieval Modes

Specific ticket questions:

- Extract ticket keys with a case-insensitive regex.
- Use direct lookup before semantic retrieval.
- Return not-found when the ticket key is absent from the indexed dataset.

General Jira questions:

- Score each chunk with keyword overlap, local vector similarity, and metadata boosts.
- Boost fields such as status, priority, labels, components, and missing assignee.
- Deduplicate by ticket key to avoid flooding prompts with repeated chunks.
- Rerank for query intent such as blocked, unresolved, missing assignee, or missing acceptance criteria.

## Chunking Strategy

Each ticket can produce:

- `overview`: summary, description, status, priority, assignee, labels, components, blocker reason
- `acceptance_criteria`: acceptance criteria only when present
- `comments`: recent comments, truncated to keep context compact

Ticket-level grouping is used before answer construction.

## Context Control

The prompt builder uses compact field blocks instead of raw JSON. It enforces `RETRIEVAL_MAX_CONTEXT_CHARS` so long descriptions and comments cannot exhaust the prompt budget.

## Cache Layers

Implemented namespaces:

- `processed_ticket`: avoids repeated normalization for unchanged data
- `embedding`: avoids recomputing vectors for unchanged text
- `retrieval`: avoids repeated hybrid scoring for the same dataset version and query
- `answer`: reuses safe deterministic answers when the dataset version is unchanged

Invalidation is based on a dataset version hash built from ticket content hashes. Ticket content hashes include:

- Summary
- Description
- Status
- Priority
- Assignee
- Labels
- Components
- Updated timestamp
- Resolution
- Acceptance criteria
- Comments
- Custom fields

## Hallucination Controls

The answer layer follows these rules:

- Do not invent facts outside ticket data.
- Cite ticket IDs for every ticket claim.
- Label solutions as recommendations.
- List missing assignee, estimates, acceptance criteria, and implementation evidence when absent.
- Use "not enough information" when no relevant context exists.

## Prompt Templates

Prompt kinds are available for:

- General Jira question answering
- Specific ticket analysis
- Root cause analysis
- Suggested solution generation
- Ticket summarization
- Similar ticket search
- Status/report generation
- Risk/blocker analysis

The current answer generator is deterministic. These templates are ready for a future LLM adapter once model access and evaluation requirements are defined.
