from __future__ import annotations

from app.models.ticket import Ticket
from app.services.guardrails import Guardrails
from app.services.prompt_builder import PromptKind
from app.services.retriever import RetrievalResult


class LLMService:
    """Grounded local answer generator. Replace this behind the same interface for a hosted LLM."""

    def __init__(self, guardrails: Guardrails) -> None:
        self.guardrails = guardrails

    def generate(
        self,
        question: str,
        prompt: str,
        kind: PromptKind,
        tickets: list[Ticket],
        results: list[RetrievalResult],
        retrieval_mode: str,
    ) -> tuple[str, str]:
        if not tickets:
            return self.guardrails.not_enough_information(), "Low"
        if kind == PromptKind.SPECIFIC_TICKET or retrieval_mode == "ticket_lookup" or len(tickets) == 1:
            answer = self._specific_ticket(tickets[0], kind)
        else:
            answer = self._general(tickets, kind)
        confidence = self._confidence(results, retrieval_mode)
        answer = answer.replace("Confidence: Medium", f"Confidence: {confidence}")
        return self.guardrails.ensure_citations(answer, [ticket.ticket_id for ticket in tickets]), confidence

    def _specific_ticket(self, ticket: Ticket, kind: PromptKind) -> str:
        facts = [
            f"- {ticket.ticket_id}: Status is {ticket.status}.",
            f"- {ticket.ticket_id}: Priority is {ticket.priority}.",
            f"- {ticket.ticket_id}: Assignee is {ticket.assignee or 'Unassigned'}.",
            f"- {ticket.ticket_id}: Resolution is {ticket.resolution or 'Unresolved'}.",
        ]
        blocker = (ticket.custom_fields or {}).get("blocked_reason")
        if blocker:
            facts.append(f"- {ticket.ticket_id}: Blocker reason is {blocker}.")
        if ticket.comments:
            facts.append(f"- {ticket.ticket_id}: Latest comment says {ticket.comments[-1].body}.")
        return (
            f"Ticket: {ticket.ticket_id}\n"
            f"Summary: {ticket.summary}\n"
            f"Status: {ticket.status}\n"
            f"Priority: {ticket.priority}\n"
            f"Assignee: {ticket.assignee or 'Unassigned'}\n\n"
            "Key facts from ticket:\n"
            + "\n".join(facts)
            + "\n\nAnalysis:\n"
            + self._analysis(ticket)
            + "\n\nSuggested solution:\n"
            + self._recommendation(ticket, kind)
            + "\n\nRisks / blockers:\n"
            + self._risks(ticket)
            + "\n\nMissing information:\n"
            + self._missing(ticket, kind)
            + "\n\nConfidence: Medium"
        )

    def _general(self, tickets: list[Ticket], kind: PromptKind) -> str:
        facts = [
            f"- {ticket.ticket_id}: {ticket.summary}; status {ticket.status}; priority {ticket.priority}; assignee {ticket.assignee or 'Unassigned'}."
            for ticket in tickets
        ]
        next_steps = "Review cited tickets, update missing fields, and escalate blocked high-priority work."
        if kind == PromptKind.STATUS_SUMMARY:
            next_steps = "Confirm current sprint/project scope and update unresolved high-priority tickets."
        return (
            "Answer:\n"
            + "\n".join(facts)
            + "\n\nRelevant tickets:\n"
            + ", ".join(ticket.ticket_id for ticket in tickets)
            + "\n\nReasoning based on ticket data:\nThe answer is limited to retrieved ticket summary, status, priority, assignee, labels, comments, and blocker metadata.\n\nSuggested next steps:\n"
            + next_steps
            + "\n\nMissing information:\nRoot cause, estimates, or business impact are included only when present in the cited tickets.\n\nConfidence: Medium"
        )

    def _analysis(self, ticket: Ticket) -> str:
        if ticket.status.lower() in {"blocked", "escalated"}:
            return f"{ticket.ticket_id} needs attention because its status is {ticket.status}."
        if ticket.priority.lower() in {"critical", "highest", "high"} and not ticket.resolution:
            return f"{ticket.ticket_id} is high priority and unresolved."
        if not ticket.acceptance_criteria:
            return f"{ticket.ticket_id} has incomplete requirements because acceptance criteria are missing."
        return f"{ticket.ticket_id} has enough retrieved ticket metadata for a basic answer."

    def _recommendation(self, ticket: Ticket, kind: PromptKind) -> str:
        prefix = f"Recommendation based on available {ticket.ticket_id} details: "
        blocker = (ticket.custom_fields or {}).get("blocked_reason")
        if blocker:
            return prefix + f"resolve or escalate the blocker: {blocker}."
        if not ticket.assignee:
            return prefix + "assign an owner before implementation."
        if not ticket.acceptance_criteria:
            return prefix + "add acceptance criteria before implementation."
        if kind == PromptKind.ROOT_CAUSE:
            return prefix + "verify the root cause with implementation evidence before treating it as confirmed."
        return prefix + "continue triage using the cited ticket facts."

    def _risks(self, ticket: Ticket) -> str:
        risks = []
        blocker = (ticket.custom_fields or {}).get("blocked_reason")
        if blocker:
            risks.append(f"{ticket.ticket_id}: {blocker}")
        if not ticket.assignee:
            risks.append(f"{ticket.ticket_id}: missing assignee")
        if not ticket.acceptance_criteria:
            risks.append(f"{ticket.ticket_id}: missing acceptance criteria")
        if ticket.priority.lower() in {"critical", "highest"} and not ticket.resolution:
            risks.append(f"{ticket.ticket_id}: critical unresolved work")
        return "\n".join(f"- {item}" for item in risks) if risks else f"- {ticket.ticket_id}: no explicit blocker in retrieved data."

    def _missing(self, ticket: Ticket, kind: PromptKind) -> str:
        missing = []
        if not ticket.assignee:
            missing.append("Assignee is not present.")
        if not ticket.acceptance_criteria:
            missing.append("Acceptance criteria are not present.")
        if "story_points" not in (ticket.custom_fields or {}):
            missing.append("Effort estimate is not present.")
        if kind in {PromptKind.ROOT_CAUSE, PromptKind.SOLUTION}:
            missing.append("Verified root cause and implementation evidence are not fully present unless cited above.")
        return "\n".join(f"- {item}" for item in missing) if missing else "- No obvious missing fields in retrieved context."

    def _confidence(self, results: list[RetrievalResult], retrieval_mode: str) -> str:
        if retrieval_mode == "ticket_lookup" and results:
            return "High"
        if not results:
            return "Low"
        best = max(item.score for item in results)
        if best >= 0.75:
            return "High"
        if best >= 0.25:
            return "Medium"
        return "Low"
