# Backyard Astronomy RAG — Prebuilt Tools Version

[`prebuilt_tools_rag.py`](./prebuilt_tools_rag.py) recreates the same RAG
application in one file. All source data comes from [`knowledge/`](./knowledge);
there is no front-end upload.

## Tool used for each phase

| Phase | Concept | Prebuilt implementation |
|---|---|---|
| 1 | Folder ingestion | LangChain `DirectoryLoader` and `TextLoader` |
| 2 | Tokenization and chunking | `tiktoken` and `RecursiveCharacterTextSplitter` |
| 3 | Embeddings | LangChain `OpenAIEmbeddings` |
| 4 | Persistent vector store | LangChain Chroma integration |
| 5 | Retrieval | Chroma search or scikit-learn cosine similarity |
| 6 | Augmentation | LangChain `PromptTemplate` |
| 7 | Generation | LangChain `ChatOpenAI` with the Responses API |
| 8 | Citations | Chroma document metadata or OpenAI File Search annotations |
| 9 | Evaluation | Ragas ID-based recall and precision |
| 10 | HTTP API | FastAPI, Pydantic validation, CORS, and Uvicorn |
| 11 | Frontend client | React form, Fetch API, loading states, and response display |

The file still contains a small amount of ordinary Python to connect tools,
handle configuration, display results, and invalidate stale indexes. It does
not implement tokenization, chunking, embedding, vector similarity, prompt
templating, model calls, managed file search, or evaluation metrics itself.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements-prebuilt.txt
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

`langchain-community` is pinned to `0.3.31` because Ragas `0.4.3` currently
imports community modules that were removed from the sunset `0.4.2` package.
The complete dependency set was checked with `pip check`.

## Run the local Chroma RAG

Inspect folder loading and token-aware chunks without an API call:

```bash
python3 prebuilt_tools_rag.py inspect
```

Ask with Chroma's built-in search:

```bash
python3 prebuilt_tools_rag.py ask "Why is the lunar terminator useful?"
```

Use the alternate scikit-learn cosine retriever:

```bash
python3 prebuilt_tools_rag.py ask "What can binoculars show?" --retriever sklearn
```

Run the four retrieval evaluations with Ragas:

```bash
python3 prebuilt_tools_rag.py evaluate
python3 prebuilt_tools_rag.py evaluate --retriever sklearn --top-k 1
```

Chroma data is stored under `storage_prebuilt/`. The source fingerprint causes
an automatic rebuild when files, chunk settings, or the embedding model change.
Use `--rebuild` to force it.

## Optional: OpenAI-managed File Search

This second citation path uploads the files programmatically—still without a
front end—and lets OpenAI perform hosted parsing, indexing, retrieval, and
native citation annotations:

```bash
python3 prebuilt_tools_rag.py managed-index
python3 prebuilt_tools_rag.py managed-ask "How should a beginner observe Jupiter?"
```

If local knowledge changes, `managed-index` asks you to run it with `--new`.
That creates a replacement remote vector store but deliberately does not delete
the old one. Delete unused stores separately after confirming they are no
longer needed.

The implementation follows the current official documentation for
[OpenAI embeddings](https://developers.openai.com/api/docs/guides/embeddings),
[OpenAI File Search](https://developers.openai.com/api/docs/guides/tools-file-search),
[LangChain token splitting](https://docs.langchain.com/oss/python/integrations/splitters/split_by_token),
[LangChain Chroma](https://docs.langchain.com/oss/python/integrations/vectorstores/chroma),
and [Ragas ID-based retrieval metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall/).

## Phase 10: FastAPI for React, Django, or other applications

[`rag_api.py`](./rag_api.py) imports the existing RAG functions. It does not
copy tokenization, embedding, retrieval, or generation logic. Install the API
layer and start its development server:

```bash
python3 -m pip install -r requirements-api.txt
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
python -m uvicorn rag_api:app --reload
```

Open <http://127.0.0.1:8000/docs> to try the generated Swagger interface. The
main local-RAG request is:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Why is the lunar terminator useful?",
    "top_k": 3,
    "retriever": "chroma",
    "rebuild": false
  }'
```

The JSON response contains `question`, `answer`, `mode`, `retriever`, `top_k`,
and `elapsed_ms`. The client sends only a question and settings; source files
continue to come exclusively from the server-side `knowledge/` folder.

### React example

```javascript
const response = await fetch("http://127.0.0.1:8000/api/v1/ask", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "What can binoculars show?",
    top_k: 3,
    retriever: "chroma",
    rebuild: false,
  }),
});

if (!response.ok) throw new Error(`RAG request failed: ${response.status}`);
const data = await response.json();
console.log(data.answer);
```

### Django or ordinary Python example

```python
import requests

response = requests.post(
    "http://127.0.0.1:8000/api/v1/ask",
    json={"question": "How should I observe Jupiter?", "top_k": 3},
    timeout=120,
)
response.raise_for_status()
answer = response.json()["answer"]
```

Browser access is enabled for the usual React ports `3000` and `5173`. Set a
comma-separated environment variable before starting Uvicorn to use other
front-end origins:

```bash
export RAG_ALLOWED_ORIGINS="https://your-react-app.example.com,http://localhost:3000"
```

Other useful routes:

- `GET /api/v1/health` checks files and configuration without making an OpenAI call.
- `POST /api/v1/managed/ask` calls the existing managed File Search pipeline.

Create the managed index once with `python3 prebuilt_tools_rag.py managed-index`
before calling the managed endpoint. Keep `OPENAI_API_KEY` on the FastAPI server;
never place it in React code or send it from a browser. CORS controls which
browsers may call the API, but it is not authentication; add authentication or
place the service behind an authenticated reverse proxy before exposing it
publicly.

## Phase 11: React frontend

The separate [`rag-react-frontend`](./rag-react-frontend) folder contains a
small React page that collects every supported API input and displays the JSON
response. Open that folder in VS Code and follow its [`README.md`](./rag-react-frontend/README.md)
to run it. The frontend defaults to `http://127.0.0.1:8000`, so the FastAPI
backend and React development server can run in separate terminals.
