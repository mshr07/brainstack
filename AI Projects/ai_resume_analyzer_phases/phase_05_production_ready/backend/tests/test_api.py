def test_analyze_history_delete_flow(client):
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

    analysis_id = payload["id"]
    assert client.get("/api/analyses").status_code == 200
    assert client.get(f"/api/analyses/{analysis_id}").status_code == 200
    assert client.delete(f"/api/analyses/{analysis_id}").status_code == 204
    assert client.get(f"/api/analyses/{analysis_id}").status_code == 404

