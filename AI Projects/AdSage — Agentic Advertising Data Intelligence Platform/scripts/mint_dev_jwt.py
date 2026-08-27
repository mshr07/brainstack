"""Mint a short-lived HS256 token for the local profile; never use it in production."""

import base64
import hashlib
import hmac
import json
import os
import time


def encode(value: dict[str, object]) -> str:
    raw = json.dumps(value, separators=(",", ":"), sort_keys=True).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def main() -> None:
    secret = os.environ.get("DEV_JWT_SECRET")
    if secret is None or len(secret.encode()) < 32:
        raise SystemExit(
            "Set DEV_JWT_SECRET to the same 32+ byte local value used by Spring"
        )
    now = int(time.time())
    header = encode({"alg": "HS256", "typ": "JWT"})
    payload = encode(
        {
            "iss": os.environ.get(
                "JWT_ISSUER_URI", "https://example.invalid/oauth2/default"
            ),
            "aud": os.environ.get("JWT_AUDIENCE", "api://adsage"),
            "sub": os.environ.get("DEV_SUBJECT_ID", "local-analyst"),
            "tenant_id": os.environ.get("DEV_TENANT_ID", "synthetic-demo"),
            "scope": "analysis:run",
            "iat": now,
            "exp": now + 3600,
        }
    )
    signing_input = f"{header}.{payload}".encode()
    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    ).rstrip(b"=")
    print(f"{header}.{payload}.{signature.decode()}")


if __name__ == "__main__":
    main()
