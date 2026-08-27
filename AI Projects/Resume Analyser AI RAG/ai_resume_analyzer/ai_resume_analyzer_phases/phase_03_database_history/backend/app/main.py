import io
import os
import re
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from sqlalchemy import DateTime, Integer, String, Text, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.types import JSON


# load_dotenv()
#
# DB_USER = os.getenv("DB_USER")
# DB_PASSWORD = os.getenv("DB_PASSWORD")
# DB_HOST = os.getenv("DB_HOST")
# DB_PORT = os.getenv("DB_PORT")
# DB_NAME = os.getenv("DB_NAME")

DB_USER="root"
DB_PASSWORD=12345
DB_HOST="localhost"
DB_PORT=3306
DB_NAME="fastapi_db"

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
#declarative_base
# Base = declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
class Base(DeclarativeBase):
    pass
class Analysis(Base):
    __tablename__ = "analyses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resume_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    matched_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    suggestions: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class AnalysisResponse(BaseModel):
    id: int
    resume_filename: str
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AI Resume Analyzer - Phase 3", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
    )


SKILL_ALIASES = {
    "Python": ["python"],
    "SQL": ["sql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "FastAPI": ["fastapi", "fast api"],
    "REST API": ["rest api", "restful"],
    "Docker": ["docker"],
    "AWS": ["aws"],
    "Git": ["git", "github"],
    "NLP": ["nlp", "natural language processing"],
}




def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\x00", " ")).strip()


def extract_skills(text: str) -> list[str]:
    normalized = clean_text(text).lower()
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


def build_suggestions(missing_skills: list[str]) -> list[str]:
    if not missing_skills:
        return ["Strong match. Add numbers and impact to project bullets."]
    return [f"Highlight {skill} if you have used it." for skill in missing_skills[:5]]


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Phase 3 database API is running"}


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
    match_score = round((len(matched_skills) / len(jd_skills)) * 100) if jd_skills else 0

    analysis = Analysis(
        resume_filename=resume.filename or "resume",
        match_score=match_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        suggestions=build_suggestions(missing_skills),
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

