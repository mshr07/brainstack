from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.ticket import Ticket


DONE_STATUSES = {"done", "closed", "resolved", "cancelled"}
HIGH_PRIORITIES = {"highest", "critical", "blocker", "high"}


class AnalyticsService:
    def blockers(self, db: Session) -> list[Ticket]:
        tickets = db.query(Ticket).all()
        return [
            ticket
            for ticket in tickets
            if ticket.status.lower() in {"blocked", "escalated"} or (ticket.custom_fields or {}).get("blocked_reason")
        ]

    def high_priority(self, db: Session) -> list[Ticket]:
        return [
            ticket
            for ticket in db.query(Ticket).all()
            if ticket.priority.lower() in HIGH_PRIORITIES and ticket.status.lower() not in DONE_STATUSES and not ticket.resolution
        ]

    def inactive(self, db: Session, days: int = 14) -> list[Ticket]:
        today = datetime.now(timezone.utc).date()
        inactive = []
        for ticket in db.query(Ticket).all():
            if ticket.status.lower() in DONE_STATUSES or ticket.resolution:
                continue
            if not ticket.updated_at:
                continue
            try:
                updated = datetime.fromisoformat(ticket.updated_at.replace("Z", "+00:00")).date()
            except ValueError:
                continue
            if (today - updated).days >= days:
                inactive.append(ticket)
        return inactive

    def missing_assignee(self, db: Session) -> list[Ticket]:
        return [ticket for ticket in db.query(Ticket).all() if not ticket.assignee and ticket.status.lower() not in DONE_STATUSES]
