from __future__ import annotations

import logging
import re
from collections import defaultdict

from jira_chatbot.cache import CacheBackend
from jira_chatbot.embeddings import LocalEmbeddingModel, cosine_similarity
from jira_chatbot.models import RetrievalResult, Ticket, TicketChunk
from jira_chatbot.preprocessing import chunk_tickets, dataset_version
from jira_chatbot.utils import stable_hash, tokenize

logger = logging.getLogger(__name__)


class TicketIndex:
    def __init__(
        self,
        tickets: list[Ticket],
        project_key: str = "AICB",
        cache: CacheBackend | None = None,
        reranking_enabled: bool = True,
    ) -> None:
        self.tickets = {ticket.key: ticket for ticket in tickets}
        self.project_key = project_key.upper()
        self.cache = cache
        self.reranking_enabled = reranking_enabled
        self.version = dataset_version(tickets)
        self.chunks = chunk_tickets(tickets)
        self.embedding_model = LocalEmbeddingModel(cache=cache)
        self._chunk_vectors = {chunk.chunk_id: self.embedding_model.embed(chunk.text) for chunk in self.chunks}
        self._chunk_tokens = {chunk.chunk_id: set(tokenize(chunk.text)) for chunk in self.chunks}
        self._ticket_key_re = re.compile(rf"\b{re.escape(self.project_key)}-\d+\b", re.IGNORECASE)

    def extract_ticket_keys(self, query: str) -> list[str]:
        seen: set[str] = set()
        keys: list[str] = []
        for match in self._ticket_key_re.findall(query):
            key = match.upper()
            if key not in seen:
                seen.add(key)
                keys.append(key)
        return keys

    def get_ticket(self, key: str) -> Ticket | None:
        return self.tickets.get(key.upper())

    def search(self, query: str, top_k: int = 6) -> list[RetrievalResult]:
        normalized_query = " ".join(tokenize(query))
        cache_key = stable_hash({"query": normalized_query, "top_k": top_k, "version": self.version})
        cached = self.cache.get("retrieval", cache_key) if self.cache else None
        if cached is not None:
            return [self._result_from_dict(item) for item in cached]

        direct_keys = self.extract_ticket_keys(query)
        if direct_keys:
            results = self._direct_results(direct_keys)
        else:
            results = self._hybrid_results(query, top_k=max(top_k * 3, 12))
        results = self._dedupe_by_ticket(results)
        if self.reranking_enabled:
            results = self._rerank(query, results)
        results = results[:top_k]
        if self.cache:
            self.cache.set("retrieval", cache_key, [self._result_to_dict(item) for item in results])
        logger.info("retrieval completed query=%r ticket_ids=%s", query, [item.chunk.ticket_key for item in results])
        return results

    def _direct_results(self, keys: list[str]) -> list[RetrievalResult]:
        results: list[RetrievalResult] = []
        for key in keys:
            for chunk in self.chunks:
                if chunk.ticket_key == key:
                    score = 4.0 if chunk.section == "overview" else 3.0
                    results.append(RetrievalResult(chunk=chunk, score=score, reasons=("direct_ticket_lookup",)))
        return results

    def _hybrid_results(self, query: str, top_k: int) -> list[RetrievalResult]:
        query_tokens = set(tokenize(query))
        query_vector = self.embedding_model.embed(query)
        scored: list[RetrievalResult] = []
        for chunk in self.chunks:
            keyword = self._keyword_score(query_tokens, chunk)
            vector = cosine_similarity(query_vector, self._chunk_vectors[chunk.chunk_id])
            metadata_boost = self._metadata_boost(query_tokens, chunk)
            score = (0.58 * keyword) + (0.37 * vector) + metadata_boost
            if score <= 0:
                continue
            reasons = []
            if keyword > 0:
                reasons.append("keyword_match")
            if vector > 0:
                reasons.append("semantic_match")
            if metadata_boost:
                reasons.append("metadata_match")
            scored.append(RetrievalResult(chunk=chunk, score=score, reasons=tuple(reasons)))
        return sorted(scored, key=lambda item: item.score, reverse=True)[:top_k]

    def _keyword_score(self, query_tokens: set[str], chunk: TicketChunk) -> float:
        if not query_tokens:
            return 0.0
        chunk_tokens = self._chunk_tokens[chunk.chunk_id]
        overlap = len(query_tokens & chunk_tokens)
        return overlap / max(len(query_tokens), 1)

    def _metadata_boost(self, query_tokens: set[str], chunk: TicketChunk) -> float:
        metadata = chunk.metadata
        boost = 0.0
        status = str(metadata.get("status") or "").lower()
        priority = str(metadata.get("priority") or "").lower()
        labels = set(metadata.get("labels") or [])
        components = set(metadata.get("components") or [])
        if "blocked" in query_tokens and (status == "blocked" or "blocked" in labels or metadata.get("ticket_key") in query_tokens):
            boost += 0.35
        if "escalated" in query_tokens and status == "escalated":
            boost += 0.35
        if {"critical", "highest", "high"} & query_tokens and priority in {"critical", "highest", "high"}:
            boost += 0.25
        if "unassigned" in query_tokens and not metadata.get("assignee"):
            boost += 0.25
        if query_tokens & labels:
            boost += 0.2
        if query_tokens & components:
            boost += 0.2
        return boost

    def _dedupe_by_ticket(self, results: list[RetrievalResult]) -> list[RetrievalResult]:
        best: dict[str, RetrievalResult] = {}
        for result in results:
            current = best.get(result.chunk.ticket_key)
            if current is None or result.score > current.score:
                best[result.chunk.ticket_key] = result
        return sorted(best.values(), key=lambda item: item.score, reverse=True)

    def _rerank(self, query: str, results: list[RetrievalResult]) -> list[RetrievalResult]:
        query_lower = query.lower()
        adjusted: list[RetrievalResult] = []
        for result in results:
            ticket = self.tickets[result.chunk.ticket_key]
            score = result.score
            if "blocked" in query_lower and (ticket.status.lower() == "blocked" or ticket.blocker_reason):
                score += 0.25
            if "unresolved" in query_lower and not ticket.is_resolved:
                score += 0.2
            if "missing assignee" in query_lower and not ticket.assignee:
                score += 0.2
            if "acceptance criteria" in query_lower and not ticket.acceptance_criteria:
                score += 0.2
            adjusted.append(RetrievalResult(chunk=result.chunk, score=score, reasons=result.reasons))
        return sorted(adjusted, key=lambda item: item.score, reverse=True)

    def _result_to_dict(self, result: RetrievalResult) -> dict:
        return {
            "chunk_id": result.chunk.chunk_id,
            "ticket_key": result.chunk.ticket_key,
            "section": result.chunk.section,
            "text": result.chunk.text,
            "metadata": result.chunk.metadata,
            "score": result.score,
            "reasons": list(result.reasons),
        }

    def _result_from_dict(self, data: dict) -> RetrievalResult:
        chunk = TicketChunk(
            chunk_id=data["chunk_id"],
            ticket_key=data["ticket_key"],
            section=data["section"],
            text=data["text"],
            metadata=data["metadata"],
        )
        return RetrievalResult(chunk=chunk, score=float(data["score"]), reasons=tuple(data.get("reasons", [])))

    def similar_tickets(self, ticket_key: str, top_k: int = 5) -> list[RetrievalResult]:
        ticket = self.get_ticket(ticket_key)
        if not ticket:
            return []
        query = f"{ticket.summary} {ticket.description} {' '.join(ticket.labels)} {' '.join(ticket.components)}"
        results = [item for item in self.search(query, top_k=top_k + 1) if item.chunk.ticket_key != ticket.key]
        return results[:top_k]


def group_results_by_ticket(results: list[RetrievalResult]) -> dict[str, list[RetrievalResult]]:
    grouped: dict[str, list[RetrievalResult]] = defaultdict(list)
    for result in results:
        grouped[result.chunk.ticket_key].append(result)
    return dict(grouped)
