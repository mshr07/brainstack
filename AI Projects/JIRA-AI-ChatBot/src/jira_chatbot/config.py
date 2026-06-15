from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    jira_data_path: Path = PROJECT_ROOT / "data" / "dummy_jira_tickets.json"
    jira_base_url: str = ""
    jira_project_key: str = "AICB"
    jira_email: str = ""
    jira_api_token: str = ""
    model_name: str = "local-grounded"
    embedding_model: str = "local-hashing"
    cache_dir: Path = PROJECT_ROOT / "cache"
    cache_enabled: bool = True
    answer_cache_enabled: bool = True
    retrieval_top_k: int = 6
    retrieval_max_context_chars: int = 6000
    retrieval_reranking_enabled: bool = True
    log_level: str = "INFO"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            jira_data_path=Path(os.getenv("JIRA_DATA_PATH", str(cls.jira_data_path))).expanduser(),
            jira_base_url=os.getenv("JIRA_BASE_URL", ""),
            jira_project_key=os.getenv("JIRA_PROJECT_KEY", "AICB").upper(),
            jira_email=os.getenv("JIRA_EMAIL", ""),
            jira_api_token=os.getenv("JIRA_API_TOKEN", ""),
            model_name=os.getenv("MODEL_NAME", "local-grounded"),
            embedding_model=os.getenv("EMBEDDING_MODEL", "local-hashing"),
            cache_dir=Path(os.getenv("CACHE_DIR", str(cls.cache_dir))).expanduser(),
            cache_enabled=env_bool("CACHE_ENABLED", True),
            answer_cache_enabled=env_bool("ANSWER_CACHE_ENABLED", True),
            retrieval_top_k=int(os.getenv("RETRIEVAL_TOP_K", "6")),
            retrieval_max_context_chars=int(os.getenv("RETRIEVAL_MAX_CONTEXT_CHARS", "6000")),
            retrieval_reranking_enabled=env_bool("RETRIEVAL_RERANKING_ENABLED", True),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )
