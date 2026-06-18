# Phase 3 - Database History

## New Topic

SQLAlchemy ORM, database tables, and analysis history endpoints.

## What Works In This Phase

- Resume upload and frontend from Phase 2
- SQLite database by default
- Stores every analysis
- `GET /api/analyses`
- `GET /api/analyses/{id}`
- `DELETE /api/analyses/{id}`

## Run Backend

```bash
cd ai_resume_analyzer_phases/phase_03_database_history/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8013
```

## Run Frontend

```bash
cd ai_resume_analyzer_phases/phase_03_database_history/frontend
python3 -m http.server 5513
```

Open `http://127.0.0.1:5513`.

## Database

Default:

```text
sqlite:///./phase3_analyses.db
```

Override with:

```bash
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/resume_db
```

