import re

from app.services.skill_extractor import SkillComparison


class ScoringEngine:
    def calculate(
        self,
        resume_text: str,
        skills: SkillComparison,
        semantic_similarity: float,
    ) -> dict[str, float]:
        skill_score = (
            round(len(skills.matched_skills) / len(skills.jd_skills) * 100, 2)
            if skills.jd_skills
            else 0.0
        )
        semantic_score = round(max(0.0, semantic_similarity) * 100, 2)
        experience_terms = {"project", "internship", "built", "developed", "api", "database"}
        experience_score = round(
            len([term for term in experience_terms if term in resume_text.lower()])
            / len(experience_terms)
            * 100,
            2,
        )
        formatting_checks = [
            "@" in resume_text,
            bool(re.search(r"\bskills?\b", resume_text, re.IGNORECASE)),
            bool(re.search(r"\beducation\b", resume_text, re.IGNORECASE)),
            bool(re.search(r"\b(project|experience|internship)\b", resume_text, re.IGNORECASE)),
        ]
        formatting_score = round(sum(formatting_checks) / len(formatting_checks) * 100, 2)
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

