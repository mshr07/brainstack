from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session, selectinload

from app.models.ticket import Ticket, TicketChunk, TicketEmbeddingMetadata
from app.services.embedding_service import EmbeddingService, Vector
from app.services.text_utils import stable_hash
from app.services.ticket_preprocessor import ChunkPayload, TicketPreprocessor

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class IndexedChunk:
    chunk_id: str
    ticket_id: str
    section: str
    text: str
    metadata: dict[str, Any]
    content_hash: str
    vector: Vector


class VectorStore:
    def __init__(self, embedding_service: EmbeddingService, preprocessor: TicketPreprocessor) -> None:
        self.embedding_service = embedding_service
        self.preprocessor = preprocessor
        self._chunks: dict[str, IndexedChunk] = {}

    @property
    def chunks(self) -> list[IndexedChunk]:
        return list(self._chunks.values())

    def rebuild(self, db: Session) -> int:
        db.query(TicketEmbeddingMetadata).delete()
        db.query(TicketChunk).delete()
        self._chunks.clear()
        tickets = db.query(Ticket).options(selectinload(Ticket.comments)).all()
        count = 0
        for ticket in tickets:
            for payload in self.preprocessor.chunk_ticket(ticket):
                indexed = self._index_payload(payload, ticket)
                db.add(
                    TicketChunk(
                        chunk_id=payload.chunk_id,
                        ticket_id=payload.ticket_id,
                        section=payload.section,
                        text=payload.text,
                        chunk_metadata=payload.metadata,
                        content_hash=payload.content_hash,
                    )
                )
                db.add(
                    TicketEmbeddingMetadata(
                        chunk_id=payload.chunk_id,
                        ticket_id=payload.ticket_id,
                        embedding_model=self.embedding_service.settings.embedding_model,
                        embedding_hash=stable_hash(indexed.vector),
                        ticket_updated_at=ticket.updated_at,
                        comment_count=len(ticket.comments),
                        status=ticket.status,
                        description_hash=stable_hash(ticket.description),
                        embedding_vector=indexed.vector,
                    )
                )
                count += 1
        db.commit()
        logger.info("vector index rebuilt chunks=%s", count)
        return count

    def rebuild_tickets(self, db: Session, ticket_ids: list[str]) -> int:
        normalized_ids = sorted({ticket_id.upper() for ticket_id in ticket_ids if ticket_id})
        if not normalized_ids:
            return 0
        db.query(TicketEmbeddingMetadata).filter(TicketEmbeddingMetadata.ticket_id.in_(normalized_ids)).delete(
            synchronize_session=False
        )
        db.query(TicketChunk).filter(TicketChunk.ticket_id.in_(normalized_ids)).delete(synchronize_session=False)
        for chunk_id, chunk in list(self._chunks.items()):
            if chunk.ticket_id in normalized_ids:
                self._chunks.pop(chunk_id, None)

        tickets = (
            db.query(Ticket)
            .options(selectinload(Ticket.comments))
            .filter(Ticket.ticket_id.in_(normalized_ids))
            .all()
        )
        count = 0
        for ticket in tickets:
            for payload in self.preprocessor.chunk_ticket(ticket):
                indexed = self._index_payload(payload, ticket)
                db.add(
                    TicketChunk(
                        chunk_id=payload.chunk_id,
                        ticket_id=payload.ticket_id,
                        section=payload.section,
                        text=payload.text,
                        chunk_metadata=payload.metadata,
                        content_hash=payload.content_hash,
                    )
                )
                db.add(
                    TicketEmbeddingMetadata(
                        chunk_id=payload.chunk_id,
                        ticket_id=payload.ticket_id,
                        embedding_model=self.embedding_service.settings.embedding_model,
                        embedding_hash=stable_hash(indexed.vector),
                        ticket_updated_at=ticket.updated_at,
                        comment_count=len(ticket.comments),
                        status=ticket.status,
                        description_hash=stable_hash(ticket.description),
                        embedding_vector=indexed.vector,
                    )
                )
                count += 1
        db.commit()
        logger.info("vector index incrementally rebuilt ticket_count=%s chunks=%s", len(tickets), count)
        return count

    def load_from_db(self, db: Session) -> int:
        self._chunks.clear()
        chunks = db.query(TicketChunk).all()
        for chunk in chunks:
            vector = self.embedding_service.embed(chunk.text)
            self._chunks[chunk.chunk_id] = IndexedChunk(
                chunk_id=chunk.chunk_id,
                ticket_id=chunk.ticket_id,
                section=chunk.section,
                text=chunk.text,
                metadata=chunk.chunk_metadata or {},
                content_hash=chunk.content_hash,
                vector=vector,
            )
        return len(self._chunks)

    def _index_payload(self, payload: ChunkPayload, ticket: Ticket) -> IndexedChunk:
        vector = self.embedding_service.embed(payload.text)
        indexed = IndexedChunk(
            chunk_id=payload.chunk_id,
            ticket_id=payload.ticket_id,
            section=payload.section,
            text=payload.text,
            metadata=payload.metadata,
            content_hash=payload.content_hash,
            vector=vector,
        )
        self._chunks[payload.chunk_id] = indexed
        return indexed
