# AI Resume Analyzer - Phase Wise Learning Version

This folder contains six separate, runnable versions of the AI Resume Analyzer.
Each phase adds one important system or topic while keeping the app in a working
state.

## Phase Map

```text
phase_01_keyword_api
  Topic: FastAPI basics, JSON APIs, text cleaning, skill extraction, scoring

phase_02_upload_frontend
  Topic: File upload, PDF/TXT parsing, simple HTML frontend

phase_03_database_history
  Topic: SQLAlchemy ORM, database models, analysis history APIs

phase_04_semantic_pgvector
  Topic: embeddings, semantic similarity, pgvector-ready vector storage

phase_05_production_ready
  Topic: clean architecture, modular services, tests, Docker-ready structure

phase_06_ai_integration
  Topic: OpenAI API integration, AI-generated recommendations, interview kit
```

## Recommended Learning Flow

1. Run Phase 1 and understand the scoring logic.
2. Run Phase 2 and learn multipart file upload plus frontend-to-backend calls.
3. Run Phase 3 and inspect how analysis history is stored in a database.
4. Run Phase 4 and explain keyword matching vs semantic matching.
5. Run Phase 5 and use it as the interview-ready version.
6. Run Phase 6 and explain how deterministic scoring is combined with AI coaching.

Each backend runs from its own `backend/` folder:

```bash
cd phase_01_keyword_api/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8011
```

Use ports `8011` to `8015` for phases 1 to 5.
Use port `8016` for Phase 6.

## Shared Samples

Use:

- `shared_samples/sample_resume.txt`
- `shared_samples/sample_job_description.txt`

These can be uploaded or pasted into any phase.

## 20-Day Project Diary Plan

Use this section as a daily project diary. At the end of each day, students
should write what they built, what they learned, what problem they faced, and
how they solved it. This helps during interviews because you can explain the
project as a real learning journey, not just as final code.

| Day | What You Did | What To Write In Your Diary | Interview Takeaway |
| --- | --- | --- | --- |
| 1 | Understood the project idea and problem statement. | I studied how resumes and job descriptions can be compared using skills, keywords, and AI. | I can explain the real-world problem: students need resume feedback for specific jobs. |
| 2 | Created the first FastAPI app in Phase 1. | I built a basic backend with `GET /` and `POST /api/analyze`. | I learned how FastAPI exposes REST endpoints and Swagger docs. |
| 3 | Added text cleaning and skill extraction. | I used Python string processing, regex, lists, sets, and dictionaries to find skills. | I can explain beginner-friendly NLP without depending on AI first. |
| 4 | Built basic keyword matching and match score. | I compared resume skills with JD skills and calculated missing and matched skills. | I can explain the first scoring formula clearly. |
| 5 | Added resume file upload in Phase 2. | I learned multipart form upload and handled TXT/PDF resumes. | I can explain how file upload works in FastAPI. |
| 6 | Added PDF and TXT text extraction. | I parsed TXT directly and used PDF parsing for uploaded resumes. | I can discuss edge cases like empty files, unsupported files, and scanned PDFs. |
| 7 | Built the simple frontend for Phase 2. | I created an HTML/CSS/JS UI to upload a resume and paste a JD. | I can explain how frontend `fetch` sends data to the backend. |
| 8 | Connected frontend and backend. | I tested the complete user flow from browser to API response. | I understand CORS, API URLs, and multipart requests. |
| 9 | Added SQLAlchemy in Phase 3. | I created a database model for saving analysis history. | I can explain ORM, tables, rows, and why SQLAlchemy is useful. |
| 10 | Added analysis history APIs. | I built list, get, and delete endpoints for saved analyses. | I can explain CRUD APIs and why history improves the project. |
| 11 | Added semantic similarity in Phase 4. | I learned that embeddings compare meaning, not only exact keywords. | I can explain keyword matching vs semantic similarity. |
| 12 | Added vector storage concept with pgvector. | I learned how embeddings can be stored in PostgreSQL using pgvector. | I can explain why pgvector is useful for AI applications. |
| 13 | Added weighted scoring. | I combined skill score, semantic score, experience relevance, and formatting score. | I can defend why the scoring system is transparent and configurable. |
| 14 | Refactored into clean architecture in Phase 5. | I separated API routes, services, schemas, models, database, and tests. | I can explain maintainable backend architecture. |
| 15 | Added unit tests and API tests. | I tested text cleaning, skill extraction, scoring, and API flows. | I can explain how tests protect the project from regressions. |
| 16 | Added Docker-ready structure. | I prepared the project for deployment with Docker and environment variables. | I can explain deployment preparation and config management. |
| 17 | Added OpenAI integration in Phase 6. | I connected the backend to OpenAI to generate interview-focused guidance. | I can explain how deterministic scoring and AI coaching work together. |
| 18 | Added structured AI output. | I used Pydantic schemas so OpenAI responses have predictable fields. | I can explain why structured output is better than plain text responses. |
| 19 | Added AI quality checks. | I improved the prompt and added checks to avoid generic, malformed, or overclaiming responses. | I can explain prompt engineering, grounding, and limitations. |
| 20 | Final review and interview preparation. | I reviewed all phases, tested the app, and practiced explaining the project. | I can present the project confidently from basic version to advanced AI version. |

