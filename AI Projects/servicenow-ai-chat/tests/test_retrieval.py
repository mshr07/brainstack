from __future__ import annotations

import json
import unittest
from pathlib import Path

from jira_chatbot.cache import InMemoryCache
from jira_chatbot.models import Ticket
from jira_chatbot.retrieval import TicketIndex


ROOT = Path(__file__).resolve().parents[1]


def load_tickets() -> list[Ticket]:
    raw = json.loads((ROOT / "data" / "dummy_jira_tickets.json").read_text(encoding="utf-8"))
    return [Ticket.from_dict(item) for item in raw]


class RetrievalTests(unittest.TestCase):
    def setUp(self) -> None:
        self.index = TicketIndex(load_tickets(), cache=InMemoryCache())

    def test_ticket_key_extraction_is_case_insensitive(self) -> None:
        self.assertEqual(self.index.extract_ticket_keys("what about aicb-104 and AICB-110?"), ["AICB-104", "AICB-110"])

    def test_direct_ticket_lookup_prioritizes_ticket(self) -> None:
        results = self.index.search("what is the status of aicb-104", top_k=3)
        self.assertTrue(results)
        self.assertEqual(results[0].chunk.ticket_key, "AICB-104")
        self.assertIn("direct_ticket_lookup", results[0].reasons)

    def test_hybrid_retrieval_finds_blocked_tickets(self) -> None:
        results = self.index.search("which tickets are blocked for launch", top_k=5)
        keys = {result.chunk.ticket_key for result in results}
        self.assertTrue({"AICB-104", "AICB-113", "AICB-120"} & keys)


if __name__ == "__main__":
    unittest.main()
