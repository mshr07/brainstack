from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated process configuration; secrets are loaded from the environment."""

    model_config = SettingsConfigDict(env_prefix="ADSAGE_", extra="ignore")

    environment: str
    ai_internal_token: str = Field(min_length=16, repr=False)
    max_graph_recursion: int = Field(default=16, ge=4, le=64)
    request_id_pattern: str = r"^[A-Za-z0-9._:-]{8,128}$"


@lru_cache
def get_settings() -> Settings:
    # BaseSettings supplies required values from the process environment at runtime.
    return Settings()  # type: ignore[call-arg]
