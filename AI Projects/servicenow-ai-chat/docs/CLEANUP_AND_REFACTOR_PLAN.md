# Cleanup And Refactor Plan

## Inspection Result

The workspace initially contained:

- `.idea/` IDE metadata
- `.venv/` local virtual environment
- `data/` dummy Jira ticket fixtures
- `scripts/generate_dummy_jira_tickets.py`
- Generated `scripts/__pycache__/` from a compile check

There was no existing chatbot application code to preserve or refactor.

## Safe Cleanup Completed

- Removed `scripts/__pycache__/` because it was generated locally and not source code.
- Added `.gitignore` entries for Python caches, virtual environments, logs, local cache files, and environment secrets.

## Structure Created

- `src/jira_chatbot/` for application code
- `tests/` for focused unit tests
- `docs/` for architecture and refactor notes
- `.env.example` for safe configuration
- `pyproject.toml` for packaging and test configuration

## Refactor Principles Applied

- Separate ingestion, preprocessing, embeddings, retrieval, prompts, answering, analysis, caching, API, CLI, config, and logging.
- Keep the initial implementation dependency-light and testable.
- Prefer deterministic local behavior over hidden network/model calls.
- Keep extension points explicit for Jira REST, Redis, vector databases, and hosted LLMs.

## Files Removed

- `scripts/__pycache__/`

## Remaining TODOs

- Connect a real Jira project by setting `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, and `JIRA_PROJECT_KEY`.
- Add a production LLM client only after prompt and context evaluation are approved.
- Add Redis or database cache backend if multiple app instances need shared cache.
- Add persistent vector DB integration for very large ticket datasets.
