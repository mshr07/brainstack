# Phase 4 - Semantic Matching And pgvector

## New Topic

Embeddings, cosine similarity, weighted scoring, and pgvector-ready vector
storage.

## What Works In This Phase

- Everything from Phase 3
- Semantic similarity score
- Weighted scoring
- Stores an embedding for each analysis
- Uses SQLite by default for easy local running
- Uses pgvector automatically when `DATABASE_URL` points to PostgreSQL

## Run Backend

```bash
cd ai_resume_analyzer_phases/phase_04_semantic_pgvector/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8014
```

## Run Frontend

```bash
cd ai_resume_analyzer_phases/phase_04_semantic_pgvector/frontend
python3 -m http.server 5514
```

Open `http://127.0.0.1:5514`.

## Use PostgreSQL + pgvector

```bash
createdb ai_resume_phase4
psql -d ai_resume_phase4 -c "CREATE EXTENSION IF NOT EXISTS vector;"
DATABASE_URL=postgresql+psycopg2://your_user@localhost:5432/ai_resume_phase4 \
  uvicorn app.main:app --reload --port 8014
```

## Interview Explanation

Keyword matching finds exact skills. Semantic matching compares meaning by
turning text into vectors and measuring cosine similarity. pgvector stores those
vectors in PostgreSQL so the database can later search similar resumes.

