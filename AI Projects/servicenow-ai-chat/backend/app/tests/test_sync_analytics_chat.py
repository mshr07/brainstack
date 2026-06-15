from __future__ import annotations

import unittest

from app.models.ticket import Ticket
from app.tests.helpers import close_db, synced_container_and_db


class SyncAnalyticsChatTests(unittest.TestCase):
    def setUp(self) -> None:
        self.container, self.db = synced_container_and_db()

    def tearDown(self) -> None:
        close_db(self.db)

    def test_mock_sync_loads_tickets(self) -> None:
        self.assertEqual(self.db.query(Ticket).count(), 20)
        self.assertGreaterEqual(len(self.container.vector_store.chunks), 20)

    def test_analytics_detects_missing_assignee(self) -> None:
        tickets = self.container.analytics.missing_assignee(self.db)
        ids = {ticket.ticket_id for ticket in tickets}
        self.assertEqual(ids, {"AICB-103", "AICB-112", "AICB-117"})

    def test_analytics_detects_blockers(self) -> None:
        ids = {ticket.ticket_id for ticket in self.container.analytics.blockers(self.db)}
        self.assertTrue({"AICB-104", "AICB-113", "AICB-120"}.issubset(ids))

    def test_chat_returns_grounded_ticket_solution(self) -> None:
        response = self.container.chat.chat(self.db, "Suggest a solution for AICB-110")
        self.assertIn("AICB-110", response.answer)
        self.assertIn("Recommendation based on available AICB-110 details", response.answer)
        self.assertEqual(response.retrieval_mode, "ticket_lookup")
        self.assertEqual(response.confidence, "High")

    def test_not_enough_information_for_unknown_ticket(self) -> None:
        response = self.container.chat.chat(self.db, "What is the status of AICB-999?")
        self.assertIn("does not contain enough information", response.answer)
        self.assertEqual(response.ticket_ids, [])

    def test_fresh_jira_ticket_is_added_indexed_and_answerable(self) -> None:
        fresh_ticket = {
            "ticket_id": "AICB-121",
            "project_key": "AICB",
            "summary": "Fresh board ticket needs OAuth token refresh handling",
            "description": "New Jira ticket created from the board after startup. The chatbot should include it after sync.",
            "comments": [
                {
                    "author": "Maya Chen",
                    "body": "Customer reports login failures after token expiry.",
                    "created_at": "2026-06-15T09:00:00Z",
                }
            ],
            "status": "Open",
            "priority": "Critical",
            "assignee": None,
            "reporter": "Ravi Kumar",
            "labels": ["fresh-ticket", "oauth", "customer-impact"],
            "sprint": "Sprint 25",
            "created_at": "2026-06-15T08:45:00Z",
            "updated_at": "2026-06-15T09:05:00Z",
            "resolution": None,
            "issue_type": "Bug",
            "parent_ticket": None,
            "linked_issues": [],
            "components": ["auth", "backend"],
            "acceptance_criteria": ["Refresh expired OAuth tokens without user-visible failure."],
            "custom_fields": {"blocked_reason": "Needs auth owner assignment"},
        }
        result = self.container.ingestion.sync_raw(self.db, [fresh_ticket])
        indexed = self.container.vector_store.rebuild_tickets(self.db, result.changed_ticket_ids)
        self.container.cache.clear("retrieval")
        self.container.cache.clear("answers")

        self.assertEqual(result.created, 1)
        self.assertEqual(result.updated, 0)
        self.assertIn("AICB-121", result.changed_ticket_ids)
        self.assertGreaterEqual(indexed, 2)

        response = self.container.chat.chat(self.db, "Suggest a solution for AICB-121")
        self.assertIn("AICB-121", response.answer)
        self.assertIn("Fresh board ticket needs OAuth token refresh handling", response.answer)
        self.assertEqual(response.retrieval_mode, "ticket_lookup")
        self.assertEqual(response.confidence, "High")


if __name__ == "__main__":
    unittest.main()
