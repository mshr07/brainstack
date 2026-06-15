from __future__ import annotations

from jira_chatbot.analysis import TicketFinding
from jira_chatbot.models import GroundedAnswer, RetrievalResult, Ticket
from jira_chatbot.prompts import PromptKind


class GroundedAnswerGenerator:
    """Deterministic answer composer that never uses facts outside retrieved tickets."""

    def answer(
        self,
        query: str,
        tickets: list[Ticket],
        results: list[RetrievalResult],
        kind: PromptKind,
        from_cache: bool = False,
    ) -> GroundedAnswer:
        if not tickets:
            return GroundedAnswer(
                answer=(
                    "Answer:\n"
                    "The available ticket data does not contain enough information to answer that question.\n\n"
                    "Relevant tickets:\nNone\n\n"
                    "Missing information:\nRelevant Jira ticket context.\n\n"
                    "Confidence: Low"
                ),
                ticket_ids=(),
                confidence="Low",
                retrieval_results=tuple(results),
                from_cache=from_cache,
            )
        if kind == PromptKind.SPECIFIC_TICKET or len(tickets) == 1:
            text = self._specific_ticket_answer(tickets[0], query, kind)
        else:
            text = self._general_answer(query, tickets, kind)
        confidence = self._confidence(results, tickets)
        return GroundedAnswer(
            answer=text.replace("Confidence: Medium", f"Confidence: {confidence}"),
            ticket_ids=tuple(ticket.key for ticket in tickets),
            confidence=confidence,
            retrieval_results=tuple(results),
            from_cache=from_cache,
        )

    def findings_answer(self, title: str, findings: list[TicketFinding]) -> GroundedAnswer:
        if not findings:
            return GroundedAnswer(
                answer=f"Answer:\nNo tickets in the available data match: {title}.\n\nRelevant tickets:\nNone\n\nConfidence: High",
                ticket_ids=(),
                confidence="High",
            )
        lines = [f"- {item.ticket_key}: {item.reason} ({item.category}, {item.severity})" for item in findings]
        ticket_ids = tuple(item.ticket_key for item in findings)
        return GroundedAnswer(
            answer=(
                f"Answer:\n{title}:\n"
                + "\n".join(lines)
                + "\n\nRelevant tickets:\n"
                + ", ".join(ticket_ids)
                + "\n\nReasoning based on ticket data:\nEach item is listed only because the matching field is present in the local Jira data.\n\nSuggested next steps:\nReview the listed tickets in priority order and update missing owner, blocker, or requirement fields.\n\nMissing information:\nNo additional Jira fields were retrieved beyond the fixture data.\n\nConfidence: High"
            ),
            ticket_ids=ticket_ids,
            confidence="High",
        )

    def _specific_ticket_answer(self, ticket: Ticket, query: str, kind: PromptKind) -> str:
        facts = [
            f"- {ticket.key}: Status is {ticket.status}.",
            f"- {ticket.key}: Priority is {ticket.priority}.",
            f"- {ticket.key}: Assignee is {ticket.assignee or 'Unassigned'}.",
            f"- {ticket.key}: Resolution is {ticket.resolution or 'Unresolved'}.",
        ]
        if ticket.blocker_reason:
            facts.append(f"- {ticket.key}: Blocker reason is {ticket.blocker_reason}.")
        if ticket.latest_comment:
            facts.append(f"- {ticket.key}: Latest comment says {ticket.latest_comment.body}.")
        suggested = self._suggestion_for(ticket, kind)
        missing = self._missing_for(ticket, kind)
        return (
            f"Ticket: {ticket.key}\n"
            f"Summary: {ticket.summary}\n"
            f"Status: {ticket.status}\n"
            f"Priority: {ticket.priority}\n"
            f"Assignee: {ticket.assignee or 'Unassigned'}\n\n"
            "Key facts from ticket:\n"
            + "\n".join(facts)
            + "\n\nAnalysis:\n"
            + self._analysis_for(ticket)
            + "\n\nSuggested solution:\n"
            + suggested
            + "\n\nRisks / blockers:\n"
            + self._risks_for(ticket)
            + "\n\nMissing information:\n"
            + missing
            + "\n\nConfidence: Medium"
        )

    def _general_answer(self, query: str, tickets: list[Ticket], kind: PromptKind) -> str:
        relevant = ", ".join(ticket.key for ticket in tickets)
        facts = []
        for ticket in tickets:
            detail = f"- {ticket.key}: {ticket.summary}; status {ticket.status}; priority {ticket.priority}; assignee {ticket.assignee or 'Unassigned'}."
            if ticket.blocker_reason:
                detail += f" Blocker reason: {ticket.blocker_reason}."
            facts.append(detail)
        missing = "Additional Jira context may be needed for root cause, effort estimates, or business impact not present in these tickets."
        if kind == PromptKind.RISK:
            next_steps = "Prioritize blocked, escalated, unassigned, and critical unresolved tickets."
        elif kind == PromptKind.SOLUTION:
            next_steps = "Use the ticket facts above to choose owners, verify blockers, and update acceptance criteria before implementation."
        else:
            next_steps = "Review the cited tickets and update missing fields before relying on broader conclusions."
        return (
            "Answer:\n"
            + "\n".join(facts)
            + "\n\nRelevant tickets:\n"
            + relevant
            + "\n\nReasoning based on ticket data:\nThe answer is limited to the retrieved ticket summaries, status, priority, assignee, labels, and recent comments.\n\nSuggested next steps:\n"
            + next_steps
            + "\n\nMissing information:\n"
            + missing
            + "\n\nConfidence: Medium"
        )

    def _analysis_for(self, ticket: Ticket) -> str:
        if ticket.status.lower() in {"blocked", "escalated"}:
            return f"{ticket.key} needs attention because its status is {ticket.status}."
        if ticket.is_high_priority and not ticket.is_resolved:
            return f"{ticket.key} is high priority and unresolved."
        if not ticket.acceptance_criteria:
            return f"{ticket.key} has incomplete requirements because acceptance criteria are missing."
        return f"{ticket.key} has enough ticket metadata for a basic status answer."

    def _suggestion_for(self, ticket: Ticket, kind: PromptKind) -> str:
        prefix = f"Recommendation based on available {ticket.key} details: "
        if kind == PromptKind.ROOT_CAUSE:
            return prefix + "validate the listed symptoms and comments before declaring root cause."
        if ticket.blocker_reason:
            return prefix + f"resolve or escalate the blocker: {ticket.blocker_reason}."
        if not ticket.assignee:
            return prefix + "assign an owner before planning implementation."
        if not ticket.acceptance_criteria:
            return prefix + "add acceptance criteria before implementation."
        if ticket.is_high_priority and not ticket.is_resolved:
            return prefix + "prioritize triage, confirm scope, and update the ticket with implementation evidence."
        return prefix + "continue with normal triage using the cited ticket facts."

    def _risks_for(self, ticket: Ticket) -> str:
        risks = []
        if ticket.blocker_reason:
            risks.append(f"{ticket.key}: {ticket.blocker_reason}")
        if not ticket.assignee:
            risks.append(f"{ticket.key}: missing assignee")
        if not ticket.acceptance_criteria:
            risks.append(f"{ticket.key}: missing acceptance criteria")
        if ticket.is_high_priority and not ticket.is_resolved:
            risks.append(f"{ticket.key}: high-priority unresolved work")
        return "\n".join(f"- {item}" for item in risks) if risks else f"- {ticket.key}: no explicit blocker found in the available ticket data."

    def _missing_for(self, ticket: Ticket, kind: PromptKind) -> str:
        missing = []
        if not ticket.assignee:
            missing.append("Assignee is not present.")
        if not ticket.acceptance_criteria:
            missing.append("Acceptance criteria are not present.")
        if ticket.story_points is None:
            missing.append("Story points or effort estimate are not present.")
        if kind in {PromptKind.ROOT_CAUSE, PromptKind.SOLUTION}:
            missing.append("Implementation evidence and verified root cause are not fully present unless explicitly stated above.")
        return "\n".join(f"- {item}" for item in missing) if missing else "- No obvious missing field for this question in the retrieved ticket context."

    def _confidence(self, results: list[RetrievalResult], tickets: list[Ticket]) -> str:
        if not results:
            return "Low"
        max_score = max(result.score for result in results)
        if len(tickets) == 1 and max_score >= 3.0:
            return "High"
        if max_score >= 0.75:
            return "High"
        if max_score >= 0.25:
            return "Medium"
        return "Low"
