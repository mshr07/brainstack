from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Analysis
from app.schemas import AnalysisResponse
from app.services.resume_parser import ResumeParser
from app.services.scoring_engine import ScoringEngine
from app.services.semantic_matcher import SemanticMatcher
from app.services.skill_extractor import SkillExtractor
from app.services.suggestion_engine import SuggestionEngine
from app.services.text_cleaner import TextCleaner


router = APIRouter(prefix="/api", tags=["analysis"])

parser = ResumeParser()
cleaner = TextCleaner()
skills = SkillExtractor()
semantic = SemanticMatcher()
scoring = ScoringEngine()
suggestions = SuggestionEngine()


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

    analysis = Analysis(
        resume_filename=resume.filename or "resume",
        resume_text=resume_text,
        job_description=job_description,
        match_score=round(breakdown["final_score"]),
        semantic_similarity=semantic_similarity,
        matched_skills=skill_comparison.matched_skills,
        missing_skills=skill_comparison.missing_skills,
        suggestions=suggestions.generate(skill_comparison.missing_skills, semantic_similarity),
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


@router.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)) -> None:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    db.delete(analysis)
    db.commit()

