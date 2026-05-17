def test_analyze_list_get_and_delete_flow(client):
    resume_text = b"""
    Alex Student
    Email: alex@example.com
    Phone: +1 555 123 4567
    Education Bachelor Computer Science
    Skills Python SQL PostgreSQL FastAPI Docker Git
    Projects built REST API with FastAPI and PostgreSQL database.
    Internship developed Python automation scripts.
    """
    job_description = (
        "We need a Python backend intern with FastAPI, PostgreSQL, SQL, Docker, "
        "Git, REST API experience, AWS, and CI/CD knowledge."
    )

    analyze_response = client.post(
        "/api/analyze",
        files={"resume": ("resume.txt", resume_text, "text/plain")},
        data={"job_description": job_description},
    )

    assert analyze_response.status_code == 200
    payload = analyze_response.json()
    assert payload["match_score"] >= 50
    assert "Python" in payload["matched_skills"]
    assert "AWS" in payload["missing_skills"]
    assert payload["suggestions"]

    analysis_id = payload["id"]

    list_response = client.get("/api/analyses")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    get_response = client.get(f"/api/analyses/{analysis_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == analysis_id

    delete_response = client.delete(f"/api/analyses/{analysis_id}")
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/analyses/{analysis_id}")
    assert missing_response.status_code == 404


def test_analyze_rejects_empty_job_description(client):
    response = client.post(
        "/api/analyze",
        files={"resume": ("resume.txt", b"Python FastAPI project with enough content.", "text/plain")},
        data={"job_description": ""},
    )

    assert response.status_code == 400
    assert "Job description" in response.json()["detail"]


def test_analyze_rejects_unsupported_file_type(client):
    response = client.post(
        "/api/analyze",
        files={"resume": ("resume.docx", b"not supported", "application/octet-stream")},
        data={"job_description": "Python FastAPI"},
    )

    assert response.status_code == 400
    assert "PDF and TXT" in response.json()["detail"]


def test_analyze_rejects_corrupted_pdf(client):
    response = client.post(
        "/api/analyze",
        files={"resume": ("resume.pdf", b"this is not a real pdf", "application/pdf")},
        data={"job_description": "Python FastAPI"},
    )

    assert response.status_code == 400
    assert "Could not read PDF" in response.json()["detail"]
