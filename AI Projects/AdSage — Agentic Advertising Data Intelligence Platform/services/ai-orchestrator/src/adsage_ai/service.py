from adsage_ai.config import Settings
from adsage_ai.graph import build_graph
from adsage_ai.models import (
    AgentState,
    Intent,
    OrchestrationRequest,
    OrchestrationResponse,
    RunStatus,
)


class OrchestrationService:
    """Executes the fixed graph under both framework and application budgets."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._graph = build_graph()

    async def orchestrate(
        self, request: OrchestrationRequest, request_id: str
    ) -> OrchestrationResponse:
        initial: AgentState = {
            "run_id": request.run_id,
            "request_id": request_id,
            "conversation_id": request.conversation_id,
            "tenant_id": request.tenant_id,
            "subject_id": request.subject_id,
            "capabilities": tuple(request.capabilities),
            "question": request.question,
            "deadline_at": request.deadline_at,
            "budgets": request.budgets,
            "step_count": 0,
            "repair_count": 0,
            "intent": Intent.CLARIFICATION,
            "plan": [],
            "evidence": [],
            "tool_results": [],
            "validations": [],
            "limitations": [],
            "status": RunStatus.RUNNING,
            "answer": None,
            "terminal_error": None,
        }
        state = await self._graph.ainvoke(
            initial, config={"recursion_limit": self._settings.max_graph_recursion}
        )
        return OrchestrationResponse(
            run_id=state["run_id"],
            request_id=state["request_id"],
            state=state["status"],
            intent=state["intent"],
            step_count=state["step_count"],
            answer=state["answer"],
            evidence=state["evidence"],
            validations=state["validations"],
            limitations=state["limitations"],
        )
