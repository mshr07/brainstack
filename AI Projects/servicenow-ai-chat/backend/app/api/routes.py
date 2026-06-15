from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import ServiceContainer, get_container
from app.models.ticket import Ticket
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.ticket import TicketCommentResponse, TicketListResponse, TicketResponse


router = APIRouter()


@router.get("/health")
def health(db: Session = Depends(get_db), container: ServiceContainer = Depends(get_container)) -> dict:
    return {
        "status": "ok",
        "tickets": db.query(Ticket).count(),
        "indexed_chunks": len(container.vector_store.chunks),
        "environment": container.settings.environment,
    }


@router.post("/sync/mock")
def sync_mock(db: Session = Depends(get_db), container: ServiceContainer = Depends(get_container)) -> dict:
    result = container.ingestion.sync_mock(db)
    indexed_chunks = container.vector_store.rebuild_tickets(db, result.changed_ticket_ids)
    if result.changed_ticket_ids:
        container.cache.clear("retrieval")
        container.cache.clear("answers")
    return result.as_dict() | {
        "indexed_changed_chunks": indexed_chunks,
        "total_tickets": db.query(Ticket).count(),
        "total_indexed_chunks": len(container.vector_store.chunks),
    }


@router.post("/sync/jira")
def sync_jira(
    updated_since: str | None = Query(default=None, description='Optional Jira updated filter, e.g. "2026/06/15 00:00"'),
    db: Session = Depends(get_db),
    container: ServiceContainer = Depends(get_container),
) -> dict:
    try:
        result = container.ingestion.sync_real_jira(db, updated_since=updated_since)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    indexed_chunks = container.vector_store.rebuild_tickets(db, result.changed_ticket_ids)
    if result.changed_ticket_ids:
        container.cache.clear("retrieval")
        container.cache.clear("answers")
    return result.as_dict() | {
        "indexed_changed_chunks": indexed_chunks,
        "total_tickets": db.query(Ticket).count(),
        "total_indexed_chunks": len(container.vector_store.chunks),
    }


@router.post("/sync/jira/incremental")
def sync_jira_incremental(
    updated_since: str | None = Query(default=None, description='Optional Jira updated filter, e.g. "2026/06/15 00:00"'),
    db: Session = Depends(get_db),
    container: ServiceContainer = Depends(get_container),
) -> dict:
    return sync_jira(updated_since=updated_since, db=db, container=container)


@router.post("/index/rebuild")
def rebuild_index(db: Session = Depends(get_db), container: ServiceContainer = Depends(get_container)) -> dict:
    chunks = container.vector_store.rebuild(db)
    container.cache.clear("retrieval")
    container.cache.clear("answers")
    return {"indexed_chunks": chunks}


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db), container: ServiceContainer = Depends(get_container)) -> ChatResponse:
    return container.chat.chat(db, request.question, session_id=request.session_id, filters=request.filters)


@router.get("/tickets/search", response_model=TicketListResponse)
def search_tickets(
    q: str = Query("", description="Search text"),
    status: str | None = None,
    priority: str | None = None,
    assignee: str | None = None,
    db: Session = Depends(get_db),
) -> TicketListResponse:
    query = db.query(Ticket).options(selectinload(Ticket.comments))
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Ticket.ticket_id.ilike(like), Ticket.summary.ilike(like), Ticket.description.ilike(like)))
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if assignee:
        query = query.filter(Ticket.assignee == assignee)
    tickets = query.order_by(Ticket.updated_at.desc()).limit(50).all()
    return TicketListResponse(tickets=[ticket_to_response(ticket) for ticket in tickets], total=len(tickets))


@router.get("/tickets", response_model=TicketListResponse)
def list_tickets(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> TicketListResponse:
    tickets = db.query(Ticket).options(selectinload(Ticket.comments)).order_by(Ticket.updated_at.desc()).limit(limit).all()
    return TicketListResponse(tickets=[ticket_to_response(ticket) for ticket in tickets], total=len(tickets))


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)) -> TicketResponse:
    ticket = db.query(Ticket).options(selectinload(Ticket.comments)).filter(Ticket.ticket_id == ticket_id.upper()).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket_to_response(ticket)


@router.get("/analytics/blockers", response_model=TicketListResponse)
def blockers(db: Session = Depends(get_db), container: ServiceContainer = Depends(get_container)) -> TicketListResponse:
    tickets = container.analytics.blockers(db)
    return TicketListResponse(tickets=[ticket_to_response(ticket) for ticket in tickets], total=len(tickets))


@router.get("/analytics/high-priority", response_model=TicketListResponse)
def high_priority(db: Session = Depends(get_db), container: ServiceContainer = Depends(get_container)) -> TicketListResponse:
    tickets = container.analytics.high_priority(db)
    return TicketListResponse(tickets=[ticket_to_response(ticket) for ticket in tickets], total=len(tickets))


@router.get("/analytics/inactive", response_model=TicketListResponse)
def inactive(
    days: int = Query(14, ge=1),
    db: Session = Depends(get_db),
    container: ServiceContainer = Depends(get_container),
) -> TicketListResponse:
    tickets = container.analytics.inactive(db, days=days)
    return TicketListResponse(tickets=[ticket_to_response(ticket) for ticket in tickets], total=len(tickets))


@router.get("/analytics/missing-assignee", response_model=TicketListResponse)
def missing_assignee(db: Session = Depends(get_db), container: ServiceContainer = Depends(get_container)) -> TicketListResponse:
    tickets = container.analytics.missing_assignee(db)
    return TicketListResponse(tickets=[ticket_to_response(ticket) for ticket in tickets], total=len(tickets))


def ticket_to_response(ticket: Ticket) -> TicketResponse:
    return TicketResponse(
        ticket_id=ticket.ticket_id,
        project_key=ticket.project_key,
        summary=ticket.summary,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        assignee=ticket.assignee,
        reporter=ticket.reporter,
        labels=ticket.labels or [],
        sprint=ticket.sprint,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        resolution=ticket.resolution,
        issue_type=ticket.issue_type,
        parent_ticket=ticket.parent_ticket,
        linked_issues=ticket.linked_issues or [],
        comments=[
            TicketCommentResponse(author=comment.author, body=comment.body, created_at=comment.created_at)
            for comment in ticket.comments
        ],
    )
