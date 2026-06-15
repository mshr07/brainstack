from __future__ import annotations

from enum import Enum

from jira_chatbot.models import RetrievalResult, Ticket
from jira_chatbot.utils import truncate


class PromptKind(str, Enum):
    GENERAL_QA = "general_qa"
    SPECIFIC_TICKET = "specific_ticket"
    ROOT_CAUSE = "root_cause"
    SOLUTION = "solution"
    SUMMARY = "summary"
    SIMILAR = "similar"
    STATUS_REPORT = "status_report"
    RISK = "risk"


PROMPT_RULES = """Rules:
- Use only the provided Jira ticket context.
- Cite ticket IDs for every factual claim.
- If context is insufficient, say "not enough information".
- Never invent status, assignee, dates, blockers, estimates, root cause, or solution details.
- Separate facts, inferences, suggestions, missing information, and confidence."""


TEMPLATES = {
    PromptKind.GENERAL_QA: "Answer the user question from Jira context only.",
    PromptKind.SPECIFIC_TICKET: "Analyze the specified Jira ticket using only its context.",
    PromptKind.ROOT_CAUSE: "Provide root cause analysis. Mark unsupported causes as inference.",
    PromptKind.SOLUTION: "Suggest a solution based only on available ticket details.",
    PromptKind.SUMMARY: "Summarize relevant Jira ticket data compactly.",
    PromptKind.SIMILAR: "Find similar tickets and explain matching evidence.",
    PromptKind.STATUS_REPORT: "Create a concise status report from ticket context.",
    PromptKind.RISK: "Identify risks, blockers, escalation candidates, and missing information.",
}


class PromptBuilder:
    def __init__(self, max_context_chars: int = 6000) -> None:
        self.max_context_chars = max_context_chars

    def build(self, query: str, tickets: list[Ticket], results: list[RetrievalResult], kind: PromptKind) -> str:
        context = self.format_context(tickets, results)
        return "\n\n".join(
            [
                TEMPLATES[kind],
                PROMPT_RULES,
                f"User question: {query}",
                f"Jira context:\n{context}",
                "Required format: Answer, Relevant tickets, Reasoning based on ticket data, Suggested next steps, Missing information, Confidence.",
            ]
        )

    def format_context(self, tickets: list[Ticket], results: list[RetrievalResult]) -> str:
        result_keys = {result.chunk.ticket_key for result in results}
        ordered = [ticket for ticket in tickets if ticket.key in result_keys]
        if not ordered:
            ordered = tickets
        blocks: list[str] = []
        used = 0
        for ticket in ordered:
            block = ticket.compact_context(include_comments=True)
            remaining = self.max_context_chars - used
            if remaining <= 0:
                break
            block = truncate(block, remaining)
            blocks.append(block)
            used += len(block)
        return "\n\n---\n\n".join(blocks) if blocks else "No relevant Jira context retrieved."


def infer_prompt_kind(query: str, has_ticket_key: bool = False) -> PromptKind:
    lower = query.lower()
    if "root cause" in lower or "why" in lower:
        return PromptKind.ROOT_CAUSE
    if "solution" in lower or "fix" in lower or "recommend" in lower:
        return PromptKind.SOLUTION
    if "similar" in lower or "duplicate" in lower:
        return PromptKind.SIMILAR
    if "risk" in lower or "blocked" in lower or "escalat" in lower:
        return PromptKind.RISK
    if "status" in lower or "report" in lower:
        return PromptKind.STATUS_REPORT
    if has_ticket_key:
        return PromptKind.SPECIFIC_TICKET
    return PromptKind.GENERAL_QA
