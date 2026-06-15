from __future__ import annotations

import json
import unittest
from pathlib import Path

from jira_chatbot.models import Ticket
from jira_chatbot.prompts import PROMPT_RULES, PromptBuilder, PromptKind, infer_prompt_kind


ROOT = Path(__file__).resolve().parents[1]


class PromptTests(unittest.TestCase):
    def test_prompt_rules_include_anti_hallucination_controls(self) -> None:
        self.assertIn("Use only the provided Jira ticket context", PROMPT_RULES)
        self.assertIn("Cite ticket IDs", PROMPT_RULES)
        self.assertIn("not enough information", PROMPT_RULES)

    def test_infers_solution_kind(self) -> None:
        self.assertEqual(infer_prompt_kind("suggest a solution for AICB-110", has_ticket_key=True), PromptKind.SOLUTION)

    def test_context_builder_limits_context_size(self) -> None:
        raw = json.loads((ROOT / "data" / "dummy_jira_tickets.json").read_text(encoding="utf-8"))
        tickets = [Ticket.from_dict(item) for item in raw[:3]]
        prompt = PromptBuilder(max_context_chars=500).build("status?", tickets, [], PromptKind.GENERAL_QA)
        self.assertLess(len(prompt), 1800)
        self.assertIn("Rules:", prompt)


if __name__ == "__main__":
    unittest.main()
