class SuggestionEngine:
    def generate(self, missing_skills: list[str], semantic_similarity: float) -> list[str]:
        suggestions = [f"Add {skill} if you have used it in a real project." for skill in missing_skills[:5]]
        if semantic_similarity < 0.55:
            suggestions.append("Rewrite your summary and project bullets using words from the job description.")
        return suggestions or ["Strong match. Add measurable results to improve interview impact."]

