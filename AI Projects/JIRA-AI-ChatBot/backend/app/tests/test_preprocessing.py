from __future__ import annotations

import unittest

from app.models.ticket import Ticket, TicketComment
from app.services.ticket_preprocessor import TicketPreprocessor


class PreprocessingTests(unittest.TestCase):
    def test_normalizes_and_deduplicates_comments(self) -> None:
        preprocessor = TicketPreprocessor()
        data = preprocessor.normalize_raw_ticket(
            {
                "key": "aicb-1",
                "summary": "<b>Broken</b>",
                "comments": [
                    {"author": "A", "body": "Same comment", "created_at": "2026-01-01T00:00:00Z"},
                    {"author": "A", "body": "Same comment", "created_at": "2026-01-01T00:00:00Z"},
                ],
            }
        )
        self.assertEqual(data["ticket_id"], "AICB-1")
        self.assertEqual(data["summary"], "Broken")
        self.assertEqual(len(data["comments"]), 1)

    def test_chunks_include_metadata(self) -> None:
        ticket = Ticket(
            ticket_id="AICB-1",
            project_key="AICB",
            summary="Cache bug",
            description="Embeddings are stale",
            status="Open",
            priority="High",
            labels=["cache"],
            components=["retrieval"],
            acceptance_criteria=["Refresh changed tickets"],
        )
        ticket.comments = [TicketComment(author="Maya", body="Needs fix", created_at="2026-01-01T00:00:00Z", body_hash="x")]
        chunks = TicketPreprocessor().chunk_ticket(ticket)
        self.assertGreaterEqual(len(chunks), 3)
        self.assertEqual(chunks[0].metadata["ticket_id"], "AICB-1")
        self.assertIn("cache", chunks[0].metadata["labels"])


if __name__ == "__main__":
    unittest.main()
