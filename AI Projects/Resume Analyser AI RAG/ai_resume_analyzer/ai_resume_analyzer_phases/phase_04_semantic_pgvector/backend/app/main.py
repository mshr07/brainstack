import hashlib
import io
import math
import os
import re
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from sqlalchemy import DateTime, Float, Integer, String, Text, create_engine, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.types import JSON, TypeDecorator

try:
    from pgvector.sqlalchemy import Vector as PgVector
except ImportError:
    PgVector = None


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./phase4_analyses.db")
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "128"))
engine_kwargs = {"connect_args": {"check_same_thread": False}} \
    if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

class Base(DeclarativeBase):
    pass
class EmbeddingVector(TypeDecorator):
    impl = JSON
    cache_ok = True

    def __init__(self, dimensions: int, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.dimensions = dimensions
    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and PgVector is not None:
            return dialect.type_descriptor(PgVector(self.dimensions))
        return dialect.type_descriptor(JSON())
class Analysis(Base):
    __tablename__ = "analyses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resume_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    semantic_similarity: Mapped[float] = mapped_column(Float, nullable=False)
    matched_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    suggestions: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    score_breakdown: Mapped[dict[str, float]] = mapped_column(JSON, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(EmbeddingVector(EMBEDDING_DIMENSIONS))
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
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
@asynccontextmanager
async def lifespan(app: FastAPI):
    with engine.begin() as connection:
        if engine.dialect.name == "postgresql":
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    yield
app = FastAPI(title="AI Resume Analyzer - Phase 4", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
SKILL_ALIASES = {
    "Python": ["python"],
    "SQL": ["sql"],
    "PostgreSQL": ["postgresql", "postgres", "pgvector"],
    "FastAPI": ["fastapi", "fast api"],
    "REST API": ["rest api", "restful"],
    "Docker": ["docker"],
    "AWS": ["aws"],
    "Git": ["git", "github"],
    "NLP": ["nlp", "natural language processing"],
    "CI/CD": ["ci/cd", "continuous integration"],
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def clean_text(text_value: str) -> str:
    return re.sub(r"\s+", " ", text_value.replace("\x00", " ")).strip()


def extract_skills(text_value: str) -> list[str]:
    normalized = clean_text(text_value).lower()
    found: set[str] = set()
    for skill, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
            if re.search(pattern, normalized):
                found.add(skill)
                break
    return sorted(found)


async def parse_resume(resume: UploadFile) -> str:
    filename = resume.filename or "resume"
    extension = Path(filename).suffix.lower()
    content = await resume.read()
    if extension not in {".txt", ".pdf"}:
        raise HTTPException(status_code=400, detail="Only TXT and PDF files are supported.")
    if not content:
        raise HTTPException(status_code=400, detail="Resume file is empty.")
    if extension == ".txt":
        return content.decode("utf-8", errors="ignore")
    try:
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read PDF resume.") from exc


def embed_text(text_value: str) -> list[float]:
    vector = np.zeros(EMBEDDING_DIMENSIONS, dtype=float)
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{1,}", text_value.lower())
    print(tokens)
    for token in tokens:
        digest = hashlib.sha256(token.encode()).hexdigest()
        print(digest)
        index = int(digest[:8], 16) % EMBEDDING_DIMENSIONS
        vector[index] += 1
        print(vector)
    norm = math.sqrt(float(np.dot(vector, vector)))
    if norm == 0:
        return [0.0] * EMBEDDING_DIMENSIONS
    print(len([round(float(value / norm), 6) for value in vector]))
    return [round(float(value / norm), 6) for value in vector]

# print(embed_text("hello world"))

def cosine_similarity(left: list[float], right: list[float]) -> float:
    left_vector = np.array(left, dtype=float)
    right_vector = np.array(right, dtype=float)
    denominator = float(np.linalg.norm(left_vector) * np.linalg.norm(right_vector))
    # print(denominator)
    if denominator == 0:
        return 0.0
    print(round(float(np.dot(left_vector, right_vector) / denominator), 4))
    return round(float(np.dot(left_vector, right_vector) / denominator), 4)


def score_resume(
    resume_text: str,
    job_description: str,
    matched_skills: list[str],
    jd_skills: set[str],
    semantic_similarity: float,
) -> dict[str, float]:
    skill_score = round((len(matched_skills) / len(jd_skills)) * 100, 2) if jd_skills else 0.0
    semantic_score = round(max(0.0, semantic_similarity) * 100, 2)
    # print(skill_score, semantic_score)
    experience_terms = {"project", "internship", "built", "developed", "deployed", "database", "api"}
    experience_score = round(
        len([term for term in experience_terms if term in resume_text.lower()]) / len(experience_terms) * 100,
        2,
    )
    formatting_checks = [
        "@" in resume_text,
        bool(re.search(r"\bskills?\b", resume_text, re.IGNORECASE)),
        bool(re.search(r"\beducation\b", resume_text, re.IGNORECASE)),
        bool(re.search(r"\b(project|experience|internship)\b", resume_text, re.IGNORECASE)),
    ]
    formatting_score = round((sum(formatting_checks) / len(formatting_checks)) * 100, 2)
    final_score = round(
        skill_score * 0.40
        + semantic_score * 0.30
        + experience_score * 0.20
        + formatting_score * 0.10,
        2,
    )
    return {
        "skill_match": skill_score,
        "semantic_similarity": semantic_score,
        "experience_relevance": experience_score,
        "formatting_completeness": formatting_score,
        "final_score": final_score,
    }


def suggestions_for(missing_skills: list[str], semantic_similarity: float) -> list[str]:
    suggestions = [f"Add {skill} if you have practical experience with it." for skill in missing_skills[:5]]
    if semantic_similarity < 0.55:
        suggestions.append("Rewrite project bullets using language closer to the job description.")
    return suggestions or ["Strong match. Add quantified impact to stand out."]


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Phase 4 semantic API is running", "database": engine.dialect.name}


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(""),
    db: Session = Depends(get_db),
) -> Analysis:
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    resume_text = clean_text(await parse_resume(resume))
    if len(resume_text) < 40:
        raise HTTPException(status_code=400, detail="Resume is too short to analyze.")

    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(job_description))
    matched_skills = sorted(resume_skills.intersection(jd_skills))
    missing_skills = sorted(jd_skills.difference(resume_skills))
    resume_embedding = embed_text(resume_text)
    jd_embedding = embed_text(job_description)
    semantic_similarity = cosine_similarity(resume_embedding, jd_embedding)
    breakdown = score_resume(resume_text, job_description, matched_skills, jd_skills, semantic_similarity)

    analysis = Analysis(
        resume_filename=resume.filename or "resume",
        match_score=round(breakdown["final_score"]),
        semantic_similarity=semantic_similarity,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        suggestions=suggestions_for(missing_skills, semantic_similarity),
        score_breakdown=breakdown,
        embedding=resume_embedding,
        resume_text=resume_text,
        job_description=clean_text(job_description),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@app.get("/api/analyses", response_model=list[AnalysisResponse])
def list_analyses(db: Session = Depends(get_db)) -> list[Analysis]:
    return db.query(Analysis).order_by(Analysis.id.desc()).all()


@app.get("/api/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


@app.delete("/api/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)) -> None:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    db.delete(analysis)
    db.commit()

