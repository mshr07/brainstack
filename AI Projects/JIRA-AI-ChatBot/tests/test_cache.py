from __future__ import annotations

import tempfile
import time
import unittest
from pathlib import Path

from jira_chatbot.cache import FileCache, InMemoryCache


class CacheTests(unittest.TestCase):
    def test_in_memory_cache_expires(self) -> None:
        cache = InMemoryCache()
        cache.set("answer", "q1", {"answer": "ok"}, ttl_seconds=1)
        self.assertEqual(cache.get("answer", "q1"), {"answer": "ok"})
        time.sleep(1.01)
        self.assertIsNone(cache.get("answer", "q1"))

    def test_file_cache_roundtrip(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            cache = FileCache(Path(tmp))
            cache.set("embedding", "abc", {"a": 1})
            self.assertEqual(cache.get("embedding", "abc"), {"a": 1})


if __name__ == "__main__":
    unittest.main()
