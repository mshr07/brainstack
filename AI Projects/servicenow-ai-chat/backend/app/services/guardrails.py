from __future__ import annotations

import re


TICKET_RE = re.compile(r"\b[A-Z][A-Z0-9]+-\d+\b")


class Guardrails:
    insufficient_message = "The available Jira ticket data does not contain enough information"

    def validate_context(self, context: str) -> bool:
        return bool(context and TICKET_RE.search(context))

    def ensure_citations(self, answer: str, ticket_ids: list[str]) -> str:
        if not ticket_ids:
            return answer
        cited = set(TICKET_RE.findall(answer))
        missing = [ticket_id for ticket_id in ticket_ids if ticket_id not in cited]
        if not missing:
            return answer
        return answer.rstrip() + "\n\nCitations added: " + ", ".join(missing)

    def not_enough_information(self, missing: str = "Relevant Jira ticket context") -> str:
        return (
            "Answer:\n"
            f"{self.insufficient_message}.\n\n"
            "Relevant tickets:\nNone\n\n"
            "Reasoning based on ticket data:\nNo matching ticket context was retrieved.\n\n"
            "Suggested next steps:\nSync Jira data or adjust the search query.\n\n"
            f"Missing information:\n{missing}.\n\n"
            "Confidence: Low"
        )
