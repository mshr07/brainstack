from app.services.scoring_engine import ScoringEngine
from app.services.skill_extractor import SkillComparison


def test_scoring_engine_returns_transparent_breakdown():
    engine = ScoringEngine()
    skills = SkillComparison(
        resume_skills=["Python", "FastAPI"],
        jd_skills=["Python", "FastAPI", "Docker", "AWS"],
        matched_skills=["FastAPI", "Python"],
        missing_skills=["AWS", "Docker"],
    )

    result = engine.calculate(
        resume_text=(
            "Email: alex@example.com Phone: +1 555 123 4567 Skills Python FastAPI "
            "Education Bachelor Computer Science Projects built API database"
        ),
        job_description="Need Python FastAPI Docker AWS API database internship",
        skills=skills,
        semantic_similarity=0.8,
    )

    assert 0 <= result.match_score <= 100
    assert result.score_breakdown["skill_match"] == 50
    assert result.score_breakdown["semantic_similarity"] == 80
    assert "final_score" in result.score_breakdown

