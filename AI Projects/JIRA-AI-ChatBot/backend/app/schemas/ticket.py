from __future__ import annotations

from pydantic import BaseModel


class TicketCommentResponse(BaseModel):
    author: str | None
    body: str
    created_at: str | None


class TicketResponse(BaseModel):
    ticket_id: str
    project_key: str
    summary: str
    description: str
    status: str
    priority: str
    assignee: str | None
    reporter: str | None
    labels: list[str]
    sprint: str | None
    created_at: str | None
    updated_at: str | None
    resolution: str | None
    issue_type: str | None
    parent_ticket: str | None
    linked_issues: list[dict]
    comments: list[TicketCommentResponse] = []


class TicketListResponse(BaseModel):
    tickets: list[TicketResponse]
    total: int
