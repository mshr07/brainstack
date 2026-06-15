from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from jira_chatbot.utils import stable_hash

logger = logging.getLogger(__name__)


class CacheBackend(Protocol):
    def get(self, namespace: str, key: str) -> Any | None: ...

    def set(self, namespace: str, key: str, value: Any, ttl_seconds: int | None = None) -> None: ...

    def delete(self, namespace: str, key: str) -> None: ...

    def clear(self, namespace: str | None = None) -> None: ...


@dataclass
class CacheEnvelope:
    value: Any
    expires_at: float | None = None

    @property
    def expired(self) -> bool:
        return self.expires_at is not None and time.time() >= self.expires_at


class InMemoryCache:
    def __init__(self, enabled: bool = True) -> None:
        self.enabled = enabled
        self._store: dict[str, CacheEnvelope] = {}

    def _cache_key(self, namespace: str, key: str) -> str:
        return f"{namespace}:{key}"

    def get(self, namespace: str, key: str) -> Any | None:
        if not self.enabled:
            return None
        cache_key = self._cache_key(namespace, key)
        envelope = self._store.get(cache_key)
        if envelope is None:
            logger.debug("cache miss namespace=%s", namespace)
            return None
        if envelope.expired:
            self._store.pop(cache_key, None)
            logger.debug("cache expired namespace=%s", namespace)
            return None
        logger.debug("cache hit namespace=%s", namespace)
        return envelope.value

    def set(self, namespace: str, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        if not self.enabled:
            return
        expires_at = time.time() + ttl_seconds if ttl_seconds else None
        self._store[self._cache_key(namespace, key)] = CacheEnvelope(value=value, expires_at=expires_at)

    def delete(self, namespace: str, key: str) -> None:
        self._store.pop(self._cache_key(namespace, key), None)

    def clear(self, namespace: str | None = None) -> None:
        if namespace is None:
            self._store.clear()
            return
        prefix = f"{namespace}:"
        for key in list(self._store):
            if key.startswith(prefix):
                self._store.pop(key, None)


class FileCache:
    def __init__(self, root: Path, enabled: bool = True) -> None:
        self.root = root
        self.enabled = enabled
        if enabled:
            self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, namespace: str, key: str) -> Path:
        digest = stable_hash({"namespace": namespace, "key": key})
        return self.root / namespace / f"{digest}.json"

    def get(self, namespace: str, key: str) -> Any | None:
        if not self.enabled:
            return None
        path = self._path(namespace, key)
        if not path.exists():
            logger.debug("cache miss namespace=%s", namespace)
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            envelope = CacheEnvelope(value=data["value"], expires_at=data.get("expires_at"))
        except (OSError, json.JSONDecodeError, KeyError):
            logger.warning("cache read failed namespace=%s path=%s", namespace, path)
            return None
        if envelope.expired:
            path.unlink(missing_ok=True)
            logger.debug("cache expired namespace=%s", namespace)
            return None
        logger.debug("cache hit namespace=%s", namespace)
        return envelope.value

    def set(self, namespace: str, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        if not self.enabled:
            return
        path = self._path(namespace, key)
        path.parent.mkdir(parents=True, exist_ok=True)
        expires_at = time.time() + ttl_seconds if ttl_seconds else None
        payload = {"expires_at": expires_at, "value": value}
        path.write_text(json.dumps(payload, sort_keys=True, default=str), encoding="utf-8")

    def delete(self, namespace: str, key: str) -> None:
        self._path(namespace, key).unlink(missing_ok=True)

    def clear(self, namespace: str | None = None) -> None:
        targets = [self.root / namespace] if namespace else [self.root]
        for target in targets:
            if not target.exists():
                continue
            for path in sorted(target.rglob("*.json")):
                path.unlink(missing_ok=True)
