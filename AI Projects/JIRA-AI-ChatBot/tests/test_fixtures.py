from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class FixtureTests(unittest.TestCase):
    def test_dummy_jira_data_is_valid(self) -> None:
        tickets = json.loads((ROOT / "data" / "dummy_jira_tickets.json").read_text(encoding="utf-8"))
        self.assertEqual(len(tickets), 20)
        self.assertEqual(tickets[0]["key"], "AICB-101")
        self.assertEqual(tickets[-1]["key"], "AICB-120")
        self.assertTrue(any(ticket["status"] == "Blocked" for ticket in tickets))
        self.assertTrue(any(ticket["assignee"] is None for ticket in tickets))


if __name__ == "__main__":
    unittest.main()
