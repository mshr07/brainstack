from __future__ import annotations

from enum import Enum


class PromptKind(str, Enum):
    GENERAL_QA = "general_qa"
    SPECIFIC_TICKET = "specific_ticket"
    ROOT_CAUSE = "root_cause"
    SOLUTION = "solution"
    SIMILAR = "similar_ticket_search"
    BLOCKER_RISK = "blocker_risk_analysis"
    STATUS_SUMMARY = "sprint_project_status_summary"
    TICKET_SUMMARY = "ticket_summarization"


GROUNDING_RULES = """Rules:
- Use only the retrieved Jira ticket context.
- Cite ticket IDs in every factual claim.
- If context is insufficient, say "The available Jira ticket data does not contain enough information".
- Never invent status, assignee, priority, blocker, root cause, date, estimate, or solution details.
- Separate facts, analysis, suggested solution, missing information, and confidence.
- Mark solution recommendations as recommendations, not confirmed facts."""


PROMPT_INSTRUCTIONS = {
    PromptKind.GENERAL_QA: "Answer the user's Jira question from context only.",
    PromptKind.SPECIFIC_TICKET: "Analyze the specific ticket from context only.",
    PromptKind.ROOT_CAUSE: "Explain root cause only if stated; otherwise list evidence and missing information.",
    PromptKind.SOLUTION: "Suggest a recommendation based only on ticket context.",
    PromptKind.SIMILAR: "Find similar tickets and explain exact matching evidence.",
    PromptKind.BLOCKER_RISK: "Identify blockers, risks, escalation candidates, and missing details.",
    PromptKind.STATUS_SUMMARY: "Summarize project or sprint status from cited tickets.",
    PromptKind.TICKET_SUMMARY: "Summarize the ticket with cited facts only.",
}


class PromptBuilder:
    def infer_kind(self, question: str, has_ticket_id: bool) -> PromptKind:
        lower = question.lower()
        if "root cause" in lower or lower.startswith("why "):
            return PromptKind.ROOT_CAUSE
        if "solution" in lower or "fix" in lower or "recommend" in lower:
            return PromptKind.SOLUTION
        if "similar" in lower or "duplicate" in lower:
            return PromptKind.SIMILAR
        if "block" in lower or "risk" in lower or "escalat" in lower:
            return PromptKind.BLOCKER_RISK
        if "status" in lower or "sprint" in lower or "project" in lower or "report" in lower:
            return PromptKind.STATUS_SUMMARY
        if "summary" in lower or "summarize" in lower:
            return PromptKind.TICKET_SUMMARY
        if has_ticket_id:
            return PromptKind.SPECIFIC_TICKET
        return PromptKind.GENERAL_QA

    def build(self, question: str, context: str, kind: PromptKind) -> str:
        return "\n\n".join(
            [
                PROMPT_INSTRUCTIONS[kind],
                GROUNDING_RULES,
                f"Question: {question}",
                f"Retrieved Jira context:\n{context or 'No context retrieved.'}",
                "Return the required response format with ticket citations and confidence.",
            ]
        )
