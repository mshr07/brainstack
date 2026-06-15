from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone

from jira_chatbot.models import Ticket
from jira_chatbot.utils import parse_datetime


@dataclass(frozen=True)
class TicketFinding:
    ticket_key: str
    category: str
    reason: str
    severity: str


class JiraAnalyzer:
    def __init__(self, tickets: list[Ticket], reference_date: date | None = None) -> None:
        self.tickets = tickets
        self.reference_date = reference_date or datetime.now(timezone.utc).date()

    def blocked_tickets(self) -> list[TicketFinding]:
        findings = []
        for ticket in self.tickets:
            if ticket.status.lower() in {"blocked", "escalated"} or ticket.blocker_reason:
                reason = ticket.blocker_reason or f"Status is {ticket.status}"
                findings.append(TicketFinding(ticket.key, "blocked", reason, self._severity(ticket)))
        return findings

    def high_priority_unresolved(self) -> list[TicketFinding]:
        return [
            TicketFinding(ticket.key, "high_priority_unresolved", f"{ticket.priority} ticket is unresolved", self._severity(ticket))
            for ticket in self.tickets
            if ticket.is_high_priority and not ticket.is_resolved
        ]

    def unclear_requirements(self) -> list[TicketFinding]:
        findings = []
        markers = {"unclear", "requirements", "tbd", "confirm", "decision needed"}
        for ticket in self.tickets:
            body = f"{ticket.summary} {ticket.description} {' '.join(ticket.labels)}".lower()
            if not ticket.acceptance_criteria or markers & set(body.split()):
                findings.append(
                    TicketFinding(
                        ticket.key,
                        "unclear_requirements",
                        "Acceptance criteria are missing or requirements need clarification",
                        self._severity(ticket),
                    )
                )
        return findings

    def repeated_failures(self) -> list[TicketFinding]:
        findings = []
        for ticket in self.tickets:
            count = int(ticket.custom_fields.get("repeated_failure_count") or 0)
            text = f"{ticket.summary} {' '.join(ticket.labels)}".lower()
            if count >= 2 or "repeated" in text or ticket.status.lower() == "reopened":
                findings.append(
                    TicketFinding(
                        ticket.key,
                        "repeated_failure",
                        f"Repeated failure signal detected; count={count or 'not specified'}",
                        self._severity(ticket),
                    )
                )
        return findings

    def long_inactivity(self, days: int = 14) -> list[TicketFinding]:
        findings = []
        for ticket in self.tickets:
            if ticket.is_resolved:
                continue
            updated = parse_datetime(ticket.updated_at)
            if not updated:
                continue
            inactive_days = (self.reference_date - updated.date()).days
            if inactive_days >= days:
                findings.append(
                    TicketFinding(
                        ticket.key,
                        "long_inactivity",
                        f"No update for {inactive_days} days",
                        self._severity(ticket),
                    )
                )
        return findings

    def many_comments(self, threshold: int = 4) -> list[TicketFinding]:
        return [
            TicketFinding(ticket.key, "many_comments", f"Ticket has {len(ticket.comments)} comments", self._severity(ticket))
            for ticket in self.tickets
            if len(ticket.comments) >= threshold
        ]

    def missing_assignee(self) -> list[TicketFinding]:
        return [
            TicketFinding(ticket.key, "missing_assignee", "Ticket has no assignee", self._severity(ticket))
            for ticket in self.tickets
            if not ticket.assignee and not ticket.is_resolved
        ]

    def missing_acceptance_criteria(self) -> list[TicketFinding]:
        return [
            TicketFinding(ticket.key, "missing_acceptance_criteria", "Acceptance criteria are missing", self._severity(ticket))
            for ticket in self.tickets
            if not ticket.acceptance_criteria and not ticket.is_resolved
        ]

    def escalation_candidates(self) -> list[TicketFinding]:
        findings = []
        high_keys = {finding.ticket_key for finding in self.high_priority_unresolved()}
        blocked_keys = {finding.ticket_key for finding in self.blocked_tickets()}
        repeated_keys = {finding.ticket_key for finding in self.repeated_failures()}
        for ticket in self.tickets:
            if ticket.key in high_keys and (ticket.key in blocked_keys or ticket.key in repeated_keys or ticket.status.lower() == "escalated"):
                findings.append(
                    TicketFinding(
                        ticket.key,
                        "needs_escalation",
                        "High priority unresolved ticket has blocker, escalation, or repeated failure signal",
                        self._severity(ticket),
                    )
                )
        return findings

    def risk_report(self) -> dict[str, list[TicketFinding]]:
        return {
            "blocked": self.blocked_tickets(),
            "high_priority_unresolved": self.high_priority_unresolved(),
            "unclear_requirements": self.unclear_requirements(),
            "repeated_failures": self.repeated_failures(),
            "long_inactivity": self.long_inactivity(),
            "many_comments": self.many_comments(),
            "missing_assignee": self.missing_assignee(),
            "missing_acceptance_criteria": self.missing_acceptance_criteria(),
            "needs_escalation": self.escalation_candidates(),
        }

    def _severity(self, ticket: Ticket) -> str:
        custom = str(ticket.custom_fields.get("severity") or "").upper()
        if custom:
            return custom
        if ticket.priority.lower() in {"highest", "critical"}:
            return "S1"
        if ticket.priority.lower() == "high":
            return "S2"
        return "S3"
