from __future__ import annotations

import unittest

from app.services.cache_service import CacheService
from app.services.guardrails import Guardrails
from app.tests.helpers import test_settings


class CacheAndGuardrailTests(unittest.TestCase):
    def test_cache_key_generation_is_stable(self) -> None:
        cache = CacheService(test_settings())
        left = cache.make_key("retrieval", {"q": "blocked", "top_k": 5})
        right = cache.make_key("retrieval", {"top_k": 5, "q": "blocked"})
        self.assertEqual(left, right)

    def test_guardrail_not_enough_information_format(self) -> None:
        answer = Guardrails().not_enough_information()
        self.assertIn("The available Jira ticket data does not contain enough information", answer)
        self.assertIn("Confidence: Low", answer)

    def test_guardrail_adds_missing_citations(self) -> None:
        answer = Guardrails().ensure_citations("Answer:\nSomething happened.", ["AICB-110"])
        self.assertIn("AICB-110", answer)


if __name__ == "__main__":
    unittest.main()
