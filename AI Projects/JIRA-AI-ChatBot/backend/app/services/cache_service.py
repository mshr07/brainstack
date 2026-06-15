from __future__ import annotations

import json
import logging
import time
from typing import Any

from app.config import Settings
from app.services.text_utils import stable_hash

logger = logging.getLogger(__name__)

try:  # Redis is optional at runtime; fallback cache keeps mock mode runnable.
    import redis
except Exception:  # pragma: no cover
    redis = None


class CacheService:
    def __init__(self, settings: Settings) -> None:
        self.enabled = settings.cache_enabled
        self._memory: dict[str, tuple[float | None, Any]] = {}
        self._redis = None
        if self.enabled and redis is not None and settings.redis_url:
            try:
                self._redis = redis.Redis.from_url(settings.redis_url, decode_responses=True)
                self._redis.ping()
                logger.info("redis cache connected")
            except Exception as exc:  # pragma: no cover
                logger.warning("redis unavailable; falling back to in-memory cache: %s", exc)
                self._redis = None

    def make_key(self, namespace: str, payload: object) -> str:
        return f"{namespace}:{stable_hash(payload)}"

    def get(self, namespace: str, key: str) -> Any | None:
        if not self.enabled:
            return None
        full_key = f"{namespace}:{key}"
        if self._redis is not None:
            raw = self._redis.get(full_key)
            if raw is None:
                logger.debug("cache miss namespace=%s", namespace)
                return None
            logger.debug("cache hit namespace=%s", namespace)
            return json.loads(raw)
        item = self._memory.get(full_key)
        if item is None:
            logger.debug("cache miss namespace=%s", namespace)
            return None
        expires_at, value = item
        if expires_at is not None and time.time() >= expires_at:
            self._memory.pop(full_key, None)
            logger.debug("cache expired namespace=%s", namespace)
            return None
        logger.debug("cache hit namespace=%s", namespace)
        return value

    def set(self, namespace: str, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        if not self.enabled:
            return
        full_key = f"{namespace}:{key}"
        if self._redis is not None:
            self._redis.set(full_key, json.dumps(value, default=str), ex=ttl_seconds)
            return
        expires_at = time.time() + ttl_seconds if ttl_seconds else None
        self._memory[full_key] = (expires_at, value)

    def delete(self, namespace: str, key: str) -> None:
        full_key = f"{namespace}:{key}"
        if self._redis is not None:
            self._redis.delete(full_key)
        self._memory.pop(full_key, None)

    def clear(self, namespace: str | None = None) -> None:
        if self._redis is not None and namespace:
            for key in self._redis.scan_iter(f"{namespace}:*"):
                self._redis.delete(key)
        elif self._redis is not None:
            self._redis.flushdb()
        if namespace:
            prefix = f"{namespace}:"
            for key in list(self._memory):
                if key.startswith(prefix):
                    self._memory.pop(key, None)
        else:
            self._memory.clear()
