import hashlib
import math
import re

import numpy as np

from app.core.config import get_settings


class SemanticMatcher:
    def __init__(self) -> None:
        self.dimensions = get_settings().embedding_dimensions

    def embed(self, text: str) -> list[float]:
        vector = np.zeros(self.dimensions, dtype=float)
        for token in re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{1,}", text.lower()):
            digest = hashlib.sha256(token.encode()).hexdigest()
            vector[int(digest[:8], 16) % self.dimensions] += 1
        norm = math.sqrt(float(np.dot(vector, vector)))
        if norm == 0:
            return [0.0] * self.dimensions
        return [round(float(value / norm), 6) for value in vector]

    def compare(self, resume_text: str, job_description: str) -> tuple[float, list[float]]:
        resume_embedding = self.embed(resume_text)
        jd_embedding = self.embed(job_description)
        left = np.array(resume_embedding, dtype=float)
        right = np.array(jd_embedding, dtype=float)
        denominator = float(np.linalg.norm(left) * np.linalg.norm(right))
        similarity = 0.0 if denominator == 0 else float(np.dot(left, right) / denominator)
        return round(similarity, 4), resume_embedding

