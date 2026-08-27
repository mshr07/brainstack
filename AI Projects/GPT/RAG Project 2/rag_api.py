"""Phase 10: FastAPI wrapper for the prebuilt-tools RAG project.

Run the development server with:

    uvicorn rag_api:app --reload

The endpoints in this file do not reimplement RAG. They validate HTTP input,
call the functions from ``prebuilt_tools_rag.py``, and return JSON that React,
Django, mobile apps, or other services can consume.
"""

from __future__ import annotations

import logging
import os
from threading import Lock
from time import perf_counter
from typing import Literal, NoReturn

from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from prebuilt_tools_rag import (
    INSTALL_COMMAND,
    KNOWLEDGE_DIR,
    answer_question,
    managed_answer,
)


logger = logging.getLogger(__name__)

# These origins cover the usual React/Vite development servers. Override them
# with RAG_ALLOWED_ORIGINS as a comma-separated list in other environments.
DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)

# The existing code may build/reset the persistent Chroma index when knowledge
# changes. A lock prevents two simultaneous API requests from rebuilding it.
_local_rag_lock = Lock()


def get_allowed_origins() -> list[str]:

    configured = os.getenv("RAG_ALLOWED_ORIGINS")
    if not configured:
        return list(DEFAULT_ALLOWED_ORIGINS)
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


class QuestionRequest(BaseModel):

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    question: str = Field(
        min_length=1,
        max_length=4_000,
        description="The question to answer from the knowledge folder.",
        examples=["Why is the lunar terminator useful?"],
    )
    top_k: int = Field(
        default=3,
        ge=1,
        le=20,
        description="Maximum number of knowledge chunks or files to retrieve.",
    )


class AskRequest(QuestionRequest):

    retriever: Literal["chroma", "sklearn"] = "chroma"
    rebuild: bool = Field(
        default=False,
        description="Force Chroma to recreate its index from the knowledge folder.",
    )


class RagResponse(BaseModel):

    question: str
    answer: str
    mode: Literal["local", "managed_file_search"]
    retriever: Literal["chroma", "sklearn", "openai_file_search"]
    top_k: int
    elapsed_ms: float


class HealthResponse(BaseModel):

    status: Literal["ok", "degraded"]
    openai_api_key_configured: bool
    knowledge_file_count: int
    knowledge_files: list[str]


app = FastAPI(
    title="Backyard Astronomy RAG API",
    description=(
        "A typed HTTP layer over prebuilt_tools_rag.py. Source files are read "
        "from the server-side knowledge folder, never uploaded by the client."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def run_local_rag(request: AskRequest) -> str:

    with _local_rag_lock:
        return answer_question(
            question=request.question,
            top_k=request.top_k,
            retriever_name=request.retriever,
            rebuild=request.rebuild,
        )


def raise_http_error(error: Exception) -> NoReturn:

    if isinstance(error, ModuleNotFoundError):
        raise HTTPException(
            status_code=500,
            detail=f"Missing package '{error.name}'. Install dependencies with: {INSTALL_COMMAND}",
        ) from error

    if isinstance(error, FileNotFoundError):
        raise HTTPException(status_code=500, detail=str(error)) from error

    if isinstance(error, ValueError):
        raise HTTPException(status_code=400, detail=str(error)) from error

    if isinstance(error, RuntimeError) and "OPENAI_API_KEY" in str(error):
        raise HTTPException(status_code=503, detail=str(error)) from error

    logger.exception("RAG request failed", exc_info=error)
    raise HTTPException(
        status_code=502,
        detail="The RAG service could not complete the request. Check the server logs.",
    ) from error


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    """Point people and client developers to the interactive API documentation."""

    return {
        "name": app.title,
        "docs": "/docs",
        "health": "/api/v1/health",
        "ask": "/api/v1/ask",
    }


@app.get("/api/v1/health", response_model=HealthResponse, tags=["service"])
def health() -> HealthResponse:
    """Check local files and configuration without spending API tokens."""

    knowledge_files = []
    if KNOWLEDGE_DIR.exists():
        knowledge_files = sorted(
            {
                path.relative_to(KNOWLEDGE_DIR).as_posix()
                for pattern in ("*.md", "*.txt")
                for path in KNOWLEDGE_DIR.rglob(pattern)
                if path.is_file()
            }
        )

    api_key_configured = bool(os.getenv("OPENAI_API_KEY"))
    status = "ok" if api_key_configured and knowledge_files else "degraded"
    return HealthResponse(
        status=status,
        openai_api_key_configured=api_key_configured,
        knowledge_file_count=len(knowledge_files),
        knowledge_files=knowledge_files,
    )


@app.post("/api/v1/ask", response_model=RagResponse, tags=["rag"])
async def ask(request: AskRequest) -> RagResponse:
    """Answer a question with the local Chroma or scikit-learn RAG pipeline."""

    started = perf_counter()
    try:
        answer = await run_in_threadpool(run_local_rag, request)
    except Exception as error:
        raise_http_error(error)

    return RagResponse(
        question=request.question,
        answer=answer,
        mode="local",
        retriever=request.retriever,
        top_k=request.top_k,
        elapsed_ms=round((perf_counter() - started) * 1_000, 2),
    )


@app.post("/api/v1/managed/ask", response_model=RagResponse, tags=["rag"])
async def ask_managed(request: QuestionRequest) -> RagResponse:
    """Answer with the existing OpenAI-managed File Search pipeline."""

    started = perf_counter()
    try:
        answer = await run_in_threadpool(
            managed_answer,
            request.question,
            request.top_k,
        )
    except Exception as error:
        raise_http_error(error)

    return RagResponse(
        question=request.question,
        answer=answer,
        mode="managed_file_search",
        retriever="openai_file_search",
        top_k=request.top_k,
        elapsed_ms=round((perf_counter() - started) * 1_000, 2),
    )
