from app.api import routes
from app.schemas.ai import AICoachOutput, InterviewQuestion
from app.services.ai_coach import AICoachGenerationError


def fake_openai_guidance(*args, **kwargs):
    return AICoachOutput(
        ai_summary="AI-generated summary for this candidate and job description.",
        resume_recommendations=[
            "AI-generated resume recommendation focused on the uploaded resume.",
            "AI-generated recommendation about project evidence.",
            "AI-generated recommendation about missing skill proof.",
            "AI-generated recommendation about quantified impact.",
        ],
        job_alignment_advice=[
            "AI-generated advice connecting the resume to the target job.",
            "AI-generated advice about demonstrated backend skills.",
            "AI-generated advice about honest preparation for missing skills.",
        ],
        interview_questions=[
            InterviewQuestion(
                question=f"AI-generated technical question {index} tailored to this resume.",
                why_it_matters=f"AI-generated reason question {index} is relevant.",
                strong_answer_points=[
                    "AI-generated answer point one.",
                    "AI-generated answer point two.",
                ],
            )
            for index in range(1, 6)
        ],
        answer_strategy=[
            "AI-generated answer strategy one.",
            "AI-generated answer strategy two.",
            "AI-generated answer strategy three.",
            "AI-generated answer strategy four.",
        ],
        study_plan=[
            f"AI-generated day {index} study plan item." for index in range(1, 8)
        ],
        recruiter_pitch="AI-generated recruiter pitch.",
        ai_provider="openai:test-mock",
        ai_generated=True,
    )


def test_analyze_history_delete_flow(client, monkeypatch):
    monkeypatch.setattr(routes.coach, "generate", fake_openai_guidance)
    resume_text = b"""
    Alex Student
    Email: alex@example.com
    Education Bachelor Computer Science
    Skills Python SQL PostgreSQL FastAPI Docker Git
    Projects built REST API with FastAPI and PostgreSQL database.
    Internship developed Python automation scripts.
    """
    jd_text = "Need Python FastAPI SQL PostgreSQL Docker Git AWS CI/CD backend intern"

    response = client.post(
        "/api/analyze",
        files={"resume": ("resume.txt", resume_text, "text/plain")},
        data={"job_description": jd_text},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["match_score"] > 0
    assert "Python" in payload["matched_skills"]
    assert payload["ai_summary"]
    assert payload["interview_questions"]
    assert payload["answer_strategy"]
    assert payload["study_plan"]
    assert payload["recruiter_pitch"]
    assert payload["ai_generated"] is True
    assert payload["ai_provider"] == "openai:test-mock"

    analysis_id = payload["id"]
    assert client.get("/api/analyses").status_code == 200
    assert client.get(f"/api/analyses/{analysis_id}").status_code == 200
    kit_response = client.get(f"/api/analyses/{analysis_id}/interview-kit")
    assert kit_response.status_code == 200
    assert kit_response.json()["analysis_id"] == analysis_id
    assert client.delete(f"/api/analyses/{analysis_id}").status_code == 204
    assert client.get(f"/api/analyses/{analysis_id}").status_code == 404


def test_analyze_requires_openai_api_key(client):
    resume_text = b"""
    Alex Student
    Email: alex@example.com
    Education Bachelor Computer Science
    Skills Python SQL PostgreSQL FastAPI Docker Git
    Projects built REST API with FastAPI and PostgreSQL database.
    Internship developed Python automation scripts.
    """

    response = client.post(
        "/api/analyze",
        files={"resume": ("resume.txt", resume_text, "text/plain")},
        data={"job_description": "Need Python FastAPI SQL backend intern"},
    )

    assert response.status_code == 503
    assert "OPENAI_API_KEY is required" in response.json()["detail"]


def test_analyze_returns_openai_quota_error(client, monkeypatch):
    def raise_quota_error(*args, **kwargs):
        raise AICoachGenerationError(
            "OpenAI quota is unavailable for this API key. Check billing/quota or use another key."
        )

    monkeypatch.setattr(routes.coach, "generate", raise_quota_error)
    resume_text = b"""
    Alex Student
    Email: alex@example.com
    Education Bachelor Computer Science
    Skills Python SQL PostgreSQL FastAPI Docker Git
    Projects built REST API with FastAPI and PostgreSQL database.
    Internship developed Python automation scripts.
    """

    response = client.post(
        "/api/analyze",
        files={"resume": ("resume.txt", resume_text, "text/plain")},
        data={"job_description": "Need Python FastAPI SQL backend intern"},
    )

    assert response.status_code == 502
    assert "OpenAI quota is unavailable" in response.json()["detail"]
