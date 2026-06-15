# Architecture

The application is split into a FastAPI backend and a Vite React frontend.

## Backend

The backend lives in `backend/app`.

- `main.py`: FastAPI app startup, CORS, route registration
- `database.py`: SQLAlchemy engine/session setup
- `models/`: SQLAlchemy models for tickets, comments, chunks, embedding metadata, chat sessions, and chat messages
- `schemas/`: Pydantic request/response contracts
- `api/routes.py`: HTTP endpoints
- `services/`: ingestion, preprocessing, embedding, vector index, retrieval, reranking, context, prompts, guardrails, answers, cache, analytics

The backend defaults to SQLite for simple local mock-data runs. `docker-compose.yml` provides PostgreSQL and Redis for the target production-style setup.

## Frontend

The frontend lives in `frontend`.

- Chat page with grounded responses and ticket citations
- Search page for ticket lookup
- Ticket detail view
- Mock sync and index rebuild controls
- Axios API client configured by `VITE_API_BASE_URL`

## Data Flow

1. Mock or real Jira data is synced.
2. Tickets are normalized and compared with existing database records.
3. New tickets are inserted, changed tickets are updated, and unchanged tickets are skipped.
4. Created or updated tickets are chunked and embedded.
5. The in-memory vector index is updated for changed ticket IDs or fully loaded from SQLAlchemy records on startup.
6. Chat queries use ticket ID lookup or hybrid retrieval across old and fresh tickets.
7. Context is compacted and passed to the grounded answer layer.
8. Responses cite ticket IDs and list missing information.
