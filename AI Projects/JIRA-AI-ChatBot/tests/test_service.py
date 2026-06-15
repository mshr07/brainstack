from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from jira_chatbot.config import Settings
from jira_chatbot.service import JiraChatbotService


ROOT = Path(__file__).resolve().parents[1]


def settings(cache_dir: Path) -> Settings:
    return Settings(
        jira_data_path=ROOT / "data" / "dummy_jira_tickets.json",
        cache_dir=cache_dir,
        answer_cache_enabled=True,
    )


class ServiceTests(unittest.TestCase):
    def test_specific_ticket_answer_is_grounded_and_cited(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            service = JiraChatbotService(settings=settings(Path(tmp)))
            answer = service.ask("Suggest a solution for AICB-110")
            self.assertIn("Ticket: AICB-110", answer.answer)
            self.assertIn("Recommendation based on available AICB-110 details", answer.answer)
            self.assertIn("Missing information", answer.answer)
            self.assertIn("AICB-110", answer.ticket_ids)

    def test_unknown_ticket_returns_not_enough_information(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            service = JiraChatbotService(settings=settings(Path(tmp)))
            answer = service.ask("What is the status of AICB-999?")
            self.assertIn("does not contain ticket ID", answer.answer)
            self.assertEqual(answer.confidence, "High")

    def test_analysis_question_uses_deterministic_logic(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            service = JiraChatbotService(settings=settings(Path(tmp)))
            answer = service.ask("Which tickets have missing assignee?")
            self.assertIn("AICB-103", answer.answer)
            self.assertIn("AICB-112", answer.answer)
            self.assertIn("AICB-117", answer.answer)
            self.assertEqual(answer.confidence, "High")

    def test_answer_cache_marks_cached_response(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            service = JiraChatbotService(settings=settings(Path(tmp)))
            first = service.ask("What is the status of AICB-104?")
            second = service.ask("What is the status of AICB-104?")
            self.assertFalse(first.from_cache)
            self.assertTrue(second.from_cache)


if __name__ == "__main__":
    unittest.main()
