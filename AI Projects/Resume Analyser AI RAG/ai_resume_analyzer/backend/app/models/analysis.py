from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON, TypeDecorator

from app.core.config import get_settings
from app.database.session import Base

try:
    from pgvector.sqlalchemy import Vector as PgVector
except ImportError:  # pragma: no cover - requirements.txt installs pgvector.
    PgVector = None


class EmbeddingVector(TypeDecorator):
    """Use pgvector in PostgreSQL and JSON in SQLite tests.

    Students can explain this as a portability trick: production gets real
    vector search, while tests can run quickly without a PostgreSQL server.
    """

    impl = JSON
    cache_ok = True

    def __init__(self, dimensions: int, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.dimensions = dimensions

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and PgVector is not None:
            return dialect.type_descriptor(PgVector(self.dimensions))
        return dialect.type_descriptor(JSON())


settings = get_settings()


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    resume_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    semantic_similarity: Mapped[float] = mapped_column(Float, nullable=False)
    matched_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    weak_areas: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    suggestions: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    score_breakdown: Mapped[dict[str, float]] = mapped_column(JSON, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(
        EmbeddingVector(settings.embedding_dimensions),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

