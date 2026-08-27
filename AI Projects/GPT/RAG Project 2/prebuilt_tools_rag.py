"""Backyard Astronomy RAG implemented with prebuilt tools only.

The nine labeled sections mirror the original learning phases:

1. LangChain DirectoryLoader + TextLoader
2. tiktoken + RecursiveCharacterTextSplitter
3. LangChain OpenAIEmbeddings
4. Chroma persistent vector store
5. Chroma or scikit-learn retrieval
6. LangChain PromptTemplate
7. LangChain ChatOpenAI using the Responses API
8. Local metadata citations or OpenAI File Search native citations
9. Ragas ID-based context recall and precision"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
from contextlib import ExitStack
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parent
KNOWLEDGE_DIR = PROJECT_ROOT / "knowledge"
STORAGE_DIR = PROJECT_ROOT / "storage_prebuilt"
CHROMA_DIR = STORAGE_DIR / "chroma"
INDEX_STATE_FILE = STORAGE_DIR / "local_index.json"
MANAGED_STATE_FILE = STORAGE_DIR / "openai_vector_store.json"

EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-5.6-terra")
TOKEN_ENCODING = "cl100k_base"
COLLECTION_NAME = "backyard_astronomy"
CHUNK_SIZE = 100
CHUNK_OVERLAP = 20
DEFAULT_TOP_K = 3

EVALUATION_CASES = [
    {
        "question": "Why are shadows near the lunar terminator helpful?",
        "expected_source": "moon_observing.md",
    },
    {
        "question": "What might I see around Jupiter with binoculars?",
        "expected_source": "planets.md",
    },
    {
        "question": "How can averted vision help with a faint galaxy?",
        "expected_source": "deep_sky.md",
    },
    {
        "question": "Is it safe to point unfiltered binoculars at the Sun?",
        "expected_source": "equipment_and_safety.txt",
    },
]

INSTALL_COMMAND = "python3 -m pip install -r requirements-prebuilt.txt"


@dataclass(frozen=True)
class RetrievedDocument:

    document: Any
    score: float
    score_label: str


def require_api_key() -> None:

    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("Set OPENAI_API_KEY before using an API-backed command.")


def relative_source(source: str) -> str:

    source_path = Path(source).resolve()
    try:
        return source_path.relative_to(KNOWLEDGE_DIR.resolve()).as_posix()
    except ValueError:
        return source_path.name


# ---------------------------------------------------------------------------
# PHASE 1 — PREBUILT INGESTION
# ---------------------------------------------------------------------------
def load_documents() -> list[Any]:

    from langchain_community.document_loaders import DirectoryLoader, TextLoader

    if not KNOWLEDGE_DIR.exists():
        raise FileNotFoundError(
            f"Knowledge folder not found: {KNOWLEDGE_DIR}\n"
            "Create it and add .md or .txt files."
        )

    loader = DirectoryLoader(
        str(KNOWLEDGE_DIR),
        glob=["**/*.md", "**/*.txt"],
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8", "autodetect_encoding": True},
        recursive=True,
        silent_errors=False,
    )
    documents = loader.load()

    for document in documents:
        document.metadata["source"] = relative_source(document.metadata["source"])

    documents.sort(key=lambda document: document.metadata["source"])
    if not documents:
        raise ValueError(f"No .md or .txt files found in {KNOWLEDGE_DIR}")
    return documents


# ---------------------------------------------------------------------------
# PHASE 2 — PREBUILT TOKENIZATION AND CHUNKING
# ---------------------------------------------------------------------------
def split_documents(documents: list[Any]) -> list[Any]:

    import tiktoken
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    tokenizer = tiktoken.get_encoding(TOKEN_ENCODING)
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        encoding_name=TOKEN_ENCODING,
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        add_start_index=True,
    )
    chunks = splitter.split_documents(documents)

    source_counts: dict[str, int] = {}
    for chunk in chunks:
        source = chunk.metadata["source"]
        source_counts[source] = source_counts.get(source, 0) + 1
        chunk.metadata["chunk_id"] = f"{source}::chunk-{source_counts[source]}"
        chunk.metadata["token_count"] = len(tokenizer.encode(chunk.page_content))

    return chunks


# ---------------------------------------------------------------------------
# PHASE 3 — PREBUILT EMBEDDINGS
# ---------------------------------------------------------------------------
def create_embedding_model() -> Any:

    from langchain_openai import OpenAIEmbeddings

    return OpenAIEmbeddings(model=EMBEDDING_MODEL)


def chunk_id(chunk: Any) -> str:

    identity = "\0".join(
        [
            chunk.metadata["source"],
            str(chunk.metadata.get("start_index", 0)),
            chunk.page_content,
        ]
    )
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def corpus_fingerprint(chunks: list[Any]) -> str:


    pieces = [
        EMBEDDING_MODEL,
        TOKEN_ENCODING,
        str(CHUNK_SIZE),
        str(CHUNK_OVERLAP),
        *[f"{chunk_id(chunk)}\0{chunk.page_content}" for chunk in chunks],
    ]
    return hashlib.sha256("\n".join(pieces).encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# PHASE 4 — PREBUILT PERSISTENT VECTOR STORE
# ---------------------------------------------------------------------------
def get_or_build_vector_store(rebuild: bool = False) -> tuple[Any, Any, list[Any], str]:

    from langchain_chroma import Chroma

    require_api_key()
    documents = load_documents()
    chunks = split_documents(documents)
    fingerprint = corpus_fingerprint(chunks)
    embeddings = create_embedding_model()
    vector_store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(CHROMA_DIR),
    )

    saved_state = {}
    if INDEX_STATE_FILE.exists():
        saved_state = json.loads(INDEX_STATE_FILE.read_text(encoding="utf-8"))

    should_build = rebuild or saved_state.get("fingerprint") != fingerprint
    if should_build:
        vector_store.reset_collection()
        vector_store.add_documents(
            documents=chunks,
            ids=[chunk_id(chunk) for chunk in chunks],
        )
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        INDEX_STATE_FILE.write_text(
            json.dumps(
                {
                    "fingerprint": fingerprint,
                    "embedding_model": EMBEDDING_MODEL,
                    "chunk_count": len(chunks),
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        action = "built"
    else:
        action = "loaded"

    return vector_store, embeddings, chunks, action


# ---------------------------------------------------------------------------
# PHASE 5 — PREBUILT RETRIEVAL
# ---------------------------------------------------------------------------
def retrieve_with_chroma(
    question: str, vector_store: Any, top_k: int
) -> list[RetrievedDocument]:

    results = vector_store.similarity_search_with_score(question, k=top_k)
    return [
        RetrievedDocument(document=document, score=float(distance), score_label="distance")
        for document, distance in results
    ]


def retrieve_with_sklearn(
    question: str, vector_store: Any, embeddings: Any, top_k: int
) -> list[RetrievedDocument]:

    from langchain_core.documents import Document
    from sklearn.metrics.pairwise import cosine_similarity

    stored = vector_store.get(include=["embeddings", "documents", "metadatas"])
    stored_embeddings = stored.get("embeddings")
    stored_documents = stored.get("documents")
    stored_metadatas = stored.get("metadatas")

    if stored_embeddings is None or len(stored_embeddings) == 0:
        return []

    question_vector = embeddings.embed_query(question)
    similarities = cosine_similarity([question_vector], stored_embeddings)[0]
    best_positions = similarities.argsort()[::-1][:top_k]

    return [
        RetrievedDocument(
            document=Document(
                page_content=stored_documents[position],
                metadata=stored_metadatas[position],
            ),
            score=float(similarities[position]),
            score_label="cosine similarity",
        )
        for position in best_positions
    ]


def retrieve(
    question: str,
    vector_store: Any,
    embeddings: Any,
    top_k: int,
    retriever_name: str,
) -> list[RetrievedDocument]:

    if retriever_name == "sklearn":
        return retrieve_with_sklearn(question, vector_store, embeddings, top_k)
    return retrieve_with_chroma(question, vector_store, top_k)


# ---------------------------------------------------------------------------
# PHASE 6 — PREBUILT PROMPT AUGMENTATION
# ---------------------------------------------------------------------------
def create_prompt_template() -> Any:

    from langchain_core.prompts import PromptTemplate

    return PromptTemplate.from_template(
        """You are a careful backyard astronomy guide.

