from __future__ import annotations

import unittest

from app.services.prompt_builder import GROUNDING_RULES, PromptKind
from app.tests.helpers import close_db, synced_container_and_db


class RetrievalAndContextTests(unittest.TestCase):
    def setUp(self) -> None:
        self.container, self.db = synced_container_and_db()

    def tearDown(self) -> None:
        close_db(self.db)

    def test_ticket_id_extraction_is_case_insensitive(self) -> None:
        self.assertEqual(self.container.retriever.extract_ticket_ids("check aicb-104 and AICB-110"), ["AICB-104", "AICB-110"])

    def test_retrieval_mode_selects_ticket_lookup(self) -> None:
        self.assertEqual(self.container.retriever.select_mode("status of aicb-104"), "ticket_lookup")

    def test_direct_lookup_retrieves_requested_ticket(self) -> None:
        mode, results = self.container.retriever.retrieve(self.db, "status of aicb-104")
        self.assertEqual(mode, "ticket_lookup")
        self.assertEqual(results[0].ticket_id, "AICB-104")

    def test_context_builder_limits_context(self) -> None:
        _, results = self.container.retriever.retrieve(self.db, "blocked launch tickets", top_k=5)
        context, tickets = self.container.context_builder.build(self.db, results)
        self.assertLessEqual(len(context), self.container.settings.token_budget_chars + 20)
        self.assertTrue(tickets)

    def test_prompt_generation_contains_grounding_rules(self) -> None:
        prompt = self.container.prompt_builder.build("status?", "Ticket: AICB-104", PromptKind.SPECIFIC_TICKET)
        self.assertIn(GROUNDING_RULES, prompt)
        self.assertIn("Ticket: AICB-104", prompt)


if __name__ == "__main__":
    unittest.main()
