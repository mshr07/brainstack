from datetime import datetime

from pydantic import BaseModel

from app.schemas.ai import InterviewQuestion


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
    ai_summary: str
    job_alignment_advice: list[str]
    interview_questions: list[InterviewQuestion]
    answer_strategy: list[str]
    study_plan: list[str]
    recruiter_pitch: str
    ai_provider: str
    ai_generated: bool
    score_breakdown: ScoreBreakdown
    created_at: datetime

    model_config = {"from_attributes": True}


class InterviewKitResponse(BaseModel):
    analysis_id: int
    ai_summary: str
    interview_questions: list[InterviewQuestion]
    answer_strategy: list[str]
    study_plan: list[str]
    recruiter_pitch: str
    ai_provider: str
    ai_generated: bool
