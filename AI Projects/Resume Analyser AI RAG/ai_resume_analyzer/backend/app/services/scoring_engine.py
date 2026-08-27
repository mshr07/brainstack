import re
from dataclasses import dataclass

from app.core.config import get_settings
from app.services.skill_extractor import SkillComparison


EXPERIENCE_TERMS = {
    "internship",
    "project",
    "developed",
    "built",
    "implemented",
    "deployed",
    "optimized",
    "automated",
    "api",
    "database",
}

EDUCATION_TERMS = {
    "bachelor",
    "b.tech",
    "degree",
    "computer science",
    "certification",
    "coursework",
    "data structures",
    "algorithms",
}

RESUME_SECTION_TERMS = {
    "email": r"[\w.-]+@[\w.-]+\.\w+",
    "phone": r"\b\d{10}\b|\+\d[\d\s-]{8,}",
    "skills": r"\bskills?\b",
    "education": r"\beducation\b|\bdegree\b|\bbachelor\b",
    "experience_or_projects": r"\bexperience\b|\bprojects?\b|\binternship\b",
}


@dataclass(frozen=True)
class ScoreResult:
    match_score: int
    score_breakdown: dict[str, float]
    weak_areas: list[str]


class ScoringEngine:
    """Transparent weighted scoring students can explain in interviews."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def calculate(
        self,
        resume_text: str,
        job_description: str,
        skills: SkillComparison,
        semantic_similarity: float,
    ) -> ScoreResult:
        skill_score = self._skill_score(skills)
        semantic_score = round(max(0.0, semantic_similarity) * 100, 2)
        experience_score = self._term_relevance_score(resume_text, job_description, EXPERIENCE_TERMS)
        education_score = self._term_relevance_score(resume_text, job_description, EDUCATION_TERMS)
        formatting_score = self._formatting_score(resume_text)

        final_score = (
            skill_score * self.settings.skill_score_weight
            + semantic_score * self.settings.semantic_score_weight
            + experience_score * self.settings.experience_score_weight
            + education_score * self.settings.education_score_weight
            + formatting_score * self.settings.formatting_score_weight
        )
        final_score = round(min(100.0, max(0.0, final_score)), 2)

        breakdown = {
            "skill_match": skill_score,
            "semantic_similarity": semantic_score,
            "experience_relevance": experience_score,
            "education_relevance": education_score,
            "formatting_completeness": formatting_score,
            "final_score": final_score,
        }

        return ScoreResult(
            match_score=round(final_score),
            score_breakdown=breakdown,
            weak_areas=self._weak_areas(breakdown),
        )

    def _skill_score(self, skills: SkillComparison) -> float:
        if not skills.jd_skills:
            return 0.0
        return round((len(skills.matched_skills) / len(skills.jd_skills)) * 100, 2)

    def _term_relevance_score(
        self,
        resume_text: str,
        job_description: str,
        terms: set[str],
    ) -> float:
        resume_lower = resume_text.lower()
        jd_lower = job_description.lower()
        required_terms = {term for term in terms if term in jd_lower}

        if not required_terms:
            required_terms = terms

        found_terms = {term for term in required_terms if term in resume_lower}
        return round((len(found_terms) / len(required_terms)) * 100, 2)

    def _formatting_score(self, resume_text: str) -> float:
        checks_passed = 0
        for pattern in RESUME_SECTION_TERMS.values():
            if re.search(pattern, resume_text, flags=re.IGNORECASE):
                checks_passed += 1
        return round((checks_passed / len(RESUME_SECTION_TERMS)) * 100, 2)

    def _weak_areas(self, breakdown: dict[str, float]) -> list[str]:
        labels = {
            "skill_match": "Skill match",
            "semantic_similarity": "Semantic relevance",
            "experience_relevance": "Experience relevance",
            "education_relevance": "Education/certification relevance",
            "formatting_completeness": "Resume formatting/completeness",
        }
        return [label for key, label in labels.items() if breakdown[key] < 60]

