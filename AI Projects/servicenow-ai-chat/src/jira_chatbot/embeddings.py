from __future__ import annotations

import math
from collections import Counter

from jira_chatbot.cache import CacheBackend
from jira_chatbot.utils import stable_hash, tokenize


Vector = dict[str, float]


class LocalEmbeddingModel:
    """Deterministic token vector model for local retrieval and tests."""

    def __init__(self, cache: CacheBackend | None = None) -> None:
        self.cache = cache

    def embed(self, text: str) -> Vector:
        cache_key = stable_hash({"model": "local-hashing", "text": text})
        cached = self.cache.get("embedding", cache_key) if self.cache else None
        if cached is not None:
            return {str(key): float(value) for key, value in cached.items()}
        counts = Counter(tokenize(text))
        norm = math.sqrt(sum(value * value for value in counts.values())) or 1.0
        vector = {token: value / norm for token, value in counts.items()}
        if self.cache:
            self.cache.set("embedding", cache_key, vector)
        return vector


def cosine_similarity(left: Vector, right: Vector) -> float:
    if not left or not right:
        return 0.0
    small, large = (left, right) if len(left) <= len(right) else (right, left)
    return sum(value * large.get(token, 0.0) for token, value in small.items())
