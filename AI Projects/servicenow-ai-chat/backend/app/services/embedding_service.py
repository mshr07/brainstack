from __future__ import annotations

import math
from collections import Counter

from app.config import Settings
from app.services.cache_service import CacheService
from app.services.text_utils import stable_hash, tokenize


Vector = dict[str, float]


class EmbeddingService:
    def __init__(self, settings: Settings, cache: CacheService) -> None:
        self.settings = settings
        self.cache = cache

    def embed(self, text: str) -> Vector:
        key = stable_hash({"model": self.settings.embedding_model, "text": text})
        cached = self.cache.get("embeddings", key)
        if cached is not None:
            return {str(token): float(value) for token, value in cached.items()}
        counts = Counter(tokenize(text))
        norm = math.sqrt(sum(value * value for value in counts.values())) or 1.0
        vector = {token: value / norm for token, value in counts.items()}
        self.cache.set("embeddings", key, vector)
        return vector

    @staticmethod
    def cosine(left: Vector, right: Vector) -> float:
        if not left or not right:
            return 0.0
        small, large = (left, right) if len(left) <= len(right) else (right, left)
        return sum(value * large.get(token, 0.0) for token, value in small.items())
