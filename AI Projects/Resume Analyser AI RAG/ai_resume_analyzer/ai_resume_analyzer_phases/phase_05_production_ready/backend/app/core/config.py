import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    app_env: str
    database_url: str
    embedding_dimensions: int
    cors_origins: list[str]


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS", "*")
    return Settings(
        app_env=os.getenv("APP_ENV", "development"),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./phase5_analyses.db"),
        embedding_dimensions=int(os.getenv("EMBEDDING_DIMENSIONS", "128")),
        cors_origins=[origin.strip() for origin in origins.split(",")],
    )

