from app.services.scoring_engine import ScoringEngine
from app.services.skill_extractor import SkillComparison, SkillExtractor
from app.services.text_cleaner import TextCleaner


def test_text_cleaner_normalizes_whitespace():
    assert TextCleaner().clean("Python\n\nFastAPI\tSQL") == "Python FastAPI SQL"


def test_skill_extractor_compares_resume_and_jd():
    comparison = SkillExtractor().compare("Python FastAPI SQL", "Python FastAPI Docker AWS")

    assert comparison.matched_skills == ["FastAPI", "Python"]
    assert "AWS" in comparison.missing_skills


def test_scoring_engine_returns_final_score():
    comparison = SkillComparison(
        matched_skills=["Python"],
        missing_skills=["Docker"],
        jd_skills=["Python", "Docker"],
    )

    breakdown = ScoringEngine().calculate(
        "Email: a@b.com Skills Python Education Projects built API database",
        comparison,
        semantic_similarity=0.75,
    )

    assert breakdown["skill_match"] == 50
    assert breakdown["final_score"] > 0

