from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Analysis
from app.schemas import AnalysisResponse, InterviewKitResponse
from app.services.ai_coach import (
    AICoachConfigurationError,
    AICoachGenerationError,
    AICoachService,
)
from app.services.resume_parser import ResumeParser
from app.services.scoring_engine import ScoringEngine
from app.services.semantic_matcher import SemanticMatcher
from app.services.skill_extractor import SkillExtractor
from app.services.text_cleaner import TextCleaner


router = APIRouter(prefix="/api", tags=["analysis"])

parser = ResumeParser()
cleaner = TextCleaner()
skills = SkillExtractor()
semantic = SemanticMatcher()
scoring = ScoringEngine()
coach = AICoachService()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(""),
    db: Session = Depends(get_db),
) -> Analysis:
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    resume_text = cleaner.clean(await parser.parse(resume))
    if len(resume_text) < 40:
        raise HTTPException(status_code=400, detail="Resume is too short to analyze.")

    job_description = cleaner.clean(job_description)
    skill_comparison = skills.compare(resume_text, job_description)
    semantic_similarity, embedding = semantic.compare(resume_text, job_description)
    breakdown = scoring.calculate(resume_text, skill_comparison, semantic_similarity)
    try:
        ai_guidance = coach.generate(
            resume_text=resume_text,
            job_description=job_description,
            skills=skill_comparison,
            score_breakdown=breakdown,
        )
    except AICoachConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AICoachGenerationError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    analysis = Analysis(
        resume_filename=resume.filename or "resume",
        resume_text=resume_text,
        job_description=job_description,
        match_score=round(breakdown["final_score"]),
        semantic_similarity=semantic_similarity,
        matched_skills=skill_comparison.matched_skills,
        missing_skills=skill_comparison.missing_skills,
        suggestions=ai_guidance.resume_recommendations,
        ai_summary=ai_guidance.ai_summary,
        job_alignment_advice=ai_guidance.job_alignment_advice,
        interview_questions=[
            question.model_dump() for question in ai_guidance.interview_questions
        ],
        answer_strategy=ai_guidance.answer_strategy,
        study_plan=ai_guidance.study_plan,
        recruiter_pitch=ai_guidance.recruiter_pitch,
        ai_provider=ai_guidance.ai_provider,
        ai_generated=ai_guidance.ai_generated,
        score_breakdown=breakdown,
        embedding=embedding,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("/analyses", response_model=list[AnalysisResponse])
def list_analyses(db: Session = Depends(get_db)) -> list[Analysis]:
    return db.query(Analysis).order_by(Analysis.id.desc()).all()


@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


@router.get("/analyses/{analysis_id}/interview-kit", response_model=InterviewKitResponse)
def get_interview_kit(
    analysis_id: int,
    db: Session = Depends(get_db),
) -> InterviewKitResponse:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return InterviewKitResponse(
        analysis_id=analysis.id,
        ai_summary=analysis.ai_summary,
        interview_questions=analysis.interview_questions,
        answer_strategy=analysis.answer_strategy,
        study_plan=analysis.study_plan,
        recruiter_pitch=analysis.recruiter_pitch,
        ai_provider=analysis.ai_provider,
        ai_generated=analysis.ai_generated,
    )


@router.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)) -> None:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    db.delete(analysis)
    db.commit()