### Daily Diary Template

Copy this template after each day:

```text
Day:
Today I worked on:
Files or modules changed:
Concepts learned:
Problem faced:
How I solved it:
What I can explain in an interview:
Next improvement:
```

## Key Focus Areas Of The Project

- FastAPI backend development
- REST API design
- Resume upload and file handling
- PDF/TXT text extraction
- Text cleaning and normalization
- Regex-based skill extraction
- Skill matching using sets
- Transparent scoring logic
- SQLAlchemy ORM and database storage
- PostgreSQL and pgvector concepts
- Embeddings and semantic similarity
- Clean layered architecture
- Frontend-to-backend integration
- Error handling and validation
- Unit and API testing
- OpenAI API integration
- Structured AI output using Pydantic
- Interview preparation and AI-generated coaching
- Deployment-ready thinking with environment variables and Docker

## How To Explain This Project In An Interview

### Short Version

"I built an AI Resume Analyzer that compares a student's resume with a job
description. It extracts resume text, cleans it, identifies skills, compares
matched and missing skills, calculates a weighted match score, stores analysis
history, and uses OpenAI to generate personalized resume suggestions and
interview preparation guidance."

### Detailed Version

"The project is built in six phases. First, I created a basic FastAPI API that
uses keyword matching to compare resume text with a job description. Then I
added resume upload support for TXT and PDF files and created a simple frontend.
After that, I added SQLAlchemy database storage for analysis history. In the
advanced phase, I added embeddings and semantic similarity so the system can
compare meaning, not only exact keywords. Then I refactored the app into a clean
architecture with routes, services, schemas, models, database code, and tests.
Finally, I integrated the OpenAI API to generate resume recommendations,
interview questions, answer strategies, a study plan, and a recruiter pitch."

### Strong Project Pitch

"This project is useful because it combines backend engineering and AI in a
practical student-focused use case. The deterministic part gives transparent
scores and skill gaps, while OpenAI generates personalized coaching. I designed
it phase by phase so each feature is understandable and testable."

## Architecture Explanation

```text
Frontend
  - Upload resume
  - Paste job description
  - Display score, skills, suggestions, and interview kit

FastAPI Backend
  - API routes receive requests
  - Services handle parsing, cleaning, extraction, scoring, semantic matching,
    and AI coaching
  - Pydantic schemas define clean request/response data

Database
  - SQLAlchemy stores analysis history
  - PostgreSQL/pgvector can store embeddings for vector search

OpenAI Integration
  - Sends cleaned resume, JD, matched skills, missing skills, and score
    breakdown
  - Receives structured AI output for suggestions and interview preparation
```

## Important Interview Questions And Answer Points

### 1. Why did you build this project?

I built it to help students improve resumes for specific job descriptions. It
also demonstrates backend development, NLP basics, database integration,
semantic matching, and AI integration.

