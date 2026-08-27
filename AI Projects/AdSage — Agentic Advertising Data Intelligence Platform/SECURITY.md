# Security architecture and text-to-SQL threat model

## Trust model

The browser, user text, documents, retrieved chunks, model output, tool output,
and generated SQL are untrusted. Spring is the public identity/policy boundary;
each downstream data/tool layer still enforces tenant and capability constraints.
Production workloads use private networking, workload identity/mTLS, least-
privilege IAM/database roles, encryption in transit/at rest, secret rotation, and
egress restrictions.

OIDC JWT validation pins issuer, audience, algorithm and time claims. Roles map
to narrow scopes such as `conversation:read`, `analysis:run`, `metadata:review`,
and `query:approve`; tenant membership is server-resolved. Administrative/HITL
decisions require scope, resource version and a fresh audit event. The web app
never receives internal/model/database credentials.

## Data and privacy

Only synthetic advertising entities/events are generated. Metadata still carries
classification because the architecture must remain safe if connected to other
approved data later. Columns are public/internal/confidential/restricted;
masking, projection and export limits are deterministic. Logs use allowlisted
fields and redaction. Retention/TTL is explicit for messages, working memory,
idempotency responses, cache entries, traces and query results.

Cache namespaces include tenant, subject/role policy hash, source versions,
query parameters and masking policy. Shared semantic caches may hold only global,
public metadata. Authorization changes invalidate the policy hash rather than
trying to enumerate every key.

Phase 2 accepts only generated rows explicitly marked synthetic. Completed
Bronze manifests bind object paths, sizes, and SHA-256 checksums; uncommitted,
missing, or changed objects are not transformed. Strict schemas reject required
field removal, known-field type changes, unsupported versions, and non-nullable
additions. Dimension, causal-parent, UTC/business-date, money, currency, and
attribution checks run before publication. Invalid rows are reason-coded and the
quality threshold fails closed without advancing the catalog pointer. Local
filesystem paths come only from validated operator configuration; generated
values never select arbitrary output roots or SQL text.

## Text-to-SQL assets and attackers

Protected assets are tenant isolation, warehouse availability/cost, catalog and
metric integrity, secrets, approval boundaries, and result confidentiality.
Attackers may be malicious users, compromised documents, prompt-injected source
text, a faulty/model provider, or a confused authorized user.

| Threat | Required control | Test evidence |
| --- | --- | --- |
| DDL/DML/command execution | parse one statement; SELECT/query AST only; reject write/utility/external functions | malicious statement corpus |
| SQL injection via question/filter | structured values and bound parameters; no string concatenation | metacharacter/property tests |
| prompt injection in retrieved text | provenance-tagged untrusted context; fixed tool policy; structured outputs; critic | adversarial documents |
| cross-tenant access | server capability; catalog ACL filter; injected tenant predicate/RLS; policy-scoped role | two-tenant integration tests |
| hidden/unknown object access | resolve every catalog/schema/table/column/function against allowlists | hallucinated/qualified-name tests |
| unsafe joins or semantic errors | approved relationship graph, grain/cardinality checks, canonical formula AST | fan-out/wrong-grain cases |
| full scan/cost denial of service | mandatory fact date filters, LIMIT/result caps, EXPLAIN estimate, Athena workgroup limits, timeout/cancel | no-date, Cartesian, high-cost tests |
| obfuscation/parser differential | one configured sqlglot dialect; reject comments/hints/multiple statements and unsupported AST | encoding/comment corpus |
| data exfiltration via functions | function allowlist; no network/file/catalog/system functions; capped output | function denylist tests |
| approval bypass/TOCTOU | approval binds normalized SQL hash, policy/catalog version, principal, expiry; revalidate before run | mutation/replay tests |
| repair loop abuse | at most configured repairs; same policy/deadline; audit each candidate | boundedness tests |

## Safe SQL state machine

1. Convert intent, canonical metric AST, selected metadata versions, approved join
   edges and parameter values into a structured query plan.
2. Generate one dialect-specific candidate. Never execute this string.
3. Parse with sqlglot and reject parse ambiguity, multiple statements, comments/
   hints, forbidden node/function types, recursive/unbounded constructs, and
   unsupported dialect features.
4. Resolve all identifiers to the authorized catalog. Expand stars or reject
   them. Validate types, aggregate/grouping semantics, grain, join cardinality,
   canonical formula version and dimension compatibility.
5. Apply server-owned row/column/masking policy and parameter binding. The model
   cannot provide or remove these predicates.
6. Require bounded time range/partition predicates on large facts, maximum rows,
   bytes, groups, joins and complexity. Obtain `EXPLAIN`/Athena estimate using a
   non-executing role; high-cost plans enter approval.
7. Serialize normalized SQL, compute a policy/catalog/principal-bound hash, audit,
   then execute using a read-only role in an isolated workgroup/transaction with
   timeout, cancellation and result-byte cap.
8. Validate result schema, row count, numeric invariants and masking before use.
   Repair only eligible generation/semantic failures within the shared budget.

SQL previews label parameters and injected policy. Audit records store normalized
query/hash and object lineage; sensitive literal/result values are not logged.

## Prompt and model security

System policy and tool schemas are immutable inputs with higher trust than user
or retrieved content. Structured outputs are schema-validated; unknown fields are
rejected. Tool calls require plan membership, capability and bounded arguments.
The model never sees provider secrets, raw JWTs, unrestricted schema dumps, or
data outside the caller's policy. Output is checked for unsupported citations,
secret patterns, unsafe HTML and formula conflicts.

## Application and supply-chain controls

- rate limits at edge and tenant/user/action layers; idempotency prevents replay;
- CSRF-safe bearer-token APIs, strict CORS, CSP, secure headers and output encoding;
- parameter validation, body/result limits, dependency lockfiles and SBOMs;
- SAST, secret scan, dependency and container vulnerability scanning in CI;
- non-root/read-only containers, seccomp, NetworkPolicy, resource limits and
  admission policy in Kubernetes;
- Secrets Manager/external secret references, never secrets in Git or images;
- append-only audit export with alerts for denials, approval and policy changes.

## Adversarial test gates

No release may regress the zero-tolerance set: forbidden SQL execution,
cross-tenant data access, unsigned/invalid token acceptance, approval replay,
secret exposure, unrestricted tool call, or iteration/budget escape. Fuzzed SQL,
prompt-injection corpora and dependency/container scans run in CI; failures block
promotion.
