# AI orchestrator

This internal FastAPI service hosts fixed, bounded LangGraph workflows. Phase 1
implements deterministic guardrail, intent and response nodes so the cross-service
contract can be exercised without model credentials. It does not retrieve data,
generate/execute SQL, or claim analytical answers yet.

```bash
uv sync --all-groups
uv run uvicorn adsage_ai.main:create_app --factory --app-dir src --port 8090
uv run pytest
```

The internal bearer token is a local workload credential. Production replaces it
with mTLS/workload identity plus short-lived signed delegation as documented in
the root architecture.
