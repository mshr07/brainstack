import hashlib
import math
import re

import numpy as np

from app.core.config import get_settings
from app.core.logging import logger


class SemanticMatcher:
    """Create embeddings and compare meaning, not only exact keywords.

    If sentence-transformers is installed and USE_TRANSFORMERS=true, the class
    uses a real transformer model. Otherwise it falls back to a deterministic
    hashing embedding so the project remains runnable on student laptops.
    """

    token_pattern = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.-]{1,}")

    def __init__(self) -> None:
        self.settings = get_settings()
        self.model = None
        if self.settings.use_transformers:
            self._load_transformer_model()

    def _load_transformer_model(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer(self.settings.transformer_model_name)
            logger.info("Loaded transformer model: %s", self.settings.transformer_model_name)
        except Exception:
            logger.exception("Could not load transformer model; using hashing embeddings")
            self.model = None

    def embed_text(self, text: str) -> list[float]:
        if self.model is not None:
            embedding = self.model.encode(text, normalize_embeddings=True)
            return [float(value) for value in embedding]
        return self._hash_embedding(text)

    def compare(self, resume_text: str, job_description: str) -> tuple[float, list[float]]:
        resume_embedding = self.embed_text(resume_text)
        jd_embedding = self.embed_text(job_description)
        similarity = self.cosine_similarity(resume_embedding, jd_embedding)
        return similarity, resume_embedding

    def cosine_similarity(self, left: list[float], right: list[float]) -> float:
        left_vector = np.array(left, dtype=float)
        right_vector = np.array(right, dtype=float)
        denominator = float(np.linalg.norm(left_vector) * np.linalg.norm(right_vector))
        if denominator == 0:
            return 0.0
        return round(float(np.dot(left_vector, right_vector) / denominator), 4)

    def _hash_embedding(self, text: str) -> list[float]:
        vector = np.zeros(self.settings.embedding_dimensions, dtype=float)
        tokens = [token.lower() for token in self.token_pattern.findall(text)]

        # The hashing trick maps tokens into a fixed-length vector. It is not as
        # smart as transformers, but it teaches the shape of embedding systems.
        for token in tokens:
            digest = hashlib.sha256(token.encode()).hexdigest()
            index = int(digest[:8], 16) % self.settings.embedding_dimensions
            sign = 1 if int(digest[8:10], 16) % 2 == 0 else -1
            vector[index] += sign

        norm = math.sqrt(float(np.dot(vector, vector)))
        if norm == 0:
            return [0.0] * self.settings.embedding_dimensions
        return [round(float(value / norm), 6) for value in vector]