### 2. Why did you use FastAPI?

FastAPI is fast, beginner-friendly, supports automatic Swagger docs, uses
Pydantic validation, and is suitable for building REST APIs quickly.

### 3. How does resume text extraction work?

TXT files are decoded directly. PDF files are parsed using a PDF reader. The
extracted text is cleaned before skill extraction and scoring.

### 4. How do you extract skills?

The project uses a dictionary of skill aliases and regex matching. For example,
`postgres`, `postgresql`, and `pgvector` can map to PostgreSQL-related skills.

### 5. How do you calculate matched and missing skills?

The resume skills and job-description skills are converted into sets. The
intersection gives matched skills, and the JD skills minus resume skills gives
missing skills.

### 6. How is the match score calculated?

The score is weighted. It combines skill keyword match, semantic similarity,
experience relevance, and formatting completeness. This makes the score more
transparent than a black-box AI answer.

### 7. What is semantic similarity?

Semantic similarity compares the meaning of two pieces of text using vectors.
It helps identify similarity even when the exact same words are not used.

### 8. What are embeddings?

Embeddings are numeric vector representations of text. Similar texts have
vectors that are closer together.

### 9. Why use pgvector?

pgvector lets PostgreSQL store and search vector embeddings. This is useful
when an AI app needs both normal relational data and vector similarity search.

### 10. Why use SQLAlchemy?

SQLAlchemy lets Python code interact with the database using models instead of
raw SQL everywhere. It keeps the code cleaner and easier to maintain.

### 11. What is clean architecture in this project?

The project separates responsibilities. API routes handle HTTP, services handle
business logic, schemas handle validation, models handle database structure, and
tests verify behavior.

### 12. How does OpenAI fit into the project?

OpenAI generates human-facing guidance such as resume recommendations,
interview questions, answer strategies, study plan, and recruiter pitch. The
backend provides structured facts so the AI response stays grounded.

### 13. Why use structured AI output?

Structured output ensures the AI response follows a predictable schema. This
makes it easier to store in the database and display in the frontend.

### 14. How do you avoid hallucinations?

The prompt tells the model not to invent experience. Missing skills must be
framed as learning gaps. The app also includes quality checks for malformed or
ungrounded output.

### 15. What edge cases did you handle?

Empty resumes, unsupported files, corrupted PDFs, short resumes, empty job
descriptions, missing OpenAI keys, OpenAI quota errors, missing database
records, and invalid analysis IDs.

### 16. How would you scale this project?

I would add user accounts, background jobs for large resumes, object storage
for files, pgvector indexes, caching for embeddings, better skill taxonomies,
and deployment on cloud infrastructure.

### 17. What are the limitations?

PDF parsing may fail for scanned PDFs without OCR. Skill extraction depends on
the skill dictionary. AI output quality depends on the prompt, model, and input
quality.

### 18. How can accuracy be improved?

Use a larger skill database, add section detection, use stronger embeddings,
collect recruiter feedback, add OCR, and evaluate AI outputs against real job
outcomes.

### 19. How did you test the project?

I added unit tests for services and API tests for the full analyze, history,
get, and delete flow. In Phase 6, OpenAI calls are mocked during tests to avoid
spending credits.

### 20. What is the most important technical decision?

Building the project phase by phase was the most important decision. It makes
the project teachable, explainable, and easy to improve.

## What Students Should Emphasize

- The project solves a clear student problem.
- It starts simple and becomes advanced step by step.
- It includes both deterministic logic and AI-generated guidance.
- The score is explainable, not just an AI guess.
- The backend is modular and testable.
- The OpenAI integration is structured and grounded.
- The project can be extended with authentication, OCR, cloud deployment, and
  better recommendation logic.

## Final Interview Closing Statement

"The main thing I learned from this project is how to turn a real-world problem
into a full-stack AI application. I started with simple Python logic, then added
APIs, file upload, frontend, database storage, semantic similarity, tests, and
OpenAI integration. Because I built it phase by phase, I can explain every part:
what it does, why it exists, and how I would improve it."
