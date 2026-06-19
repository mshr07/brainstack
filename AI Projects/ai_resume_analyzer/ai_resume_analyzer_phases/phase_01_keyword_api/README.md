# Phase 1 - Basic Keyword API

## New Topic

FastAPI basics, JSON request/response, text cleaning, skill extraction, and a
simple transparent scoring formula.

## What Works In This Phase

- `GET /`
- `POST /api/analyze`
- No database
- No file upload
- Resume and job description are sent as JSON strings

## Run

```bash
cd ai_resume_analyzer_phases/phase_01_keyword_api/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8011
```

Swagger:

```text
http://127.0.0.1:8011/docs
```

## Try It

```bash
curl -X POST http://127.0.0.1:8011/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"resume_text":"Python SQL FastAPI project","job_description":"Need Python FastAPI Docker"}'
```

