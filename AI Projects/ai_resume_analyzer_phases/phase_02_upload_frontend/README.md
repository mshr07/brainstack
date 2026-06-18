# Phase 2 - Resume Upload And Frontend

## New Topic

Multipart file upload, PDF/TXT parsing, CORS, and a simple HTML frontend.

## What Works In This Phase

- `GET /`
- `POST /api/analyze`
- Upload `.txt` or `.pdf` resume
- Paste a job description
- Use `frontend/index.html`
- No database yet

## Run Backend

```bash
cd ai_resume_analyzer_phases/phase_02_upload_frontend/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8012
```

## Run Frontend

```bash
cd ai_resume_analyzer_phases/phase_02_upload_frontend/frontend
python3 -m http.server 5512
```

Open:

```text
http://127.0.0.1:5512
```

