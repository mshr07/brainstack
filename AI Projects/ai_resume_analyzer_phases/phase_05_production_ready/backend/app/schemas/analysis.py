from datetime import datetime

from pydantic import BaseModel


class ScoreBreakdown(BaseModel):
    skill_match: float
    semantic_similarity: float
    experience_relevance: float
    formatting_completeness: float
    final_score: float


class AnalysisResponse(BaseModel):
    id: int
    resume_filename: str
    match_score: int
    semantic_similarity: float
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]
    score_breakdown: ScoreBreakdown
    created_at: datetime

    model_config = {"from_attributes": True}

