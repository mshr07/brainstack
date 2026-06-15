from __future__ import annotations

import hashlib
import html
import json
import re
from collections.abc import Iterable


TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9_'-]*|\d+")
HTML_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = html.unescape(str(value))
    text = HTML_RE.sub(" ", text)
    return SPACE_RE.sub(" ", text).strip()


def tokenize(value: object) -> list[str]:
    return [item.lower() for item in TOKEN_RE.findall(clean_text(value))]


def stable_hash(value: object) -> str:
    payload = json.dumps(value, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def compact_join(parts: Iterable[str], separator: str = " ") -> str:
    return separator.join(part.strip() for part in parts if part and part.strip())


def truncate(value: str, limit: int) -> str:
    value = clean_text(value)
    if len(value) <= limit:
        return value
    return value[: max(0, limit - 3)].rstrip() + "..."
