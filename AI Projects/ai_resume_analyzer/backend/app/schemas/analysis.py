from datetime import datetime

from pydantic import BaseModel, Field


class ScoreBreakdown(BaseModel):
    skill_match: float = Field(..., ge=0, le=100)
    semantic_similarity: float = Field(..., ge=0, le=100)
    experience_relevance: float = Field(..., ge=0, le=100)
    education_relevance: float = Field(..., ge=0, le=100)
    formatting_completeness: float = Field(..., ge=0, le=100)
    final_score: float = Field(..., ge=0, le=100)


class AnalysisResponse(BaseModel):
    id: int
    resume_filename: str
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    semantic_similarity: float
    weak_areas: list[str]
    suggestions: list[str]
    score_breakdown: ScoreBreakdown
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisSummary(BaseModel):
    id: int
    resume_filename: str
    match_score: int
    semantic_similarity: float
    matched_skills: list[str]
    missing_skills: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}

