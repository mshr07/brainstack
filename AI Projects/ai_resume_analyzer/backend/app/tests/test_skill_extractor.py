from app.services.skill_extractor import SkillExtractor


def test_extract_skills_finds_aliases():
    extractor = SkillExtractor()

    skills = extractor.extract_skills("Built RESTful APIs with Fast API, Postgres, and Docker.")

    assert "FastAPI" in skills
    assert "PostgreSQL" in skills
    assert "Docker" in skills
    assert "REST API" in skills


def test_compare_skills_returns_matched_and_missing():
    extractor = SkillExtractor()

    comparison = extractor.compare(
        "Python FastAPI SQL project",
        "Python FastAPI Docker AWS PostgreSQL",
    )

    assert comparison.matched_skills == ["FastAPI", "Python"]
    assert "AWS" in comparison.missing_skills
    assert "Docker" in comparison.missing_skills

