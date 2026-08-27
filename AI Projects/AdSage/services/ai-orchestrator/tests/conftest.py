from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from adsage_ai.config import Settings
from adsage_ai.main import create_app

TEST_AUTH_VALUE = "test-internal-workload-token"


@pytest.fixture
def client() -> Iterator[TestClient]:
    settings = Settings(environment="test", ai_internal_token=TEST_AUTH_VALUE)
    with TestClient(create_app(settings)) as test_client:
        yield test_client


@pytest.fixture
def authorized_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {TEST_AUTH_VALUE}",
        "X-Request-Id": "request-test-1234",
    }
