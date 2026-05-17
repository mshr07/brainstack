# AI Resume Analyzer

AI Resume Analyzer is an end-to-end resume project for college students who know Python basics and want a strong, interview-ready full-stack project.

The app accepts a resume file and a job description, extracts text, cleans it, identifies skills, compares resume content with the job description, calculates a transparent match score, stores the result in PostgreSQL, and saves embeddings with pgvector for semantic search.

## Why This Project Is Useful For Resumes

This project shows practical backend engineering, not only model usage. It demonstrates file upload handling, REST APIs, SQLAlchemy ORM, PostgreSQL, pgvector, Pydantic schemas, service-layer architecture, text processing, scoring logic, tests, and a simple frontend.

Students can explain both beginner logic and advanced AI logic:

- Beginner: extract text, clean strings, use regex, compare Python sets.
- Intermediate: store analysis history in PostgreSQL using SQLAlchemy.
- Advanced: create embeddings, compare semantic similarity, and store vectors with pgvector.

## Architecture Diagram

```text
frontend/
  index.html + app.js
        |
        | multipart/form-data
        v
backend/app/main.py
        |
        v
backend/app/api/routes.py
        |
        +--> services/resume_parser.py
        +--> services/text_cleaner.py
        +--> services/skill_extractor.py
        +--> services/semantic_matcher.py
        +--> services/scoring_engine.py
        +--> services/suggestion_engine.py
        +--> services/pgvector_service.py
        |
        v
backend/app/models/analysis.py
        |
        v
PostgreSQL + pgvector
```

## Tech Stack

- FastAPI: modern Python API framework with automatic Swagger docs.
- Pydantic: validates request and response data.
- SQLAlchemy: ORM layer for database models and queries.
- PostgreSQL: reliable relational database for analysis history.
- pgvector: PostgreSQL extension for storing and searching embeddings.
- Regex and Python sets: beginner-friendly NLP and skill matching.
- Optional sentence-transformers: advanced transformer embeddings.
- Simple HTML frontend: easy to run without a build step.
- Pytest: unit tests and API tests.
- Docker Compose: starts PostgreSQL with pgvector and the backend.

## Important Note About pgvector And FAISS

The original project idea often uses FAISS, but this implementation uses pgvector because it keeps vector embeddings inside PostgreSQL beside the analysis rows. That makes the architecture easier for students to explain and deploy.

FAISS is excellent for high-performance in-memory vector search. pgvector is better here because it combines relational data and vector search in one database.

The file `backend/app/services/faiss_service.py` is included only as an educational comparison. The production vector database service is `backend/app/services/pgvector_service.py`.

## Folder Structure

```text
ai_resume_analyzer/
  .env.example
  docker-compose.yml
  README.md
  frontend/
    index.html
    styles.css
    app.js
  backend/
    Dockerfile
    requirements.txt
    sample_data/
      sample_resume.txt
      sample_job_description.txt
    app/
      main.py
      api/routes.py
      core/
      database/
      models/
      schemas/
      services/
      utils/
      tests/
```

## Setup Instructions

From the workspace folder:

```bash
cd ai_resume_analyzer/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create your environment file:

```bash
cp ../.env.example .env
```

For local PostgreSQL, create a database named `ai_resume_analyzer` and enable pgvector:

```sql
CREATE DATABASE ai_resume_analyzer;
\c ai_resume_analyzer
CREATE EXTENSION IF NOT EXISTS vector;
```

## Run With Docker

From `ai_resume_analyzer/`:

```bash
docker compose up --build
```

Backend:

```text
http://127.0.0.1:8002
```

Swagger docs:

```text
http://127.0.0.1:8002/docs
```

## Run Backend Without Docker

From `ai_resume_analyzer/backend`:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 8002
```

## Run Frontend

Open `frontend/index.html` in a browser, or serve it with Python:

```bash
cd ai_resume_analyzer/frontend
python3 -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500
```

## API Documentation

FastAPI creates Swagger automatically:

```text
GET http://127.0.0.1:8002/docs
```

Endpoints:

- `GET /` - health check
- `POST /api/analyze` - upload resume and job description
- `GET /api/analyses` - list previous analyses
- `GET /api/analyses/{id}` - get one analysis
- `DELETE /api/analyses/{id}` - delete an analysis

Example response:

```json
{
  "id": 1,
  "resume_filename": "resume.txt",
  "match_score": 78,
  "matched_skills": ["Python", "SQL", "FastAPI"],
  "missing_skills": ["Docker", "AWS", "PostgreSQL"],
  "semantic_similarity": 0.82,
  "weak_areas": ["Education/certification relevance"],
  "suggestions": [
    "Add Docker experience if you have used it, preferably with a project or measurable result."
  ],
  "score_breakdown": {
    "skill_match": 75,
    "semantic_similarity": 82,
    "experience_relevance": 80,
    "education_relevance": 50,
    "formatting_completeness": 100,
    "final_score": 78
  },
  "created_at": "2026-05-17T10:00:00"
}
```

## Database Schema

Table: `analyses`

- `id`: primary key
- `resume_filename`: uploaded filename
- `resume_text`: cleaned resume text
- `job_description`: cleaned job description
- `match_score`: final integer score
- `semantic_similarity`: cosine similarity between resume and JD embeddings
- `matched_skills`: JSON list
- `missing_skills`: JSON list
- `weak_areas`: JSON list
- `suggestions`: JSON list
- `score_breakdown`: JSON object with component scores
- `embedding`: pgvector vector column in PostgreSQL
- `created_at`: timestamp

