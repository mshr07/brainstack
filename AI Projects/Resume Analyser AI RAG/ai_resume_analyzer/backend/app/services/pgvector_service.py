from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import Analysis


class PgVectorService:
    """Store and search embeddings with PostgreSQL pgvector.

    The column type is VECTOR in PostgreSQL. During tests, SQLite stores the
    embedding as JSON and this service skips vector-distance queries.
    """

    def attach_embedding(self, analysis: Analysis, embedding: list[float]) -> None:
        analysis.embedding = embedding

    def find_similar(
        self,
        db: Session,
        embedding: list[float],
        limit: int = 5,
    ) -> list[dict[str, float | int]]:
        if db.get_bind().dialect.name != "postgresql":
            return []

        embedding_literal = "[" + ",".join(f"{value:.6f}" for value in embedding) + "]"
        rows = db.execute(
            text(
                """
                SELECT id, match_score,
                       1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
                FROM analyses
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> CAST(:embedding AS vector)
                LIMIT :limit
                """
            ),
            {"embedding": embedding_literal, "limit": limit},
        ).mappings()

        return [
            {
                "id": int(row["id"]),
                "match_score": int(row["match_score"]),
                "similarity": round(float(row["similarity"]), 4),
            }
            for row in rows
        ]

