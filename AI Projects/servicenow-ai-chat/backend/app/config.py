from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent

try:
    from dotenv import load_dotenv

    load_dotenv(BACKEND_ROOT / ".env")
except Exception:
    pass


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Jira Ticket RAG Chatbot")
    environment: str = os.getenv("ENVIRONMENT", "local")
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_ROOT / 'jira_rag_local.db'}")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    cache_enabled: bool = _bool("CACHE_ENABLED", True)
    auto_sync_mock: bool = _bool("AUTO_SYNC_MOCK", True)
    jira_base_url: str = os.getenv("JIRA_BASE_URL", "")
    jira_email: str = os.getenv("JIRA_EMAIL", "")
    jira_api_token: str = os.getenv("JIRA_API_TOKEN", "")
    jira_project_key: str = os.getenv("JIRA_PROJECT_KEY", "AICB").upper()
    mock_jira_data_path: Path = Path(os.getenv("MOCK_JIRA_DATA_PATH", "../sample_data/jira_tickets.json"))
    model_name: str = os.getenv("MODEL_NAME", "local-grounded")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "local-hashing")
    retrieval_top_k: int = int(os.getenv("RETRIEVAL_TOP_K", "6"))
    token_budget_chars: int = int(os.getenv("TOKEN_BUDGET_CHARS", "6000"))
    reranking_enabled: bool = _bool("RERANKING_ENABLED", True)
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def mock_data_absolute_path(self) -> Path:
        path = self.mock_jira_data_path
        if path.is_absolute():
            return path
        return (BACKEND_ROOT / path).resolve()

    @property
    def has_real_jira_credentials(self) -> bool:
        return bool(self.jira_base_url and self.jira_email and self.jira_api_token)


def get_settings() -> Settings:
    return Settings()
