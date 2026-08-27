# AI evaluation architecture

## Golden dataset

Versioned JSONL cases use synthetic data and span simple, medium, difficult, and
adversarial questions. A case may specify intent, datasets, columns, metric
version, authorized join edges, SQL AST properties/reference query, answer facts,
citations, tools, approval expectation and prohibited behavior. Cases carry
tenant policy, fixed clock/data snapshot, difficulty, tags and provenance.

Raw feedback never updates prompts or models. Reviewers classify the failure,
remove sensitive content, create a focused golden case, and then require the same
regression gates as any authored case.

## Measures

Deterministic measures are preferred:

- retrieval Precision@K, Recall@K, MRR and citation coverage;
- expected dataset/column/metric-version and join-edge selection;
- SQL parse/validation/execution success, forbidden-operation rate, normalized
  AST properties and execution equivalence on a fixed snapshot;
- tool name/argument correctness, completion/terminal state, steps/repairs;
- answer fact checks where facts are structured;
- end-to-end/provider/retrieval/SQL latency, tokens and estimated cost from traces.

RAGAS/DeepEval adapters may measure context relevance, faithfulness,
groundedness and semantic answer correctness. LLM judges are reserved for
subjective dimensions, use a pinned rubric/model with blinded pair ordering, and
report judge version/variance; they never replace security or SQL gates.

## Experiment and release design

Every run snapshots application commit, golden-set version, data/catalog version,
prompt checksums, retriever configuration, provider/model parameters, random seed
and environment. Results are append-only. Baseline/candidate comparisons include
per-tag deltas and failures, not only averages. Retrieval features (semantic
chunking, rewriting, multi-query, MMR, reranking, compression, GraphRAG) ship
only after latency/cost-aware ablation shows the relevant quality tradeoff.

Initial CI gate configuration contains target thresholds, not claimed results:

- zero security-critical and forbidden-operation cases;
- no regression in deterministic SQL execution equivalence on the required set;
- configurable minimum retrieval recall and citation coverage;
- configurable maximum incomplete runs, p95 latency and per-case cost;
- statistical/absolute tolerances documented per metric.

Pull requests run deterministic unit/security cases and a credential-free golden
subset. Staging runs the full fixed snapshot with enabled providers; promotion
requires a signed report. Flaky provider failures are categorized, never silently
retried until green.

## Planned artifacts

`evaluation/cases/*.jsonl` holds cases; `evaluation/config/*.yaml` holds gates;
`evaluation/runner` produces machine JSON and a human report; dashboards ingest
run summaries. Phase 6 implements retrieval/text-to-SQL evaluation; Phase 8 adds
complete agent/judge adapters and feedback promotion.
