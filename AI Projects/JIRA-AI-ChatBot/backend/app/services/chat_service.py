from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.config import Settings
from app.models.chat import ChatMessage, ChatSession
from app.models.ticket import Ticket
from app.schemas.chat import ChatResponse
from app.services.cache_service import CacheService
from app.services.context_builder import ContextBuilder
from app.services.guardrails import Guardrails
from app.services.llm_service import LLMService
from app.services.prompt_builder import PromptBuilder
from app.services.reranker import Reranker
from app.services.retriever import Retriever
from app.services.text_utils import stable_hash

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(
        self,
        settings: Settings,
        cache: CacheService,
        retriever: Retriever,
        reranker: Reranker,
        context_builder: ContextBuilder,
        prompt_builder: PromptBuilder,
        llm_service: LLMService,
        guardrails: Guardrails,
    ) -> None:
        self.settings = settings
        self.cache = cache
        self.retriever = retriever
        self.reranker = reranker
        self.context_builder = context_builder
        self.prompt_builder = prompt_builder
        self.llm_service = llm_service
        self.guardrails = guardrails

    def chat(self, db: Session, question: str, session_id: int | None = None, filters: dict | None = None) -> ChatResponse:
        mode = self.retriever.select_mode(question)
        answer_key = stable_hash(
            {
                "question": question.lower().strip(),
                "mode": mode,
                "filters": filters or {},
                "index_version": self.retriever.index_version(),
            }
        )
        cached = self.cache.get("answers", answer_key)
        if cached:
            cached["from_cache"] = True
            return ChatResponse(**cached)

        analytics_response = self._try_analytics_question(db, question, session_id)
        if analytics_response is not None:
            self.cache.set("answers", answer_key, analytics_response.model_dump())
            return analytics_response

        mode, results = self.retriever.retrieve(db, question, filters=filters, top_k=self.settings.retrieval_top_k)
        if self.settings.reranking_enabled:
            results = self.reranker.rerank(question, results)
        context, tickets = self.context_builder.build(db, results)

        requested_ids = self.retriever.extract_ticket_ids(question)
        if requested_ids and not tickets:
            answer = self.guardrails.not_enough_information(f"Ticket ID(s) not found: {', '.join(requested_ids)}")
            response = ChatResponse(answer=answer, ticket_ids=[], confidence="High", retrieval_mode=mode, relevant_tickets=[])
            return response

        kind = self.prompt_builder.infer_kind(question, has_ticket_id=bool(requested_ids))
        prompt = self.prompt_builder.build(question, context, kind)
        answer, confidence = self.llm_service.generate(question, prompt, kind, tickets, results, mode)
        ticket_ids = [ticket.ticket_id for ticket in tickets]
        response = ChatResponse(
            answer=answer,
            ticket_ids=ticket_ids,
            confidence=confidence,
            retrieval_mode=mode,
            relevant_tickets=[self._ticket_summary(ticket) for ticket in tickets],
            from_cache=False,
        )
        self.cache.set("answers", answer_key, response.model_dump())
        self._store_message(db, question, answer, ticket_ids, confidence, session_id)
        logger.info("chat answered mode=%s tickets=%s confidence=%s", mode, ticket_ids, confidence)
        return response

    def _store_message(
        self,
        db: Session,
        question: str,
        answer: str,
        ticket_ids: list[str],
        confidence: str,
        session_id: int | None,
    ) -> None:
        session = db.get(ChatSession, session_id) if session_id else None
        if session is None:
            session = ChatSession(title=question[:80])
            db.add(session)
            db.flush()
        db.add(ChatMessage(session_id=session.id, role="user", content=question, ticket_ids=[]))
        db.add(ChatMessage(session_id=session.id, role="assistant", content=answer, ticket_ids=ticket_ids, confidence=confidence))
        db.commit()

    def _ticket_summary(self, ticket: Ticket) -> dict:
        return {
            "ticket_id": ticket.ticket_id,
            "summary": ticket.summary,
            "status": ticket.status,
            "priority": ticket.priority,
            "assignee": ticket.assignee,
        }

    def _try_analytics_question(self, db: Session, question: str, session_id: int | None) -> ChatResponse | None:
        lower = question.lower()
        tickets: list[Ticket] | None = None
        title = ""
        if "missing assignee" in lower or "unassigned" in lower:
            tickets = [
                ticket
                for ticket in db.query(Ticket).all()
                if not ticket.assignee and ticket.status.lower() not in {"done", "closed", "resolved", "cancelled"}
            ]
            title = "Tickets missing assignees"
        elif "blocked" in lower and ("which" in lower or "list" in lower or "why" in lower):
            tickets = [
                ticket
                for ticket in db.query(Ticket).all()
                if ticket.status.lower() in {"blocked", "escalated"} or (ticket.custom_fields or {}).get("blocked_reason")
            ]
            title = "Blocked or escalated tickets"
        elif ("critical" in lower or "high priority" in lower) and "unresolved" in lower:
            tickets = [
                ticket
                for ticket in db.query(Ticket).all()
                if ticket.priority.lower() in {"highest", "critical", "blocker", "high"}
                and ticket.status.lower() not in {"done", "closed", "resolved", "cancelled"}
                and not ticket.resolution
            ]
            title = "High-priority unresolved tickets"
        if tickets is None:
            return None

        if not tickets:
            answer = (
                f"Answer:\nNo tickets matched: {title}.\n\n"
                "Relevant tickets:\nNone\n\n"
                "Reasoning based on ticket data:\nNo local Jira tickets matched the deterministic analytics rule.\n\n"
                "Suggested next steps:\nConfirm the mock Jira data is synced.\n\n"
                "Missing information:\nNo additional ticket context.\n\n"
                "Confidence: High"
            )
            return ChatResponse(answer=answer, ticket_ids=[], confidence="High", retrieval_mode="analytics", relevant_tickets=[])

        lines = [
            f"- {ticket.ticket_id}: {ticket.summary}; status {ticket.status}; priority {ticket.priority}; assignee {ticket.assignee or 'Unassigned'}."
            for ticket in tickets
        ]
        ticket_ids = [ticket.ticket_id for ticket in tickets]
        answer = (
            f"Answer:\n{title}:\n"
            + "\n".join(lines)
            + "\n\nRelevant tickets:\n"
            + ", ".join(ticket_ids)
            + "\n\nReasoning based on ticket data:\nEach ticket is included because its stored Jira fields match this analytics question.\n\n"
            + "Suggested next steps:\nAssign owners, update blockers, and confirm priority before planning work.\n\n"
            + "Missing information:\nOnly fields present in local Jira data were used.\n\n"
            + "Confidence: High"
        )
        self._store_message(db, question, answer, ticket_ids, "High", session_id)
        return ChatResponse(
            answer=answer,
            ticket_ids=ticket_ids,
            confidence="High",
            retrieval_mode="analytics",
            relevant_tickets=[self._ticket_summary(ticket) for ticket in tickets],
            from_cache=False,
        )
