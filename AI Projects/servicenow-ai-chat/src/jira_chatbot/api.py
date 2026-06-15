from __future__ import annotations

from dataclasses import asdict

from jira_chatbot.service import JiraChatbotService

try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover
    FastAPI = None
    HTTPException = None
    BaseModel = object


class AskRequest(BaseModel):
    question: str


def create_app() -> "FastAPI":
    if FastAPI is None:
        raise RuntimeError("Install fastapi and uvicorn to run the API server")
    app = FastAPI(title="Jira Chatbot", version="0.1.0")
    service = JiraChatbotService()

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok", "tickets": len(service.tickets)}

    @app.post("/ask")
    def ask(request: AskRequest) -> dict:
        answer = service.ask(request.question)
        return {
            "answer": answer.answer,
            "ticket_ids": answer.ticket_ids,
            "confidence": answer.confidence,
            "from_cache": answer.from_cache,
        }

    @app.get("/tickets/{ticket_key}")
    def ticket(ticket_key: str) -> dict:
        found = service.get_ticket(ticket_key)
        if not found:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return asdict(found)

    @app.get("/analysis/risk-report")
    def risk_report() -> dict:
        return service.risk_report()

    return app


app = create_app() if FastAPI is not None else None
