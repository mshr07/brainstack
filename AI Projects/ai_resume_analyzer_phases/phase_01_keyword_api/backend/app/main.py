import re

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(title="AI Resume Analyzer - Phase 1")


SKILL_ALIASES: dict[str, list[str]] = {
    "Python": ["python"],
    "SQL": ["sql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "FastAPI": ["fastapi", "fast api"],
    "REST API": ["rest api", "restful"],
    "Docker": ["docker"],
    "AWS": ["aws", "amazon web services"],
    "Git": ["git", "github"],
    "NLP": ["nlp", "natural language processing"],
}


class AnalyzeRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]


def clean_text(text: str) -> str:

    return re.sub(r"\s+", " ", text).strip().lower()


def extract_skills(text: str) -> list[str]:
    normalized_text = clean_text(text)
    found_skills: set[str] = set()

    for skill, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
            if re.search(pattern, normalized_text):
                found_skills.add(skill)
                break

    return sorted(found_skills)


def build_suggestions(missing_skills: list[str]) -> list[str]:
    if not missing_skills:
        return ["Your resume covers the key skills. Add measurable project impact next."]

    return [
        f"Add {skill} if you have used it in a project, internship, or coursework."
        for skill in missing_skills[:5]
    ]


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Phase 1 keyword API is running"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    resume_text = clean_text(payload.resume_text)
    job_description = clean_text(payload.job_description)

    if not resume_text:
        raise HTTPException(status_code=400, detail="Resume text cannot be empty.")
    if not job_description:
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(job_description))
    matched_skills = sorted(resume_skills.intersection(jd_skills))
    missing_skills = sorted(jd_skills.difference(resume_skills))

    match_score = 0
    if jd_skills:
        match_score = round((len(matched_skills) / len(jd_skills)) * 100)

    return AnalyzeResponse(
        match_score=match_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        suggestions=build_suggestions(missing_skills),
    )

# pip install fastapi
# pip install pydantic
# uvicorn main:app --reload