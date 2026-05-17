import numpy as np


class InMemoryFaissStyleService:
    """Educational comparison service.

    The requested project uses PostgreSQL pgvector as the vector database.
    This small in-memory class is included because many resume-analyzer
    tutorials mention FAISS. It shows the same cosine-search idea without
    becoming part of the production storage path.
    """

    def __init__(self) -> None:
        self._vectors: list[tuple[int, list[float]]] = []

    def add(self, item_id: int, embedding: list[float]) -> None:
        self._vectors.append((item_id, embedding))

    def search(self, query_embedding: list[float], limit: int = 5) -> list[tuple[int, float]]:
        query = np.array(query_embedding, dtype=float)
        results: list[tuple[int, float]] = []

        for item_id, embedding in self._vectors:
            vector = np.array(embedding, dtype=float)
            denominator = float(np.linalg.norm(query) * np.linalg.norm(vector))
            similarity = 0.0 if denominator == 0 else float(np.dot(query, vector) / denominator)
            results.append((item_id, round(similarity, 4)))

        return sorted(results, key=lambda item: item[1], reverse=True)[:limit]

