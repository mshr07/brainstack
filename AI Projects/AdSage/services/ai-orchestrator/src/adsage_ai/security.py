import secrets

from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer(auto_error=False)


async def require_internal_credential(request: Request) -> None:
    """Authenticate the calling workload; user authorization remains deterministic upstream."""

    credentials: HTTPAuthorizationCredentials | None = await _bearer(request)
    expected: str = request.app.state.settings.ai_internal_token
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not secrets.compare_digest(credentials.credentials, expected)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal workload credential",
            headers={"WWW-Authenticate": "Bearer"},
        )
