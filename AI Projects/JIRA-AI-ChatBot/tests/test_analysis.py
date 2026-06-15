from __future__ import annotations

import json
import unittest
from datetime import date
from pathlib import Path

from jira_chatbot.analysis import JiraAnalyzer
from jira_chatbot.models import Ticket


ROOT = Path(__file__).resolve().parents[1]


def load_tickets() -> list[Ticket]:
    raw = json.loads((ROOT / "data" / "dummy_jira_tickets.json").read_text(encoding="utf-8"))
    return [Ticket.from_dict(item) for item in raw]


class AnalysisTests(unittest.TestCase):
    def setUp(self) -> None:
        self.analyzer = JiraAnalyzer(load_tickets(), reference_date=date(2026, 6, 15))

    def test_flags_missing_assignee(self) -> None:
        keys = {finding.ticket_key for finding in self.analyzer.missing_assignee()}
        self.assertEqual(keys, {"AICB-103", "AICB-112", "AICB-117"})

    def test_flags_high_priority_unresolved(self) -> None:
        keys = {finding.ticket_key for finding in self.analyzer.high_priority_unresolved()}
        self.assertIn("AICB-101", keys)
        self.assertIn("AICB-120", keys)
        self.assertNotIn("AICB-102", keys)

    def test_flags_long_inactivity(self) -> None:
        keys = {finding.ticket_key for finding in self.analyzer.long_inactivity()}
        self.assertIn("AICB-116", keys)


if __name__ == "__main__":
    unittest.main()
