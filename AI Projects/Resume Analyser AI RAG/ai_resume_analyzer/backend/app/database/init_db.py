from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.logging import logger
from app.database.session import Base, engine
from app.models import Analysis


def init_database() -> None:
    """Create database objects needed by the app.

    PostgreSQL needs the pgvector extension before a VECTOR column can be used.
    SQLite is used only for tests, so the extension step is skipped there.
    """
    try:
        with engine.begin() as connection:
            if engine.dialect.name == "postgresql":
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized")
    except SQLAlchemyError:
        logger.exception("Database initialization failed")
        raise

