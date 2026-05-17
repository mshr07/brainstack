from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.database.session import get_db
from app.models import Analysis
from app.schemas import AnalysisResponse, AnalysisSummary
from app.services.pgvector_service import PgVectorService
from app.services.resume_parser import ResumeParser
from app.services.scoring_engine import ScoringEngine
from app.services.semantic_matcher import SemanticMatcher
from app.services.skill_extractor import SkillExtractor
from app.services.suggestion_engine import SuggestionEngine
from app.services.text_cleaner import TextCleaner
from app.utils.exceptions import ResumeParsingError


router = APIRouter(prefix="/api", tags=["resume analysis"])

resume_parser = ResumeParser()
text_cleaner = TextCleaner()
skill_extractor = SkillExtractor()
semantic_matcher = SemanticMatcher()
scoring_engine = ScoringEngine()
suggestion_engine = SuggestionEngine()
pgvector_service = PgVectorService()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(""),
    db: Session = Depends(get_db),
) -> Analysis:
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    try:
        raw_resume_text = await resume_parser.parse_upload(resume)
    except ResumeParsingError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    cleaned_resume_text = text_cleaner.clean(raw_resume_text)
    cleaned_job_description = text_cleaner.clean(job_description)

    if len(cleaned_resume_text) < 40:
        raise HTTPException(
            status_code=400,
            detail="Resume text is too short to analyze. Add more resume content.",
        )

    skill_comparison = skill_extractor.compare(cleaned_resume_text, cleaned_job_description)
    semantic_similarity, resume_embedding = semantic_matcher.compare(
        cleaned_resume_text,
        cleaned_job_description,
    )
    score_result = scoring_engine.calculate(
        cleaned_resume_text,
        cleaned_job_description,
        skill_comparison,
        semantic_similarity,
    )
    suggestions = suggestion_engine.generate(
        skill_comparison,
        score_result.weak_areas,
        semantic_similarity,
    )

    analysis = Analysis(
        resume_filename=resume.filename or "resume",
        resume_text=cleaned_resume_text,
        job_description=cleaned_job_description,
        match_score=score_result.match_score,
        semantic_similarity=semantic_similarity,
        matched_skills=skill_comparison.matched_skills,
        missing_skills=skill_comparison.missing_skills,
        weak_areas=score_result.weak_areas,
        suggestions=suggestions,
        score_breakdown=score_result.score_breakdown,
    )
    pgvector_service.attach_embedding(analysis, resume_embedding)

    try:
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Could not save analysis")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not available. Please check PostgreSQL connection.",
        ) from exc

    return analysis


@router.get("/analyses", response_model=list[AnalysisSummary])
def list_analyses(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
) -> list[Analysis]:
    try:
        return (
            db.query(Analysis)
            .order_by(Analysis.created_at.desc(), Analysis.id.desc())
            .offset(skip)
            .limit(min(limit, 100))
            .all()
        )
    except SQLAlchemyError as exc:
        logger.exception("Could not list analyses")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not available. Please check PostgreSQL connection.",
        ) from exc


@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


@router.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)) -> None:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    try:
        db.delete(analysis)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Could not delete analysis")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not available. Please check PostgreSQL connection.",
        ) from exc
