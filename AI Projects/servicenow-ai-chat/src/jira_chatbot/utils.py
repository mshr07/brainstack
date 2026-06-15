from __future__ import annotations

import hashlib
import html
import re
from datetime import datetime, timezone
from typing import Iterable


TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9_'-]*|\d+")
HTML_TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    value = html.unescape(value)
    value = HTML_TAG_RE.sub(" ", value)
    return WHITESPACE_RE.sub(" ", value).strip()


def tokenize(value: str | None) -> list[str]:
    return [token.lower() for token in TOKEN_RE.findall(normalize_text(value))]


def stable_hash(value: object) -> str:
    import json

    payload = json.dumps(value, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def compact_join(parts: Iterable[str], separator: str = " ") -> str:
    return separator.join(part.strip() for part in parts if part and part.strip())


def truncate(value: str, limit: int) -> str:
    value = normalize_text(value)
    if len(value) <= limit:
        return value
    return value[: max(0, limit - 3)].rstrip() + "..."
