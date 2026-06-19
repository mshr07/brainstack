from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON, TypeDecorator

from app.core.config import get_settings
from app.database.session import Base

try:
    from pgvector.sqlalchemy import Vector as PgVector
except ImportError:
    PgVector = None


class EmbeddingVector(TypeDecorator):
    impl = JSON
    cache_ok = True

    def __init__(self, dimensions: int, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.dimensions = dimensions

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and PgVector is not None:
            return dialect.type_descriptor(PgVector(self.dimensions))
        return dialect.type_descriptor(JSON())


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    resume_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    semantic_similarity: Mapped[float] = mapped_column(Float, nullable=False)
    matched_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    suggestions: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    ai_summary: Mapped[str] = mapped_column(Text, nullable=False)
    job_alignment_advice: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    interview_questions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    answer_strategy: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    study_plan: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    recruiter_pitch: Mapped[str] = mapped_column(Text, nullable=False)
    ai_provider: Mapped[str] = mapped_column(String(100), nullable=False)
    ai_generated: Mapped[bool] = mapped_column(default=False, nullable=False)
    score_breakdown: Mapped[dict[str, float]] = mapped_column(JSON, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(
        EmbeddingVector(get_settings().embedding_dimensions),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
