from __future__ import annotations

import base64
import json
import logging
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class JiraClient(Protocol):
    def fetch_tickets(self) -> list[dict[str, Any]]: ...


class FileJiraClient:
    def __init__(self, data_path: Path) -> None:
        self.data_path = data_path

    def fetch_tickets(self) -> list[dict[str, Any]]:
        if not self.data_path.exists():
            raise FileNotFoundError(f"Jira data file not found: {self.data_path}")
        data = json.loads(self.data_path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("Jira data file must contain a list of tickets")
        logger.info("jira file sync completed tickets=%s", len(data))
        return data


class HttpJiraClient:
    """Minimal Jira REST client with pagination. Use FileJiraClient for local tests."""

    def __init__(self, base_url: str, email: str, api_token: str, project_key: str, page_size: int = 100) -> None:
        if not base_url or not email or not api_token:
            raise ValueError("Jira base URL, email, and API token are required")
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.api_token = api_token
        self.project_key = project_key
        self.page_size = page_size

    def fetch_tickets(self) -> list[dict[str, Any]]:
        logger.info("jira api sync started project=%s", self.project_key)
        start_at = 0
        tickets: list[dict[str, Any]] = []
        while True:
            payload = self._search_page(start_at=start_at)
            issues = payload.get("issues", [])
            tickets.extend(self._normalize_issue(issue) for issue in issues)
            total = int(payload.get("total", len(tickets)))
            logger.info("jira api page fetched start_at=%s page_count=%s total=%s", start_at, len(issues), total)
            start_at += len(issues)
            if start_at >= total or not issues:
                break
        logger.info("jira api sync completed tickets=%s", len(tickets))
        return tickets

    def _search_page(self, start_at: int) -> dict[str, Any]:
        query = urllib.parse.urlencode(
            {
                "jql": f"project={self.project_key} ORDER BY updated DESC",
                "startAt": start_at,
                "maxResults": self.page_size,
                "fields": "*all",
            }
        )
        request = urllib.request.Request(f"{self.base_url}/rest/api/3/search?{query}")
        token = base64.b64encode(f"{self.email}:{self.api_token}".encode("utf-8")).decode("ascii")
        request.add_header("Authorization", f"Basic {token}")
        request.add_header("Accept", "application/json")
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))

    def _normalize_issue(self, issue: dict[str, Any]) -> dict[str, Any]:
        fields = issue.get("fields", {})
        comments = fields.get("comment", {}).get("comments", [])
        return {
            "key": issue.get("key"),
            "project": self.project_key,
            "issue_type": (fields.get("issuetype") or {}).get("name"),
            "summary": fields.get("summary"),
            "description": fields.get("description"),
            "status": (fields.get("status") or {}).get("name"),
            "priority": (fields.get("priority") or {}).get("name"),
            "assignee": (fields.get("assignee") or {}).get("displayName"),
            "reporter": (fields.get("reporter") or {}).get("displayName"),
            "labels": fields.get("labels") or [],
            "components": [item.get("name") for item in fields.get("components") or [] if item.get("name")],
            "sprint": None,
            "created_at": fields.get("created"),
            "updated_at": fields.get("updated"),
            "due_date": fields.get("duedate"),
            "resolution": (fields.get("resolution") or {}).get("name"),
            "story_points": None,
            "environment": fields.get("environment") or "",
            "acceptance_criteria": [],
            "comments": [
                {
                    "author": (item.get("author") or {}).get("displayName"),
                    "body": item.get("body"),
                    "created_at": item.get("created"),
                }
                for item in comments
            ],
            "linked_issues": [],
            "custom_fields": {},
        }
