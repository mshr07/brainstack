from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import Settings
from app.database import Base
from app.dependencies import ServiceContainer
from app.models import ChatMessage, ChatSession, Ticket, TicketChunk, TicketComment, TicketEmbeddingMetadata  # noqa: F401


ROOT = Path(__file__).resolve().parents[3]


def test_settings() -> Settings:
    return Settings(
        database_url="sqlite:///:memory:",
        redis_url="",
        cache_enabled=True,
        auto_sync_mock=False,
        mock_jira_data_path=ROOT / "sample_data" / "jira_tickets.json",
        token_budget_chars=2500,
    )


def make_db() -> Session:
    engine = create_engine("sqlite:///:memory:", future=True, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    session = session_factory()
    session.info["test_engine"] = engine
    return session


def close_db(session: Session) -> None:
    engine = session.info.get("test_engine")
    session.close()
    if engine is not None:
        engine.dispose()


def synced_container_and_db() -> tuple[ServiceContainer, Session]:
    settings = test_settings()
    container = ServiceContainer(settings)
    db = make_db()
    container.ingestion.sync_mock(db)
    container.vector_store.rebuild(db)
    return container, db