## Basic Version Explanation

The basic version is easy to understand:

1. Read a TXT or PDF resume.
2. Clean whitespace and symbols.
3. Extract known skills using regex aliases.
4. Extract job description skills.
5. Compare both skill sets.
6. Calculate a skill match score.

This teaches strings, regex, lists, sets, dictionaries, functions, and JSON responses.

## Intermediate Version Explanation

The intermediate version adds backend engineering:

1. FastAPI endpoints.
2. Pydantic response models.
3. SQLAlchemy ORM models.
4. PostgreSQL persistence.
5. API error handling.
6. Unit and API tests.

This teaches API design, database integration, clean code, and testing.

## Advanced AI Version Explanation

The advanced version adds semantic matching:

1. Convert resume text into an embedding vector.
2. Convert job description text into another embedding vector.
3. Compare vectors using cosine similarity.
4. Store resume embeddings in PostgreSQL using pgvector.
5. Use pgvector similarity search for future recommendations.

By default, the project uses deterministic hashing embeddings so it runs on normal laptops. To use transformer embeddings, install `sentence-transformers` and set:

```bash
USE_TRANSFORMERS=true
```

## Scoring Logic

Final score is configurable in `.env`:

```text
40% skill keyword match
25% semantic similarity
15% experience relevance
10% education/certification relevance
10% formatting/completeness
```

The scoring code is in:

```text
backend/app/services/scoring_engine.py
```

This transparency is important in interviews because you can explain exactly how the score is calculated.

## Error Handling

The API handles:

- Empty job descriptions
- Empty resumes
- Unsupported file types
- Corrupted PDFs
- Very short resumes
- Very large resumes
- No matched skills
- Missing database connection

Expected user errors return `400`. Missing database errors return `503`.

## Testing

Run tests from `ai_resume_analyzer/backend`:

```bash
source .venv/bin/activate
pytest -q
```

Tests cover:

- Text cleaning
- Skill extraction
- Scoring logic
- `POST /api/analyze`
- `GET /api/analyses`
- `GET /api/analyses/{id}`
- `DELETE /api/analyses/{id}`

The tests use SQLite so students can run them without PostgreSQL. Production uses PostgreSQL and pgvector.

## How To Explain This Project In An Interview

"I built an AI Resume Analyzer using FastAPI, PostgreSQL, SQLAlchemy, Pydantic, NLP-style text processing, and pgvector. The system accepts a resume and job description, extracts text, cleans it, identifies skills, compares them using both keyword matching and semantic similarity, calculates a weighted match score, and generates improvement suggestions. I designed the backend using a service-based architecture so parsing, scoring, skill extraction, semantic matching, and database logic are separated and maintainable."

## Common Interview Questions And Answers

### Explain your project architecture.

The frontend sends a resume and job description to FastAPI. The API route calls service classes for parsing, cleaning, skill extraction, semantic matching, scoring, and suggestions. SQLAlchemy stores the final analysis in PostgreSQL. pgvector stores embeddings for vector search.

### How is resume text extracted?

TXT files are decoded directly. PDF files are parsed with `pypdf`. If the PDF is scanned and contains no embedded text, the API returns a clear error. OCR can be added later.

### How do you calculate the score?

The score is weighted: skill match, semantic similarity, experience relevance, education relevance, and formatting completeness. The weights are environment variables, so the system can be tuned without rewriting code.

### What is pgvector?

pgvector is a PostgreSQL extension that stores embedding vectors and supports similarity search. It lets the app keep normal relational data and AI vectors in the same database.

### What is FAISS?

FAISS is a vector search library built for fast similarity search, especially at large scale. This project uses pgvector instead because it is easier to deploy with PostgreSQL and simpler for students to explain.

### Why use embeddings?

Keyword matching only finds exact terms. Embeddings convert text into numeric vectors so similar meanings can be compared even when words are different.

### What is the difference between keyword matching and semantic similarity?

Keyword matching checks exact skills like `Python` or `Docker`. Semantic similarity checks whether the resume and job description are similar in meaning.

### How would you improve this system?

Add OCR for scanned PDFs, a larger skill taxonomy, transformer embeddings by default, user accounts, resume section detection, recruiter feedback data, and better job-role-specific scoring.

### How would you scale this project?

Use background jobs for large files, store resumes in object storage, cache embeddings, add indexes to pgvector, split services into workers, and deploy behind a load balancer.

### What edge cases did you handle?

Empty files, unsupported formats, corrupted PDFs, empty job descriptions, very short resumes, large files, no matched skills, and database failures.

### What are the limitations?

The default embedding fallback is not as accurate as a transformer model. Skill extraction uses a fixed skill dictionary. PDF extraction does not handle scanned resumes unless OCR is added.

## Future Improvements

- Add user authentication with real JWT library.
- Add OCR using Tesseract or a cloud OCR service.
- Add role-specific scoring templates.
- Add pgvector indexes for faster search.
- Add recruiter feedback to improve scoring.
- Add resume rewrite suggestions using an LLM.
- Add deployment to Render, Railway, AWS, or GCP.

