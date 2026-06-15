from __future__ import annotations

from sqlalchemy.orm import Session, selectinload

from app.config import Settings
from app.models.ticket import Ticket
from app.services.retriever import RetrievalResult
from app.services.text_utils import compact_join, truncate


class ContextBuilder:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def build(self, db: Session, results: list[RetrievalResult]) -> tuple[str, list[Ticket]]:
        ticket_ids = [item.ticket_id for item in results]
        tickets = (
            db.query(Ticket)
            .options(selectinload(Ticket.comments))
            .filter(Ticket.ticket_id.in_(ticket_ids))
            .all()
            if ticket_ids
            else []
        )
        order = {ticket_id: index for index, ticket_id in enumerate(ticket_ids)}
        tickets.sort(key=lambda ticket: order.get(ticket.ticket_id, 9999))
        blocks: list[str] = []
        used = 0
        for ticket in tickets:
            block = self._ticket_block(ticket)
            remaining = self.settings.token_budget_chars - used
            if remaining <= 0:
                break
            block = truncate(block, remaining)
            blocks.append(block)
            used += len(block)
        return "\n\n---\n\n".join(blocks), tickets

    def _ticket_block(self, ticket: Ticket) -> str:
        comments = " | ".join(f"{item.created_at} {item.author}: {item.body}" for item in ticket.comments[-3:])
        return compact_join(
            [
                f"Ticket: {ticket.ticket_id}",
                f"Summary: {ticket.summary}",
                f"Status: {ticket.status}",
                f"Priority: {ticket.priority}",
                f"Assignee: {ticket.assignee or 'Unassigned'}",
                f"Reporter: {ticket.reporter or 'Unknown'}",
                f"Sprint: {ticket.sprint or 'None'}",
                f"Resolution: {ticket.resolution or 'Unresolved'}",
                f"Labels: {', '.join(ticket.labels or []) or 'None'}",
                f"Description: {ticket.description}",
                f"Acceptance criteria: {'; '.join(ticket.acceptance_criteria or []) or 'Not provided'}",
                f"Blocker reason: {(ticket.custom_fields or {}).get('blocked_reason')}" if (ticket.custom_fields or {}).get("blocked_reason") else "",
                f"Recent comments: {comments}" if comments else "",
            ],
            separator="\n",
        )
