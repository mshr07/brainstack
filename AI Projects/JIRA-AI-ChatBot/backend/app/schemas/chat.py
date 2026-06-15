from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    session_id: int | None = None
    filters: dict | None = None


class ChatResponse(BaseModel):
    answer: str
    ticket_ids: list[str]
    confidence: str
    retrieval_mode: str
    from_cache: bool = False
    relevant_tickets: list[dict] = []
