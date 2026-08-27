# Phase 5 - Production Ready Structure

## New Topic

Clean architecture, modular services, environment variables, tests, and
deployment-ready structure.

## What Works In This Phase

- Upload TXT/PDF resume
- Paste job description
- Keyword matching
- Semantic matching
- Weighted score
- Database history
- pgvector-ready embedding storage
- Service-based backend structure
- Unit/API tests
- Simple frontend

## Run Backend

```bash
cd ai_resume_analyzer_phases/phase_05_production_ready/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8015
```

## Run Frontend

```bash
cd ai_resume_analyzer_phases/phase_05_production_ready/frontend
python3 -m http.server 5515
```

Open `http://127.0.0.1:5515`.

## Run Tests

```bash
cd ai_resume_analyzer_phases/phase_05_production_ready/backend
pytest -q
```

## What Students Should Explain

"Phase 5 uses clean architecture. API routes only handle HTTP concerns. Services
do the business logic: parsing, cleaning, skill extraction, semantic matching,
scoring, and suggestions. SQLAlchemy models handle persistence. Pydantic schemas
control the JSON shape. This separation makes the project easier to test,
extend, and defend in interviews."

