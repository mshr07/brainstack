import os
from dataclasses import dataclass
from functools import lru_cache


def _get_bool(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _get_float(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return float(raw_value)


@dataclass(frozen=True)
class Settings:
    app_name: str
    environment: str
    database_url: str
    cors_origins: list[str]
    embedding_dimensions: int
    use_transformers: bool
    transformer_model_name: str
    max_resume_size_mb: int
    skill_score_weight: float
    semantic_score_weight: float
    experience_score_weight: float
    education_score_weight: float
    formatting_score_weight: float
    jwt_secret_key: str
    jwt_expire_minutes: int


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:5500")
    return Settings(
        app_name=os.getenv("APP_NAME", "AI Resume Analyzer"),
        environment=os.getenv("APP_ENV", "development"),
        database_url=os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg2://postgres:postgres@localhost:5432/ai_resume_analyzer",
        ),
        cors_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
        embedding_dimensions=int(os.getenv("EMBEDDING_DIMENSIONS", "384")),
        use_transformers=_get_bool("USE_TRANSFORMERS", False),
        transformer_model_name=os.getenv(
            "TRANSFORMER_MODEL_NAME",
            "sentence-transformers/all-MiniLM-L6-v2",
        ),
        max_resume_size_mb=int(os.getenv("MAX_RESUME_SIZE_MB", "5")),
        skill_score_weight=_get_float("SKILL_SCORE_WEIGHT", 0.40),
        semantic_score_weight=_get_float("SEMANTIC_SCORE_WEIGHT", 0.25),
        experience_score_weight=_get_float("EXPERIENCE_SCORE_WEIGHT", 0.15),
        education_score_weight=_get_float("EDUCATION_SCORE_WEIGHT", 0.10),
        formatting_score_weight=_get_float("FORMATTING_SCORE_WEIGHT", 0.10),
        jwt_secret_key=os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production"),
        jwt_expire_minutes=int(os.getenv("JWT_EXPIRE_MINUTES", "60")),
    )

