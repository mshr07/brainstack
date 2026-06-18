from sqlalchemy import text

from app.database.session import Base, engine
from app.models.analysis import Analysis


def init_database() -> None:
    with engine.begin() as connection:
        if engine.dialect.name == "postgresql":
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)

