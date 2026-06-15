from __future__ import annotations

import logging
from typing import Iterable

from jira_chatbot.cache import CacheBackend
from jira_chatbot.models import Ticket, TicketChunk
from jira_chatbot.utils import compact_join, stable_hash, truncate

logger = logging.getLogger(__name__)


def process_tickets(raw_tickets: Iterable[dict], cache: CacheBackend | None = None) -> list[Ticket]:
    processed: list[Ticket] = []
    for raw in raw_tickets:
        raw_key = str(raw.get("key") or "").upper()
        updated_at = str(raw.get("updated_at") or raw.get("updated") or "")
        cache_key = stable_hash({"ticket": raw_key, "updated_at": updated_at, "raw": raw})
        cached = cache.get("processed_ticket", cache_key) if cache else None
        if cached:
            processed.append(Ticket.from_dict(cached))
            continue
        ticket = Ticket.from_dict(raw)
        processed.append(ticket)
        if cache:
            cache.set("processed_ticket", cache_key, raw)
    logger.info("tickets processed count=%s", len(processed))
    return processed


def chunk_ticket(ticket: Ticket) -> list[TicketChunk]:
    base_metadata = {
        "ticket_key": ticket.key,
        "status": ticket.status,
        "priority": ticket.priority,
        "assignee": ticket.assignee,
        "labels": list(ticket.labels),
        "components": list(ticket.components),
        "sprint": ticket.sprint,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "resolution": ticket.resolution,
        "issue_type": ticket.issue_type,
        "is_resolved": ticket.is_resolved,
        "is_high_priority": ticket.is_high_priority,
    }
    chunks = [
        TicketChunk(
            chunk_id=f"{ticket.key}:overview",
            ticket_key=ticket.key,
            section="overview",
            text=compact_join(
                [
                    ticket.key,
                    ticket.issue_type,
                    ticket.summary,
                    ticket.description,
                    ticket.status,
                    ticket.priority,
                    ticket.assignee or "unassigned",
                    " ".join(ticket.labels),
                    " ".join(ticket.components),
                    ticket.blocker_reason,
                ]
            ),
            metadata=base_metadata,
        )
    ]
    if ticket.acceptance_criteria:
        chunks.append(
            TicketChunk(
                chunk_id=f"{ticket.key}:acceptance",
                ticket_key=ticket.key,
                section="acceptance_criteria",
                text=f"{ticket.key} acceptance criteria " + " ".join(ticket.acceptance_criteria),
                metadata=base_metadata,
            )
        )
    if ticket.comments:
        recent_comments = ticket.comments[-5:]
        chunks.append(
            TicketChunk(
                chunk_id=f"{ticket.key}:comments",
                ticket_key=ticket.key,
                section="comments",
                text=truncate(
                    f"{ticket.key} recent comments "
                    + " ".join(f"{comment.author} {comment.created_at} {comment.body}" for comment in recent_comments),
                    2200,
                ),
                metadata=base_metadata | {"comment_count": len(ticket.comments)},
            )
        )
    return chunks


def chunk_tickets(tickets: Iterable[Ticket]) -> list[TicketChunk]:
    chunks: list[TicketChunk] = []
    for ticket in tickets:
        chunks.extend(chunk_ticket(ticket))
    logger.info("ticket chunks generated count=%s", len(chunks))
    return chunks


def dataset_version(tickets: Iterable[Ticket]) -> str:
    return stable_hash({ticket.key: ticket.content_hash for ticket in tickets})
