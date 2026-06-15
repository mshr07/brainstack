from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.ticket import Ticket, TicketComment
from app.services.jira_client import JiraClient
from app.services.text_utils import stable_hash
from app.services.ticket_preprocessor import TicketPreprocessor

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SyncResult:
    fetched: int
    created: int
    updated: int
    unchanged: int
    skipped: int
    changed_ticket_ids: list[str]

    @property
    def changed_count(self) -> int:
        return self.created + self.updated

    def as_dict(self) -> dict:
        return {
            "fetched": self.fetched,
            "created": self.created,
            "updated": self.updated,
            "unchanged": self.unchanged,
            "skipped": self.skipped,
            "changed_ticket_ids": self.changed_ticket_ids,
            "changed_count": self.changed_count,
        }


class TicketIngestionService:
    def __init__(self, jira_client: JiraClient, preprocessor: TicketPreprocessor) -> None:
        self.jira_client = jira_client
        self.preprocessor = preprocessor

    def sync_mock(self, db: Session) -> SyncResult:
        return self._sync_raw(db, self.jira_client.fetch_mock_tickets())

    def sync_real_jira(self, db: Session, updated_since: str | None = None) -> SyncResult:
        return self._sync_raw(db, self.jira_client.fetch_real_tickets(updated_since=updated_since))

    def sync_raw(self, db: Session, raw_tickets: list[dict]) -> SyncResult:
        return self._sync_raw(db, raw_tickets)

    def _sync_raw(self, db: Session, raw_tickets: list[dict]) -> SyncResult:
        created = 0
        updated = 0
        unchanged = 0
        skipped = 0
        changed_ticket_ids: list[str] = []
        for raw in raw_tickets:
            data = self.preprocessor.normalize_raw_ticket(raw)
            if not data["ticket_id"]:
                skipped += 1
                continue
            ticket = db.get(Ticket, data["ticket_id"])
            if ticket is None:
                ticket = Ticket(ticket_id=data["ticket_id"], project_key=data["project_key"])
                db.add(ticket)
                created += 1
                changed_ticket_ids.append(data["ticket_id"])
            elif self._ticket_fingerprint(ticket) == self._data_fingerprint(data):
                unchanged += 1
                continue
            else:
                updated += 1
                changed_ticket_ids.append(data["ticket_id"])

            for field in [
                "project_key",
                "summary",
                "description",
                "status",
                "priority",
                "assignee",
                "reporter",
                "labels",
                "sprint",
                "created_at",
                "updated_at",
                "resolution",
                "issue_type",
                "parent_ticket",
                "linked_issues",
                "components",
                "acceptance_criteria",
                "custom_fields",
            ]:
                setattr(ticket, field, data[field])
            ticket.comments.clear()
            for item in data["comments"]:
                ticket.comments.append(
                    TicketComment(
                        author=item["author"],
                        body=item["body"] or "",
                        created_at=item["created_at"],
                        body_hash=item["body_hash"] or stable_hash(item["body"]),
                    )
                )
        db.commit()
        logger.info(
            "ticket ingestion completed fetched=%s created=%s updated=%s unchanged=%s skipped=%s",
            len(raw_tickets),
            created,
            updated,
            unchanged,
            skipped,
        )
        return SyncResult(
            fetched=len(raw_tickets),
            created=created,
            updated=updated,
            unchanged=unchanged,
            skipped=skipped,
            changed_ticket_ids=changed_ticket_ids,
        )

    def _ticket_fingerprint(self, ticket: Ticket) -> str:
        return stable_hash(
            {
                "project_key": ticket.project_key,
                "summary": ticket.summary,
                "description": ticket.description,
                "comments": [
                    {
                        "author": comment.author,
                        "body": comment.body,
                        "created_at": comment.created_at,
                        "body_hash": comment.body_hash,
                    }
                    for comment in ticket.comments
                ],
                "status": ticket.status,
                "priority": ticket.priority,
                "assignee": ticket.assignee,
                "reporter": ticket.reporter,
                "labels": ticket.labels or [],
                "sprint": ticket.sprint,
                "created_at": ticket.created_at,
                "updated_at": ticket.updated_at,
                "resolution": ticket.resolution,
                "issue_type": ticket.issue_type,
                "parent_ticket": ticket.parent_ticket,
                "linked_issues": ticket.linked_issues or [],
                "components": ticket.components or [],
                "acceptance_criteria": ticket.acceptance_criteria or [],
                "custom_fields": ticket.custom_fields or {},
            }
        )

    def _data_fingerprint(self, data: dict) -> str:
        return stable_hash(
            {
                "project_key": data["project_key"],
                "summary": data["summary"],
                "description": data["description"],
                "comments": data["comments"],
                "status": data["status"],
                "priority": data["priority"],
                "assignee": data["assignee"],
                "reporter": data["reporter"],
                "labels": data["labels"],
                "sprint": data["sprint"],
                "created_at": data["created_at"],
                "updated_at": data["updated_at"],
                "resolution": data["resolution"],
                "issue_type": data["issue_type"],
                "parent_ticket": data["parent_ticket"],
                "linked_issues": data["linked_issues"],
                "components": data["components"],
                "acceptance_criteria": data["acceptance_criteria"],
                "custom_fields": data["custom_fields"],
            }
        )
