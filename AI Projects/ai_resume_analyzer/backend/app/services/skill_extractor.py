import re
from dataclasses import dataclass


SKILL_ALIASES: dict[str, list[str]] = {
    "Python": ["python"],
    "SQL": ["sql"],
    "PostgreSQL": ["postgresql", "postgres", "pgvector"],
    "MySQL": ["mysql"],
    "FastAPI": ["fastapi", "fast api"],
    "Flask": ["flask"],
    "Django": ["django"],
    "REST API": ["rest api", "restful", "api development"],
    "JavaScript": ["javascript", "js"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "reactjs"],
    "HTML": ["html"],
    "CSS": ["css"],
    "Docker": ["docker", "containerization", "containers"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "Git": ["git", "github", "gitlab"],
    "Linux": ["linux", "unix"],
    "Machine Learning": ["machine learning", "ml"],
    "NLP": ["nlp", "natural language processing"],
    "spaCy": ["spacy"],
    "Transformers": ["transformers", "bert", "sentence-transformers"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "PyTest": ["pytest", "unit testing"],
    "CI/CD": ["ci/cd", "continuous integration", "continuous deployment"],
}


@dataclass(frozen=True)
class SkillComparison:
    resume_skills: list[str]
    jd_skills: list[str]
    matched_skills: list[str]
    missing_skills: list[str]


class SkillExtractor:
    """Beginner-friendly skill extractor using aliases and regex.

    A more advanced version can add spaCy named-entity recognition, custom
    skill taxonomies, or a model trained on real job descriptions.
    """

    def extract_skills(self, text: str) -> list[str]:
        normalized_text = text.lower()
        found_skills: set[str] = set()

        for canonical_skill, aliases in SKILL_ALIASES.items():
            for alias in aliases:
                pattern = r"(?<![a-z0-9])" + re.escape(alias.lower()) + r"(?![a-z0-9])"
                if re.search(pattern, normalized_text):
                    found_skills.add(canonical_skill)
                    break

        return sorted(found_skills)

    def compare(self, resume_text: str, job_description: str) -> SkillComparison:
        resume_skills = self.extract_skills(resume_text)
        jd_skills = self.extract_skills(job_description)
        resume_skill_set = set(resume_skills)
        jd_skill_set = set(jd_skills)

        matched_skills = sorted(resume_skill_set.intersection(jd_skill_set))
        missing_skills = sorted(jd_skill_set.difference(resume_skill_set))

        return SkillComparison(
            resume_skills=resume_skills,
            jd_skills=jd_skills,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
        )

