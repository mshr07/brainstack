from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from jira_chatbot.utils import compact_join, normalize_text, stable_hash


DONE_STATUSES = {"done", "closed", "resolved", "cancelled"}
HIGH_PRIORITIES = {"highest", "critical", "blocker", "high"}


@dataclass(frozen=True)
class Comment:
    author: str
    body: str
    created_at: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Comment":
        return cls(
            author=str(data.get("author") or "Unknown"),
            body=normalize_text(str(data.get("body") or "")),
            created_at=str(data.get("created_at") or ""),
        )


@dataclass(frozen=True)
class LinkedIssue:
    key: str
    type: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "LinkedIssue":
        return cls(key=str(data.get("key") or "").upper(), type=str(data.get("type") or "relates to"))


@dataclass(frozen=True)
class Ticket:
    key: str
    project: str
    issue_type: str
    summary: str
    description: str
    status: str
    priority: str
    assignee: str | None
    reporter: str
    labels: tuple[str, ...] = ()
    components: tuple[str, ...] = ()
    sprint: str | None = None
    created_at: str = ""
    updated_at: str = ""
    due_date: str | None = None
    resolution: str | None = None
    story_points: int | None = None
    environment: str = ""
    acceptance_criteria: tuple[str, ...] = ()
    comments: tuple[Comment, ...] = ()
    linked_issues: tuple[LinkedIssue, ...] = ()
    custom_fields: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Ticket":
        return cls(
            key=str(data.get("key") or "").upper(),
            project=str(data.get("project") or "").upper(),
            issue_type=str(data.get("issue_type") or "Task"),
            summary=normalize_text(str(data.get("summary") or "")),
            description=normalize_text(str(data.get("description") or "")),
            status=str(data.get("status") or "Unknown"),
            priority=str(data.get("priority") or "Medium"),
            assignee=str(data["assignee"]) if data.get("assignee") else None,
            reporter=str(data.get("reporter") or "Unknown"),
            labels=tuple(str(item).lower() for item in data.get("labels", [])),
            components=tuple(str(item).lower() for item in data.get("components", [])),
            sprint=str(data["sprint"]) if data.get("sprint") else None,
            created_at=str(data.get("created_at") or ""),
            updated_at=str(data.get("updated_at") or ""),
            due_date=str(data["due_date"]) if data.get("due_date") else None,
            resolution=str(data["resolution"]) if data.get("resolution") else None,
            story_points=int(data["story_points"]) if data.get("story_points") is not None else None,
            environment=str(data.get("environment") or ""),
            acceptance_criteria=tuple(normalize_text(str(item)) for item in data.get("acceptance_criteria", [])),
            comments=tuple(Comment.from_dict(item) for item in data.get("comments", [])),
            linked_issues=tuple(LinkedIssue.from_dict(item) for item in data.get("linked_issues", [])),
            custom_fields=dict(data.get("custom_fields") or {}),
        )

    @property
    def is_resolved(self) -> bool:
        return bool(self.resolution) or self.status.lower() in DONE_STATUSES

    @property
    def is_high_priority(self) -> bool:
        return self.priority.lower() in HIGH_PRIORITIES

    @property
    def blocker_reason(self) -> str:
        return normalize_text(str(self.custom_fields.get("blocked_reason") or ""))

    @property
    def latest_comment(self) -> Comment | None:
        return self.comments[-1] if self.comments else None

    @property
    def content_hash(self) -> str:
        return stable_hash(
            {
                "key": self.key,
                "summary": self.summary,
                "description": self.description,
                "status": self.status,
                "priority": self.priority,
                "assignee": self.assignee,
                "labels": self.labels,
                "components": self.components,
                "updated_at": self.updated_at,
                "resolution": self.resolution,
                "acceptance_criteria": self.acceptance_criteria,
                "comments": [comment.__dict__ for comment in self.comments],
                "custom_fields": self.custom_fields,
            }
        )

    def compact_context(self, include_comments: bool = True) -> str:
        criteria = "; ".join(self.acceptance_criteria) if self.acceptance_criteria else "Not provided"
        comment_text = ""
        if include_comments and self.comments:
            recent = self.comments[-3:]
            comment_text = " | ".join(f"{item.created_at} {item.author}: {item.body}" for item in recent)
        return compact_join(
            [
                f"Ticket: {self.key}",
                f"Type: {self.issue_type}",
                f"Summary: {self.summary}",
                f"Status: {self.status}",
                f"Priority: {self.priority}",
                f"Assignee: {self.assignee or 'Unassigned'}",
                f"Reporter: {self.reporter}",
                f"Labels: {', '.join(self.labels) or 'None'}",
                f"Components: {', '.join(self.components) or 'None'}",
                f"Sprint: {self.sprint or 'None'}",
                f"Created: {self.created_at}",
                f"Updated: {self.updated_at}",
                f"Due: {self.due_date or 'None'}",
                f"Resolution: {self.resolution or 'Unresolved'}",
                f"Description: {self.description}",
                f"Acceptance criteria: {criteria}",
                f"Blocker reason: {self.blocker_reason}" if self.blocker_reason else "",
                f"Recent comments: {comment_text}" if comment_text else "",
            ],
            separator="\n",
        )


@dataclass(frozen=True)
class TicketChunk:
    chunk_id: str
    ticket_key: str
    section: str
    text: str
    metadata: dict[str, Any]


@dataclass(frozen=True)
class RetrievalResult:
    chunk: TicketChunk
    score: float
    reasons: tuple[str, ...] = ()


@dataclass(frozen=True)
class GroundedAnswer:
    answer: str
    ticket_ids: tuple[str, ...]
    confidence: str
    retrieval_results: tuple[RetrievalResult, ...] = ()
    from_cache: bool = False
