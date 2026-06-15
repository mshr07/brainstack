# RAG Pipeline

## Ingestion

`JiraClient` supports two modes:

- Mock mode from `sample_data/jira_tickets.json`
- Real Jira REST API mode when credentials are configured

`TicketIngestionService` upserts tickets and comments into the database. It compares incoming normalized tickets with existing records and reports fetched, created, updated, unchanged, skipped, and changed ticket IDs.

## Preprocessing

`TicketPreprocessor`:

- Cleans HTML and whitespace
- Normalizes empty fields
- Deduplicates repeated comments by hash
- Creates meaningful chunks:
  - overview
  - acceptance criteria
  - recent comments
- Carries metadata on every chunk

## Embeddings

`EmbeddingService` uses a deterministic local hashing/vector model so the app works without paid model credentials. The interface can later be replaced with OpenAI embeddings or another embedding provider.

## Retrieval

`Retriever` selects retrieval mode:

- Ticket ID direct lookup for queries like `AICB-110`
- Metadata filter mode when filter syntax is present
- Hybrid mode for broad questions

Hybrid scoring combines:

- Keyword overlap
- Local vector similarity
- Metadata boosts for status, priority, labels, and unassigned tickets

Results are deduplicated by ticket ID, reranked, grouped, and context-limited before answer generation.

## Incremental Fresh Ticket Flow

1. `POST /sync/jira/incremental` fetches board/project tickets from Jira.
2. New Jira keys are inserted into `tickets`.
3. Existing Jira keys are updated only when the normalized ticket fingerprint changes.
4. Comments are normalized and deduplicated.
5. Existing chunks and embedding metadata for changed ticket IDs are removed.
6. Fresh chunks and embeddings are written for changed ticket IDs.
7. The active in-memory vector index is updated.
8. Retrieval and answer caches are cleared.
9. Chat can immediately answer questions about old and newly added tickets.

## Response Generation

The current `LLMService` is deterministic and grounded. It formats answers from retrieved tickets only. The prompt templates are present so a hosted LLM can be added behind the same service boundary.
