from __future__ import annotations

from app.services.retriever import RetrievalResult


class Reranker:
    def rerank(self, query: str, results: list[RetrievalResult]) -> list[RetrievalResult]:
        lower = query.lower()
        adjusted: list[RetrievalResult] = []
        for item in results:
            score = item.score
            metadata = item.metadata
            status = str(metadata.get("status") or "").lower()
            priority = str(metadata.get("priority") or "").lower()
            if "blocked" in lower and status in {"blocked", "escalated"}:
                score += 0.35
            if "unresolved" in lower and not metadata.get("resolution"):
                score += 0.2
            if ("critical" in lower or "high priority" in lower) and priority in {"critical", "highest", "high"}:
                score += 0.2
            if "missing assignee" in lower and not metadata.get("assignee"):
                score += 0.25
            adjusted.append(item.with_score(score))
        return sorted(adjusted, key=lambda item: item.score, reverse=True)
