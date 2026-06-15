# JIRA-AI-ChatBot

Production-ready full-stack scaffold for a Jira ticket AI chatbot. Users can ask questions about Jira tickets, search tickets, inspect ticket details, identify blockers, and get solution recommendations grounded only in Jira data.

The app runs with mock Jira tickets first, so no Jira credentials are required for local development.

## Features

- FastAPI backend with SQLAlchemy models
- PostgreSQL and Redis services in Docker Compose
- Redis cache with in-memory fallback
- Mock Jira ingestion from `sample_data/jira_tickets.json`
- Real Jira REST ingestion path
- Incremental sync that adds new Jira tickets and updates changed tickets without deleting older project history
- Ticket preprocessing, comment normalization, deduplication, and chunking
- Deterministic local embedding model
- Hybrid retrieval: ticket ID lookup, keyword, vector-style similarity, metadata boosts
- Metadata filtering hooks for status, priority, assignee, sprint, labels, and project
- Reranking, deduplication, ticket grouping, and compact context building
- Grounded response generation with ticket citations and confidence
- React/Vite frontend with chat, ticket search, ticket details, sync, and index rebuild controls
- Tests for retrieval, preprocessing, cache keys, prompt generation, guardrails, mock sync, and analytics

## Project Structure

```text
backend/
  app/
    main.py
    config.py
    database.py
    models/
    schemas/
    api/
    services/
    tests/
  requirements.txt
  .env.example
frontend/
  src/
    components/
    pages/
    api/
    App.jsx
    main.jsx
  package.json
docs/
  architecture.md
  rag_pipeline.md
  caching.md
  anti_hallucination.md
sample_data/
  jira_tickets.json
docker-compose.yml
```

## Setup

Start infrastructure:

```bash
docker-compose up -d
```

Run backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at `http://localhost:5173`. The backend runs at `http://localhost:8000`.

## Environment Variables

Backend defaults are in `backend/.env.example`.

Important values:

- `DATABASE_URL`: database connection string. Defaults to local SQLite for easy mock runs.
- `REDIS_URL`: Redis URL. Falls back to memory when Redis is unavailable.
- `AUTO_SYNC_MOCK`: auto-load sample tickets on backend startup.
- `MOCK_JIRA_DATA_PATH`: mock Jira JSON path.
- `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`: real Jira sync.
- `RETRIEVAL_TOP_K`, `TOKEN_BUDGET_CHARS`, `RERANKING_ENABLED`: RAG controls.

## Mock Jira Data

The app uses `sample_data/jira_tickets.json`. To regenerate the source fixture:

```bash
python3 scripts/generate_dummy_jira_tickets.py --out-dir sample_data --json-name jira_tickets.json
```

## API Endpoints

- `GET /health`
- `POST /sync/jira`
- `POST /sync/jira/incremental`
- `POST /sync/mock`
- `POST /index/rebuild`
- `POST /chat`
- `GET /tickets`
- `GET /tickets/{ticket_id}`
- `GET /tickets/search`
- `GET /analytics/blockers`
- `GET /analytics/high-priority`
- `GET /analytics/inactive`
- `GET /analytics/missing-assignee`

## Example Questions

- Which critical tickets are unresolved?
- Which tickets are blocked and why?
- What is the status of AICB-104?
- Which tickets have missing assignees?
- Which tickets look inactive?
- Suggest a solution for AICB-110.
- Which tickets may need escalation?

## Testing

After installing backend requirements:

```bash
cd backend
pytest
```

The tests are also compatible with:

```bash
PYTHONPATH=backend python3 -m unittest discover -s backend/app/tests -v
```

## How RAG Works

1. Jira tickets are synced from mock JSON or Jira REST.
2. Sync compares incoming tickets with existing stored tickets.
3. New tickets are inserted, changed tickets are updated, and unchanged tickets are skipped.
4. Only new or changed tickets have chunks and embeddings rebuilt.
5. Retrieval and answer caches are cleared when the index changes.
6. Queries use direct ticket lookup or hybrid retrieval across old, new, and freshly updated tickets.
7. Results are reranked and deduplicated by ticket.
8. Context is compacted to the token budget.
9. Responses are generated from retrieved tickets only and cite ticket IDs.

## Fresh Ticket Pipeline

When new tickets arrive in Jira:

1. Call `POST /sync/jira/incremental`.
2. The backend fetches Jira tickets for the configured project.
3. Incoming tickets are normalized and compared against existing database records.
4. New ticket IDs are added to the database.
5. Updated ticket IDs replace stale fields and comments.
6. Changed ticket IDs are chunked, embedded, and added to the active vector index.
7. Retrieval and answer caches are invalidated.
8. The chatbot can immediately analyze and answer questions across old and fresh ticket data.

Optional Jira updated filter:

```bash
curl -X POST "http://127.0.0.1:8000/sync/jira/incremental?updated_since=2026/06/15%2000:00"
```

Mock-data equivalent for local development:

```bash
curl -X POST http://127.0.0.1:8000/sync/mock
```

## How Caching Works

Redis is used when available. If Redis is not installed or unavailable, the backend uses in-memory cache.

Cached namespaces:

- `embeddings`
- `retrieval`
- `answers`

Incremental sync clears retrieval and answer cache only when new or changed tickets are indexed. Full index rebuild clears both caches. Embedding metadata tracks ticket ID, updated timestamp, comment count, status, and description hash.

## Hallucination Prevention

The assistant:

- Answers only from retrieved Jira ticket context
- Cites ticket IDs for factual claims
- Refuses unsupported facts with “The available Jira ticket data does not contain enough information”
- Separates analysis, recommendations, risks, missing info, and confidence
- Labels solutions as recommendations, not confirmed implementation facts

## Future Improvements

- pgvector or FAISS persistent vector storage
- Hosted LLM adapter with usage tracking
- OpenAI or Jira-native embedding provider
- Authentication and tenant isolation
- Background sync worker
- Streaming chat responses