Answer the question using only the supplied context.
- If the context is insufficient, say that you do not have enough information.
- Do not add facts from memory.
- Keep the answer clear and concise.
- Cite supporting chunks in square brackets, for example [planets.md::chunk-1].

CONTEXT
{context}

QUESTION
{question}

ANSWER
"""
    )


def format_context(results: list[RetrievedDocument]) -> str:

    return "\n\n---\n\n".join(
        f"SOURCE [{result.document.metadata['chunk_id']}]\n"
        f"{result.document.page_content}"
        for result in results
    )


# ---------------------------------------------------------------------------
# PHASE 7 — PREBUILT GENERATION
# ---------------------------------------------------------------------------
def create_chat_model() -> Any:

    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=CHAT_MODEL,
        use_responses_api=True,
        reasoning={"effort": "none"},
    )


def answer_question(
    question: str, top_k: int, retriever_name: str, rebuild: bool
) -> str:

    vector_store, embeddings, _, index_action = get_or_build_vector_store(rebuild)
    results = retrieve(question, vector_store, embeddings, top_k, retriever_name)
    if not results:
        return "No knowledge chunks were retrieved."

    prompt = create_prompt_template()
    chat_model = create_chat_model()
    rag_chain = prompt | chat_model
    response = rag_chain.invoke(
        {"context": format_context(results), "question": question}
    )

    # Phase 8 local citation list: Chroma preserves LangChain document metadata.
    source_lines = []
    seen = set()
    for result in results:
        label = result.document.metadata["chunk_id"]
        if label not in seen:
            source_lines.append(
                f"- [{label}] — {result.score_label} {result.score:.3f}"
            )
            seen.add(label)

    header = f"Model: {CHAT_MODEL} | Index: {index_action} | Retriever: {retriever_name}"
    return f"{header}\n\n{response.text.strip()}\n\nRetrieved sources\n" + "\n".join(
        source_lines
    )


# ---------------------------------------------------------------------------
# PHASE 8 — PREBUILT OPENAI FILE SEARCH AND NATIVE CITATIONS
# ---------------------------------------------------------------------------
def source_paths_from_loader() -> list[Path]:

    documents = load_documents()
    paths = {KNOWLEDGE_DIR / document.metadata["source"] for document in documents}
    return sorted(paths)


def raw_source_fingerprint(paths: list[Path]) -> str:

    digest = hashlib.sha256()
    for path in paths:
        digest.update(path.relative_to(KNOWLEDGE_DIR).as_posix().encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def create_managed_index(create_new: bool) -> str:

    from openai import OpenAI

    require_api_key()
    paths = source_paths_from_loader()
    fingerprint = raw_source_fingerprint(paths)

    if MANAGED_STATE_FILE.exists() and not create_new:
        state = json.loads(MANAGED_STATE_FILE.read_text(encoding="utf-8"))
        if state.get("fingerprint") == fingerprint:
            return f"Reusing managed vector store: {state['vector_store_id']}"
        raise RuntimeError(
            "Knowledge changed after the managed index was created. "
            "Run managed-index --new to create a replacement."
        )

    client = OpenAI()
    vector_store = client.vector_stores.create(name="Backyard Astronomy Guide")
    with ExitStack() as stack:
        file_streams = [stack.enter_context(path.open("rb")) for path in paths]
        batch = client.vector_stores.file_batches.upload_and_poll(
            vector_store_id=vector_store.id,
            files=file_streams,
        )

    if batch.status != "completed":
        raise RuntimeError(f"Managed indexing ended with status: {batch.status}")

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    MANAGED_STATE_FILE.write_text(
        json.dumps(
            {
                "vector_store_id": vector_store.id,
                "fingerprint": fingerprint,
                "files": [path.name for path in paths],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return f"Created managed vector store: {vector_store.id}"


def managed_answer(question: str, top_k: int) -> str:

    from openai import OpenAI

    require_api_key()
    if not MANAGED_STATE_FILE.exists():
        raise RuntimeError("Run managed-index before managed-ask.")

    state = json.loads(MANAGED_STATE_FILE.read_text(encoding="utf-8"))
    client = OpenAI()
    response = client.responses.create(
        model=CHAT_MODEL,
        reasoning={"effort": "none"},
        instructions=(
            "You are a careful backyard astronomy guide. Answer only from files "
            "returned by file search. If evidence is insufficient, say so."
        ),
        input=question,
        tools=[
            {
                "type": "file_search",
                "vector_store_ids": [state["vector_store_id"]],
                "max_num_results": top_k,
            }
        ],
        include=["file_search_call.results"],
    )

    citations = []
    seen = set()
    for output_item in response.output:
        if getattr(output_item, "type", None) != "message":
            continue
        for content_item in getattr(output_item, "content", []):
            for annotation in getattr(content_item, "annotations", []):
                if getattr(annotation, "type", None) != "file_citation":
                    continue
                filename = getattr(annotation, "filename", "unknown file")
                file_id = getattr(annotation, "file_id", "unknown id")
                label = f"{filename} ({file_id})"
                if label not in seen:
                    citations.append(f"- {label}")
                    seen.add(label)

    source_text = "\n".join(citations) if citations else "- No citation annotations returned"
    return f"{response.output_text.strip()}\n\nNative File Search citations\n{source_text}"


# ---------------------------------------------------------------------------
# PHASE 9 — PREBUILT RAGAS RETRIEVAL EVALUATION
# ---------------------------------------------------------------------------
async def ragas_scores(retrieved_sources: list[str], expected_source: str) -> tuple[float, float]:

    import warnings

    from ragas import SingleTurnSample

    # Ragas 0.4.3 warns that these classes moved to ``metrics.collections``,
    # but that module does not actually export the ID-based metrics yet. Keep
    # using Ragas' public working import and hide only that incorrect warning.
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message=r"Importing IDBasedContext.* from 'ragas\.metrics' is deprecated.*",
            category=DeprecationWarning,
        )
        from ragas.metrics import IDBasedContextPrecision, IDBasedContextRecall

    sample = SingleTurnSample(
        retrieved_context_ids=retrieved_sources,
        reference_context_ids=[expected_source],
    )
    recall_result = await IDBasedContextRecall().single_turn_ascore(sample)
    precision_result = await IDBasedContextPrecision().single_turn_ascore(sample)
    recall = float(getattr(recall_result, "value", recall_result))
    precision = float(getattr(precision_result, "value", precision_result))
    return recall, precision


async def evaluate_retrieval(
    top_k: int, retriever_name: str, rebuild: bool
) -> str:

    vector_store, embeddings, _, index_action = get_or_build_vector_store(rebuild)
    report_lines = []
    passes = 0

    for case in EVALUATION_CASES:
        results = retrieve(
            case["question"], vector_store, embeddings, top_k, retriever_name
        )
        retrieved_sources = list(
            dict.fromkeys(result.document.metadata["source"] for result in results)
        )
        recall, precision = await ragas_scores(
            retrieved_sources, case["expected_source"]
        )
        passed = recall == 1.0
        passes += int(passed)
        report_lines.extend(
            [
                f"{'PASS' if passed else 'FAIL'} | {case['question']}",
                f"       expected: {case['expected_source']}",
                f"       retrieved: {', '.join(retrieved_sources)}",
                f"       Ragas ID recall: {recall:.3f} | precision: {precision:.3f}",
                "",
            ]
        )

    report_lines.append(
        f"Top-{top_k} hit rate: {passes}/{len(EVALUATION_CASES)} "
        f"({passes / len(EVALUATION_CASES):.0%})"
    )
    report_lines.append(f"Index: {index_action} | Retriever: {retriever_name}")
    return "\n".join(report_lines)


def inspect_pipeline() -> str:


    documents = load_documents()
    chunks = split_documents(documents)
    lines = [
        f"Knowledge folder: {KNOWLEDGE_DIR}",
        f"Loaded {len(documents)} documents and created {len(chunks)} chunks.",
        "",
    ]
    for chunk in chunks:
        lines.append(
            f"- {chunk.metadata['chunk_id']}: "
            f"{chunk.metadata['token_count']} {TOKEN_ENCODING} tokens"
        )
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Backyard Astronomy RAG built entirely from prebuilt tools."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("inspect", help="load and token-split files without API calls")

    ask_parser = subparsers.add_parser("ask", help="ask the local Chroma RAG")
    ask_parser.add_argument(
        "question",
        nargs="?",
        default="Why is the Moon's terminator useful for observing craters?",
    )
    ask_parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K)
    ask_parser.add_argument("--retriever", choices=["chroma", "sklearn"], default="chroma")
    ask_parser.add_argument("--rebuild", action="store_true")

    evaluate_parser = subparsers.add_parser("evaluate", help="run Ragas retrieval checks")
    evaluate_parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K)
    evaluate_parser.add_argument(
        "--retriever", choices=["chroma", "sklearn"], default="chroma"
    )
    evaluate_parser.add_argument("--rebuild", action="store_true")

    managed_index_parser = subparsers.add_parser(
        "managed-index", help="upload knowledge through code for OpenAI File Search"
    )
    managed_index_parser.add_argument(
        "--new",
        action="store_true",
        help="create a replacement store when knowledge changed",
    )

    managed_ask_parser = subparsers.add_parser(
        "managed-ask", help="ask with OpenAI File Search native citations"
    )
    managed_ask_parser.add_argument(
        "question", nargs="?", default="How should a beginner observe Jupiter?"
    )
    managed_ask_parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K)

    return parser


def validate_top_k(value: int) -> None:
    if value <= 0:
        raise ValueError("--top-k must be positive")


def main() -> None:
    args = build_parser().parse_args()

    try:
        if args.command == "inspect":
            print(inspect_pipeline())
        elif args.command == "ask":
            validate_top_k(args.top_k)
            print(
                answer_question(
                    args.question, args.top_k, args.retriever, args.rebuild
                )
            )
        elif args.command == "evaluate":
            validate_top_k(args.top_k)
            print(
                asyncio.run(
                    evaluate_retrieval(
                        args.top_k, args.retriever, args.rebuild
                    )
                )
            )
        elif args.command == "managed-index":
            print(create_managed_index(args.new))
        elif args.command == "managed-ask":
            validate_top_k(args.top_k)
            print(managed_answer(args.question, args.top_k))
    except ModuleNotFoundError as error:
        raise SystemExit(
            f"Missing package '{error.name}'. Install the prebuilt toolset with:\n"
            f"  {INSTALL_COMMAND}"
        ) from error
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        raise SystemExit(f"Error: {error}") from error


if __name__ == "__main__":
    main()
