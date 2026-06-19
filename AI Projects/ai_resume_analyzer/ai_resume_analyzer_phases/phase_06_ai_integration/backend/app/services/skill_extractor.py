import re
from dataclasses import dataclass


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


@dataclass(frozen=True)
class SkillComparison:
    matched_skills: list[str]
    missing_skills: list[str]
    jd_skills: list[str]


class SkillExtractor:
    def extract(self, text: str) -> list[str]:
        normalized = text.lower()
        found: set[str] = set()
        for skill, aliases in SKILL_ALIASES.items():
            for alias in aliases:
                pattern = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
                if re.search(pattern, normalized):
                    found.add(skill)
                    break
        return sorted(found)

    def compare(self, resume_text: str, job_description: str) -> SkillComparison:
        resume_skills = set(self.extract(resume_text))
        jd_skills = set(self.extract(job_description))
        return SkillComparison(
            matched_skills=sorted(resume_skills.intersection(jd_skills)),
            missing_skills=sorted(jd_skills.difference(resume_skills)),
            jd_skills=sorted(jd_skills),
        )

