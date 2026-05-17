import base64
import hashlib
import hmac
import json
import time
from typing import Any

from app.core.config import get_settings


def create_demo_token(subject: str) -> str:
    """Small JWT-like teaching helper.

    Real production systems should use a maintained JWT library such as
    python-jose or PyJWT. This helper is kept dependency-light for students.
    """
    settings = get_settings()
    payload = {
        "sub": subject,
        "exp": int(time.time()) + settings.jwt_expire_minutes * 60,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
    payload_part = base64.urlsafe_b64encode(payload_bytes).decode().rstrip("=")
    signature = hmac.new(
        settings.jwt_secret_key.encode(),
        payload_part.encode(),
        hashlib.sha256,
    ).digest()
    signature_part = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{payload_part}.{signature_part}"


def verify_demo_token(token: str) -> dict[str, Any] | None:
    settings = get_settings()
    try:
        payload_part, signature_part = token.split(".", 1)
        expected_signature = hmac.new(
            settings.jwt_secret_key.encode(),
            payload_part.encode(),
            hashlib.sha256,
        ).digest()
        actual_signature = base64.urlsafe_b64decode(signature_part + "==")
        if not hmac.compare_digest(expected_signature, actual_signature):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_part + "=="))
    except (ValueError, json.JSONDecodeError):
        return None

    if payload.get("exp", 0) < int(time.time()):
        return None
    return payload

