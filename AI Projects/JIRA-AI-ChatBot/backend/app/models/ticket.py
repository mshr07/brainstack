from __future__ import annotations

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    ticket_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    project_key: Mapped[str] = mapped_column(String(32), index=True)
    summary: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(64), index=True, default="Unknown")
    priority: Mapped[str] = mapped_column(String(64), index=True, default="Medium")
    assignee: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    reporter: Mapped[str | None] = mapped_column(String(255), nullable=True)
    labels: Mapped[list[str]] = mapped_column(JSON, default=list)
    sprint: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    created_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    updated_at: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    resolution: Mapped[str | None] = mapped_column(String(255), nullable=True)
    issue_type: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    parent_ticket: Mapped[str | None] = mapped_column(String(64), nullable=True)
    linked_issues: Mapped[list[dict]] = mapped_column(JSON, default=list)
    components: Mapped[list[str]] = mapped_column(JSON, default=list)
    acceptance_criteria: Mapped[list[str]] = mapped_column(JSON, default=list)
    custom_fields: Mapped[dict] = mapped_column(JSON, default=dict)

    comments: Mapped[list["TicketComment"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    chunks: Mapped[list["TicketChunk"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.ticket_id", ondelete="CASCADE"), index=True)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    body_hash: Mapped[str] = mapped_column(String(64), index=True)

    ticket: Mapped[Ticket] = relationship(back_populates="comments")


class TicketChunk(Base):
    __tablename__ = "ticket_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chunk_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.ticket_id", ondelete="CASCADE"), index=True)
    section: Mapped[str] = mapped_column(String(64), index=True)
    text: Mapped[str] = mapped_column(Text)
    chunk_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    content_hash: Mapped[str] = mapped_column(String(64), index=True)

    ticket: Mapped[Ticket] = relationship(back_populates="chunks")
    embedding_metadata: Mapped["TicketEmbeddingMetadata | None"] = relationship(
        back_populates="chunk",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="selectin",
    )


class TicketEmbeddingMetadata(Base):
    __tablename__ = "ticket_embedding_metadata"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chunk_id: Mapped[str] = mapped_column(ForeignKey("ticket_chunks.chunk_id", ondelete="CASCADE"), index=True)
    ticket_id: Mapped[str] = mapped_column(String(64), index=True)
    embedding_model: Mapped[str] = mapped_column(String(128))
    embedding_hash: Mapped[str] = mapped_column(String(64), index=True)
    ticket_updated_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description_hash: Mapped[str] = mapped_column(String(64), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    embedding_vector: Mapped[dict] = mapped_column(JSON, default=dict)

    chunk: Mapped[TicketChunk] = relationship(back_populates="embedding_metadata")
