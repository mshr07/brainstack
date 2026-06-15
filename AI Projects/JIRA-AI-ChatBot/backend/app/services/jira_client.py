from __future__ import annotations

import base64
import json
import logging
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from app.config import Settings

logger = logging.getLogger(__name__)


class JiraClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def fetch_mock_tickets(self) -> list[dict[str, Any]]:
        path = self.settings.mock_data_absolute_path
        if not path.exists():
            raise FileNotFoundError(f"Mock Jira data not found: {path}")
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("Mock Jira data must be a JSON list")
        logger.info("mock jira sync fetched tickets=%s", len(data))
        return data

    def fetch_real_tickets(self, updated_since: str | None = None) -> list[dict[str, Any]]:
        if not self.settings.has_real_jira_credentials:
            raise ValueError("Jira credentials are not configured")
        logger.info("real jira sync started project=%s", self.settings.jira_project_key)
        start_at = 0
        page_size = 100
        tickets: list[dict[str, Any]] = []
        while True:
            payload = self._search_page(start_at, page_size, updated_since=updated_since)
            issues = payload.get("issues", [])
            tickets.extend(self._normalize_issue(issue) for issue in issues)
            total = int(payload.get("total", len(tickets)))
            start_at += len(issues)
            if not issues or start_at >= total:
                break
        logger.info("real jira sync completed tickets=%s", len(tickets))
        return tickets

    def _search_page(self, start_at: int, max_results: int, updated_since: str | None = None) -> dict[str, Any]:
        jql_parts = [f"project={self.settings.jira_project_key}"]
        if updated_since:
            jql_parts.append(f'updated >= "{updated_since}"')
        jql = " AND ".join(jql_parts) + " ORDER BY updated DESC"
        query = urllib.parse.urlencode(
            {
                "jql": jql,
                "startAt": start_at,
                "maxResults": max_results,
                "fields": "*all",
            }
        )
        request = urllib.request.Request(f"{self.settings.jira_base_url.rstrip('/')}/rest/api/3/search?{query}")
        token = base64.b64encode(f"{self.settings.jira_email}:{self.settings.jira_api_token}".encode()).decode()
        request.add_header("Authorization", f"Basic {token}")
        request.add_header("Accept", "application/json")
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))

    def _normalize_issue(self, issue: dict[str, Any]) -> dict[str, Any]:
        fields = issue.get("fields", {})
        comments = fields.get("comment", {}).get("comments", [])
        return {
            "ticket_id": issue.get("key"),
            "project_key": self.settings.jira_project_key,
            "summary": fields.get("summary"),
            "description": fields.get("description"),
            "comments": [
                {
                    "author": (item.get("author") or {}).get("displayName"),
                    "body": item.get("body"),
                    "created_at": item.get("created"),
                }
                for item in comments
            ],
            "status": (fields.get("status") or {}).get("name"),
            "priority": (fields.get("priority") or {}).get("name"),
            "assignee": (fields.get("assignee") or {}).get("displayName"),
            "reporter": (fields.get("reporter") or {}).get("displayName"),
            "labels": fields.get("labels") or [],
            "sprint": None,
            "created_at": fields.get("created"),
            "updated_at": fields.get("updated"),
            "resolution": (fields.get("resolution") or {}).get("name"),
            "issue_type": (fields.get("issuetype") or {}).get("name"),
            "parent_ticket": (fields.get("parent") or {}).get("key"),
            "linked_issues": [],
            "components": [item.get("name") for item in fields.get("components") or [] if item.get("name")],
            "acceptance_criteria": [],
            "custom_fields": {},
        }
