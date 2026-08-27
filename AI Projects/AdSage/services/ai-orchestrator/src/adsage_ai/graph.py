import re
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from adsage_ai.models import AgentState, Intent, RunStatus, Validation

_CONTROL_TRANSFER = re.compile(
    r"(?is)(ignore|disregard).{0,40}(previous|system|developer).{0,40}"
    r"(instruction|message)|reveal.{0,30}(system prompt|chain.of.thought)|"
    r"bypass.{0,30}(authorization|security|sql validation)"
)
_METADATA_TERMS = re.compile(
    r"(?i)\b(dataset|table|column|schema|lineage|join path|metric definition|glossary)\b"
)
_DOCUMENTATION_TERMS = re.compile(r"(?i)\b(how is .+ derived|documentation|runbook|faq)\b")


def _can_start_step(state: AgentState) -> tuple[bool, dict[str, Any]]:
    if datetime.now(UTC) >= state["deadline_at"]:
        return False, {
            "status": RunStatus.BUDGET_EXCEEDED,
            "terminal_error": {
                "code": "deadline_exceeded",
                "safe_message": "The bounded analysis deadline elapsed.",
                "retryable": True,
            },
        }
    if state["step_count"] >= state["budgets"].max_steps:
        return False, {
            "status": RunStatus.BUDGET_EXCEEDED,
            "terminal_error": {
                "code": "step_budget_exceeded",
                "safe_message": "The bounded analysis step limit was reached.",
                "retryable": False,
            },
        }
    return True, {"step_count": state["step_count"] + 1}


async def guardrail_node(state: AgentState) -> Mapping[str, Any]:
    can_run, update = _can_start_step(state)
    if not can_run:
        return update
    if _CONTROL_TRANSFER.search(state["question"]):
        return {
            **update,
            "intent": Intent.UNSAFE,
            "status": RunStatus.UNSAFE,
            "validations": [
                Validation(
                    stage="guardrail",
                    passed=False,
                    code="instruction_control_transfer",
                    detail="The question attempted to modify protected instructions or controls.",
                )
            ],
        }
    return {
        **update,
        "validations": [Validation(stage="guardrail", passed=True, code="input_accepted")],
    }


async def classify_intent_node(state: AgentState) -> Mapping[str, Any]:
    can_run, update = _can_start_step(state)
    if not can_run:
        return update
    question = state["question"].strip()
    if len(question.split()) < 3:
        intent = Intent.CLARIFICATION
        status = RunStatus.CLARIFICATION
    elif _DOCUMENTATION_TERMS.search(question):
        intent = Intent.DOCUMENTATION
        status = RunStatus.RUNNING
    elif _METADATA_TERMS.search(question):
        intent = Intent.METADATA
        status = RunStatus.RUNNING
    else:
        intent = Intent.ANALYTICAL
        status = RunStatus.RUNNING
    return {
        **update,
        "intent": intent,
        "status": status,
        "plan": [
            {
                "step_id": "phase1-classification",
                "capability": intent.value,
                "status": "completed",
                "depends_on": [],
            }
        ],
        "validations": [Validation(stage="intent", passed=True, code=f"intent_{intent.value}")],
    }


async def response_node(state: AgentState) -> Mapping[str, Any]:
    if state["status"] == RunStatus.BUDGET_EXCEEDED:
        error = state["terminal_error"] or {}
        return {
            "answer": error.get("safe_message", "The bounded analysis budget was exhausted."),
            "limitations": ["No data tool or model was invoked."],
        }
    if state["intent"] == Intent.UNSAFE:
        return {
            "answer": (
                "I can analyze governed advertising data, but I cannot change protected "
                "instructions, expose hidden reasoning, or bypass authorization and SQL controls."
            ),
            "limitations": ["No data tool or model was invoked."],
        }
    if state["intent"] == Intent.CLARIFICATION:
        return {
            "answer": (
                "Please add the metric or data question, time range, and comparison you need."
            ),
            "limitations": ["The request was too short to select a governed capability."],
        }
    capability = state["intent"].value
    return {
        "status": RunStatus.COMPLETED,
        "answer": (
            f"The Phase 1 workflow classified this as a {capability} request. "
            "Governed retrieval and analytical execution are not enabled in this phase, "
            "so AdSage did not invent a metric definition, generate SQL, or query data."
        ),
        "limitations": [
            "Phase 1 validates orchestration and security contracts only.",
            "No analytical claim or citation is available until governed tools are implemented.",
        ],
    }


def _after_guardrail(state: AgentState) -> str:
    if state["status"] in {RunStatus.UNSAFE, RunStatus.BUDGET_EXCEEDED}:
        return "respond"
    return "classify"


def build_graph() -> CompiledStateGraph[AgentState, None, AgentState, AgentState]:
    """Compile a finite graph; application code also enforces deadline and step budgets."""

    builder = StateGraph(AgentState)
    builder.add_node("guardrail", guardrail_node)
    builder.add_node("classify", classify_intent_node)
    builder.add_node("respond", response_node)
    builder.add_edge(START, "guardrail")
    builder.add_conditional_edges(
        "guardrail", _after_guardrail, {"classify": "classify", "respond": "respond"}
    )
    builder.add_edge("classify", "respond")
    builder.add_edge("respond", END)
    return builder.compile()
