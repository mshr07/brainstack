from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.models.ticket import Ticket
from app.services.text_utils import clean_text, compact_join, stable_hash, truncate


@dataclass(frozen=True)
class ChunkPayload:
    chunk_id: str
    ticket_id: str
    section: str
    text: str
    metadata: dict[str, Any]
    content_hash: str


class TicketPreprocessor:
    def normalize_raw_ticket(self, raw: dict[str, Any]) -> dict[str, Any]:
        ticket_id = str(raw.get("ticket_id") or raw.get("key") or "").upper()
        comments = self.normalize_comments(raw.get("comments", []))
        return {
            "ticket_id": ticket_id,
            "project_key": str(raw.get("project_key") or raw.get("project") or ticket_id.split("-")[0]).upper(),
            "summary": clean_text(raw.get("summary")),
            "description": clean_text(raw.get("description")),
            "comments": comments,
            "status": clean_text(raw.get("status") or "Unknown"),
            "priority": clean_text(raw.get("priority") or "Medium"),
            "assignee": clean_text(raw.get("assignee")) or None,
            "reporter": clean_text(raw.get("reporter")) or None,
            "labels": sorted({clean_text(item).lower() for item in raw.get("labels", []) if clean_text(item)}),
            "sprint": clean_text(raw.get("sprint")) or None,
            "created_at": clean_text(raw.get("created_at")) or None,
            "updated_at": clean_text(raw.get("updated_at")) or None,
            "resolution": clean_text(raw.get("resolution")) or None,
            "issue_type": clean_text(raw.get("issue_type")) or None,
            "parent_ticket": clean_text(raw.get("parent_ticket")) or None,
            "linked_issues": raw.get("linked_issues") or [],
            "components": sorted({clean_text(item).lower() for item in raw.get("components", []) if clean_text(item)}),
            "acceptance_criteria": [clean_text(item) for item in raw.get("acceptance_criteria", []) if clean_text(item)],
            "custom_fields": dict(raw.get("custom_fields") or {}),
        }

    def normalize_comments(self, comments: list[dict[str, Any]]) -> list[dict[str, str | None]]:
        seen: set[str] = set()
        normalized: list[dict[str, str | None]] = []
        for comment in comments or []:
            body = clean_text(comment.get("body"))
            if not body:
                continue
            body_hash = stable_hash(body)
            if body_hash in seen:
                continue
            seen.add(body_hash)
            normalized.append(
                {
                    "author": clean_text(comment.get("author")) or "Unknown",
                    "body": body,
                    "created_at": clean_text(comment.get("created_at")) or None,
                    "body_hash": body_hash,
                }
            )
        return normalized

    def chunk_ticket(self, ticket: Ticket) -> list[ChunkPayload]:
        metadata = {
            "ticket_id": ticket.ticket_id,
            "project_key": ticket.project_key,
            "status": ticket.status,
            "priority": ticket.priority,
            "assignee": ticket.assignee,
            "sprint": ticket.sprint,
            "labels": ticket.labels or [],
            "components": ticket.components or [],
            "updated_at": ticket.updated_at,
            "resolution": ticket.resolution,
            "issue_type": ticket.issue_type,
            "comment_count": len(ticket.comments),
        }
        chunks = [
            self._chunk(
                ticket.ticket_id,
                "overview",
                compact_join(
                    [
                        ticket.ticket_id,
                        ticket.summary,
                        ticket.description,
                        ticket.status,
                        ticket.priority,
                        ticket.assignee or "unassigned",
                        " ".join(ticket.labels or []),
                        " ".join(ticket.components or []),
                        str((ticket.custom_fields or {}).get("blocked_reason") or ""),
                    ]
                ),
                metadata,
            )
        ]
        if ticket.acceptance_criteria:
            chunks.append(
                self._chunk(
                    ticket.ticket_id,
                    "acceptance_criteria",
                    f"{ticket.ticket_id} acceptance criteria " + " ".join(ticket.acceptance_criteria),
                    metadata,
                )
            )
        if ticket.comments:
            recent = ticket.comments[-5:]
            comment_text = " ".join(f"{item.author} {item.created_at} {item.body}" for item in recent)
            chunks.append(self._chunk(ticket.ticket_id, "comments", truncate(f"{ticket.ticket_id} comments {comment_text}", 2400), metadata))
        return chunks

    def _chunk(self, ticket_id: str, section: str, text: str, metadata: dict[str, Any]) -> ChunkPayload:
        content_hash = stable_hash({"ticket_id": ticket_id, "section": section, "text": text, "metadata": metadata})
        return ChunkPayload(
            chunk_id=f"{ticket_id}:{section}",
            ticket_id=ticket_id,
            section=section,
            text=text,
            metadata=metadata,
            content_hash=content_hash,
        )
