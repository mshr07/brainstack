from app.services.skill_extractor import SkillComparison


class SuggestionEngine:
    def generate(
        self,
        skills: SkillComparison,
        weak_areas: list[str],
        semantic_similarity: float,
    ) -> list[str]:
        suggestions: list[str] = []

        for skill in skills.missing_skills[:5]:
            suggestions.append(
                f"Add {skill} experience if you have used it, preferably with a project or measurable result."
            )

        if "Experience relevance" in weak_areas:
            suggestions.append(
                "Add more project or internship bullets that start with action verbs like built, deployed, or optimized."
            )

        if "Education/certification relevance" in weak_areas:
            suggestions.append(
                "Mention relevant coursework, certifications, or academic projects that match this job description."
            )

        if "Resume formatting/completeness" in weak_areas:
            suggestions.append(
                "Include clear sections for skills, education, experience or projects, email, and phone number."
            )

        if semantic_similarity < 0.55:
            suggestions.append(
                "Rewrite the summary and project bullets using language closer to the job description."
            )

        if not suggestions:
            suggestions.append(
                "Your resume is aligned well. Improve it further by adding quantified impact, such as latency reduced or users served."
            )

        return suggestions

