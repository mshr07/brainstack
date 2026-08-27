import io
import re
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader


app = FastAPI(title="AI Resume Analyzer - Phase 2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


SKILL_ALIASES: dict[str, list[str]] = {
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
# Remove AnalyzeRequest class

class AnalyzeResponse(BaseModel):
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]
    extracted_characters: int


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\x00", " ")).strip().lower()


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

    if not content:
        raise HTTPException(status_code=400, detail="Resume file is empty.")
    if extension not in {".txt", ".pdf"}:
        raise HTTPException(status_code=400, detail="Only TXT and PDF files are \
         supported.")

    if extension == ".txt":
        return content.decode("utf-8", errors="ignore")

    try:
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read PDF resume.") from exc


def suggestions_for(missing_skills: list[str]) -> list[str]:
    if not missing_skills:
        return ["Good skill alignment. Add measurable outcomes to make the resume stronger."]
    return [f"Add or highlight {skill} if you have used it." for skill in missing_skills[:5]]


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Phase 2 upload API is running"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(""),
) -> AnalyzeResponse:
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

    return AnalyzeResponse(
        match_score=match_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        suggestions=suggestions_for(missing_skills),
        extracted_characters=len(resume_text),
    )

# Task, Create a fast api application with 3 end points, test it in postman and /docs
# /home -> Welcome to home page
# /about -> welcome to about page
# /contact -> welcome to contact page
# also read about sqlalchemy, engine, session and declarative_base in sqlalchemy(orm),
# at https://www.sqlalchemy.org/