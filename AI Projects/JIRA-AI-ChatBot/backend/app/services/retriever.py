from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.config import Settings
from app.models.ticket import Ticket
from app.services.cache_service import CacheService
from app.services.embedding_service import EmbeddingService
from app.services.text_utils import stable_hash, tokenize
from app.services.vector_store import IndexedChunk, VectorStore


@dataclass(frozen=True)
class RetrievalResult:
    ticket_id: str
    chunk_id: str
    section: str
    text: str
    metadata: dict[str, Any]
    score: float
    reasons: tuple[str, ...]

    def with_score(self, score: float) -> "RetrievalResult":
        return RetrievalResult(
            ticket_id=self.ticket_id,
            chunk_id=self.chunk_id,
            section=self.section,
            text=self.text,
            metadata=self.metadata,
            score=score,
            reasons=self.reasons,
        )


class Retriever:
    def __init__(self, settings: Settings, cache: CacheService, vector_store: VectorStore, embedding_service: EmbeddingService) -> None:
        self.settings = settings
        self.cache = cache
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        self.ticket_re = re.compile(rf"\b{re.escape(settings.jira_project_key)}-\d+\b", re.IGNORECASE)

    def extract_ticket_ids(self, query: str) -> list[str]:
        seen: set[str] = set()
        ticket_ids: list[str] = []
        for match in self.ticket_re.findall(query):
            ticket_id = match.upper()
            if ticket_id not in seen:
                seen.add(ticket_id)
                ticket_ids.append(ticket_id)
        return ticket_ids

    def select_mode(self, query: str) -> str:
        if self.extract_ticket_ids(query):
            return "ticket_lookup"
        if any(token in query.lower() for token in ["status:", "priority:", "assignee:", "label:", "sprint:"]):
            return "metadata_filter"
        return "hybrid"

    def retrieve(self, db: Session, query: str, filters: dict | None = None, top_k: int | None = None) -> tuple[str, list[RetrievalResult]]:
        top_k = top_k or self.settings.retrieval_top_k
        mode = self.select_mode(query)
        index_version = self.index_version()
        cache_key = stable_hash({"query": query.lower().strip(), "filters": filters or {}, "top_k": top_k, "version": index_version})
        cached = self.cache.get("retrieval", cache_key)
        if cached:
            return mode, [RetrievalResult(**item, reasons=tuple(item["reasons"])) for item in cached]
        if mode == "ticket_lookup":
            results = self._ticket_lookup(db, self.extract_ticket_ids(query))
        else:
            results = self._hybrid_search(query, filters=filters)
        results = self._dedupe_ticket_chunks(results)[:top_k]
        self.cache.set(
            "retrieval",
            cache_key,
            [
                {
                    "ticket_id": item.ticket_id,
                    "chunk_id": item.chunk_id,
                    "section": item.section,
                    "text": item.text,
                    "metadata": item.metadata,
                    "score": item.score,
                    "reasons": list(item.reasons),
                }
                for item in results
            ],
        )
        return mode, results

    def _ticket_lookup(self, db: Session, ticket_ids: list[str]) -> list[RetrievalResult]:
        tickets = db.query(Ticket).options(selectinload(Ticket.comments)).filter(Ticket.ticket_id.in_(ticket_ids)).all()
        results = []
        for ticket in tickets:
            text = f"{ticket.ticket_id} {ticket.summary} {ticket.description} {ticket.status} {ticket.priority}"
            results.append(
                RetrievalResult(
                    ticket_id=ticket.ticket_id,
                    chunk_id=f"{ticket.ticket_id}:direct",
                    section="ticket",
                    text=text,
                    metadata=self._ticket_metadata(ticket),
                    score=5.0,
                    reasons=("direct_ticket_lookup",),
                )
            )
        return results

    def _hybrid_search(self, query: str, filters: dict | None = None) -> list[RetrievalResult]:
        query_tokens = set(tokenize(query))
        query_vector = self.embedding_service.embed(query)
        results = []
        for chunk in self.vector_store.chunks:
            if filters and not self._matches_filters(chunk, filters):
                continue
            chunk_tokens = set(tokenize(chunk.text))
            keyword_score = len(query_tokens & chunk_tokens) / max(len(query_tokens), 1)
            vector_score = self.embedding_service.cosine(query_vector, chunk.vector)
            metadata_score = self._metadata_score(query_tokens, chunk.metadata)
            score = (0.55 * keyword_score) + (0.35 * vector_score) + metadata_score
            if score <= 0:
                continue
            reasons = []
            if keyword_score:
                reasons.append("keyword")
            if vector_score:
                reasons.append("vector")
            if metadata_score:
                reasons.append("metadata")
            results.append(
                RetrievalResult(
                    ticket_id=chunk.ticket_id,
                    chunk_id=chunk.chunk_id,
                    section=chunk.section,
                    text=chunk.text,
                    metadata=chunk.metadata,
                    score=score,
                    reasons=tuple(reasons),
                )
            )
        return sorted(results, key=lambda item: item.score, reverse=True)

    def _matches_filters(self, chunk: IndexedChunk, filters: dict) -> bool:
        metadata = chunk.metadata
        for field in ["status", "priority", "assignee", "sprint", "project_key"]:
            if filters.get(field) and str(metadata.get(field) or "").lower() != str(filters[field]).lower():
                return False
        if filters.get("label") and str(filters["label"]).lower() not in set(metadata.get("labels") or []):
            return False
        return True

    def _metadata_score(self, query_tokens: set[str], metadata: dict[str, Any]) -> float:
        score = 0.0
        status = str(metadata.get("status") or "").lower()
        priority = str(metadata.get("priority") or "").lower()
        labels = set(metadata.get("labels") or [])
        if "blocked" in query_tokens and status in {"blocked", "escalated"}:
            score += 0.35
        if query_tokens & {"critical", "highest", "high"} and priority in {"critical", "highest", "high"}:
            score += 0.25
        if "unassigned" in query_tokens and not metadata.get("assignee"):
            score += 0.25
        if query_tokens & labels:
            score += 0.2
        return score

    def _dedupe_ticket_chunks(self, results: list[RetrievalResult]) -> list[RetrievalResult]:
        best: dict[str, RetrievalResult] = {}
        for result in results:
            current = best.get(result.ticket_id)
            if current is None or result.score > current.score:
                best[result.ticket_id] = result
        return sorted(best.values(), key=lambda item: item.score, reverse=True)

    def _ticket_metadata(self, ticket: Ticket) -> dict[str, Any]:
        return {
            "ticket_id": ticket.ticket_id,
            "project_key": ticket.project_key,
            "status": ticket.status,
            "priority": ticket.priority,
            "assignee": ticket.assignee,
            "sprint": ticket.sprint,
            "labels": ticket.labels or [],
            "updated_at": ticket.updated_at,
            "resolution": ticket.resolution,
            "comment_count": len(ticket.comments),
        }

    def index_version(self) -> str:
        return stable_hash({item.chunk_id: item.content_hash for item in self.vector_store.chunks})
