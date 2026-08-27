from datetime import datetime
from enum import StrEnum
from operator import add
from typing import Annotated, Any, Literal, TypedDict
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.title() for part in parts[1:])


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
        use_enum_values=True,
    )


class Intent(StrEnum):
    DOCUMENTATION = "documentation"
    METADATA = "metadata"
    ANALYTICAL = "analytical"
    CLARIFICATION = "clarification"
    UNSAFE = "unsafe"


class RunStatus(StrEnum):
    RUNNING = "running"
    COMPLETED = "completed"
    CLARIFICATION = "clarification"
    UNSAFE = "unsafe"
    APPROVAL_REQUIRED = "approval_required"
    FAILED = "failed"
    BUDGET_EXCEEDED = "budget_exceeded"


class Budgets(ApiModel):
    max_steps: int = Field(ge=1, le=32)
    max_repairs: int = Field(ge=0, le=3)
    max_input_tokens: int = Field(ge=128, le=100_000)
    max_output_tokens: int = Field(ge=64, le=16_000)
    max_tool_calls: int = Field(ge=0, le=24)
    max_result_bytes: int = Field(ge=1_024, le=10_000_000)
    max_estimated_cost_usd: float | None = Field(default=None, ge=0, le=100)


class OrchestrationRequest(ApiModel):
    run_id: UUID
    conversation_id: UUID
    tenant_id: str = Field(min_length=1, max_length=128)
    subject_id: str = Field(min_length=1, max_length=256)
    capabilities: list[str] = Field(max_length=64)
    question: str = Field(min_length=1, max_length=4_000)
    client_timezone: str = Field(min_length=1, max_length=64)
    locale: str = Field(min_length=2, max_length=16)
    deadline_at: datetime
    budgets: Budgets

    @field_validator("deadline_at")
    @classmethod
    def deadline_must_be_timezone_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("deadlineAt must include a timezone")
        return value

    @field_validator("capabilities")
    @classmethod
    def capabilities_must_be_unique(cls, value: list[str]) -> list[str]:
        if len(value) != len(set(value)):
            raise ValueError("capabilities must be unique")
        return value


class Evidence(ApiModel):
    evidence_id: str
    kind: Literal["metadata", "glossary", "document", "graph", "query_result"]
    title: str
    source_version: str
    uri: str | None = None
    score: float | None = Field(default=None, ge=0, le=1)


class Validation(ApiModel):
    stage: str
    passed: bool
    code: str
    detail: str | None = Field(default=None, max_length=1_000)


class OrchestrationResponse(ApiModel):
    run_id: UUID
    request_id: str
    state: RunStatus
    intent: Intent
    step_count: int = Field(ge=0, le=32)
    answer: str | None = Field(default=None, max_length=16_000)
    evidence: list[Evidence] = Field(max_length=100)
    validations: list[Validation] = Field(max_length=100)
    limitations: list[str] = Field(max_length=20)


class AgentState(TypedDict):
    """Internal state carries decisions and evidence, never private chain-of-thought."""

    run_id: UUID
    request_id: str
    conversation_id: UUID
    tenant_id: str
    subject_id: str
    capabilities: tuple[str, ...]
    question: str
    deadline_at: datetime
    budgets: Budgets
    step_count: int
    repair_count: int
    intent: Intent
    plan: list[dict[str, Any]]
    evidence: Annotated[list[Evidence], add]
    tool_results: list[dict[str, Any]]
    validations: Annotated[list[Validation], add]
    limitations: list[str]
    status: RunStatus
    answer: str | None
    terminal_error: dict[str, Any] | None
