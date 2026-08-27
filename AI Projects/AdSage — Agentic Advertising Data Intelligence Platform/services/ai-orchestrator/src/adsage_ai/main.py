import re
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any
from uuid import uuid4

import structlog
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from adsage_ai.config import Settings, get_settings
from adsage_ai.models import OrchestrationRequest, OrchestrationResponse
from adsage_ai.security import require_internal_credential
from adsage_ai.service import OrchestrationService

logger = structlog.get_logger()
REQUESTS = Counter(
    "adsage_ai_http_requests_total", "Internal HTTP requests", ("path", "method", "status")
)
LATENCY = Histogram(
    "adsage_ai_http_request_duration_seconds", "Internal HTTP request latency", ("path", "method")
)


class RequestContextMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Any, settings: Settings) -> None:
        super().__init__(app)
        self._safe_request_id = re.compile(settings.request_id_pattern)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        candidate = request.headers.get("X-Request-Id", "")
        request_id = candidate if self._safe_request_id.fullmatch(candidate) else str(uuid4())
        request.state.request_id = request_id
        started = time.perf_counter()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("unhandled_request_error")
            response = JSONResponse(
                status_code=500,
                content={
                    "type": "https://adsage.example/problems/500",
                    "title": "Internal service error",
                    "status": 500,
                    "requestId": request_id,
                },
            )
        finally:
            structlog.contextvars.clear_contextvars()
        response.headers["X-Request-Id"] = request_id
        route = request.scope.get("route")
        path = getattr(route, "path", request.url.path)
        REQUESTS.labels(path=path, method=request.method, status=str(response.status_code)).inc()
        LATENCY.labels(path=path, method=request.method).observe(time.perf_counter() - started)
        return response


def create_app(settings: Settings | None = None) -> FastAPI:
    active_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.settings = active_settings
        app.state.orchestration_service = OrchestrationService(active_settings)
        yield

    app = FastAPI(
        title="AdSage — Agentic Advertising Data Intelligence Platform AI Orchestrator",
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
        lifespan=lifespan,
    )
    app.add_middleware(RequestContextMiddleware, settings=active_settings)

    @app.get("/health", include_in_schema=False)
    async def health() -> dict[str, str]:
        return {"status": "healthy"}

    @app.get("/metrics", include_in_schema=False)
    async def metrics() -> PlainTextResponse:
        return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @app.post(
        "/internal/v1/orchestrations",
        response_model=OrchestrationResponse,
        response_model_by_alias=True,
        dependencies=[Depends(require_internal_credential)],
    )
    async def orchestrate(request: Request, payload: OrchestrationRequest) -> OrchestrationResponse:
        if "analysis:run" not in payload.capabilities:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The delegated principal cannot run analysis",
            )
        service: OrchestrationService = request.app.state.orchestration_service
        return await service.orchestrate(payload, request.state.request_id)

    return app
