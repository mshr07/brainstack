# ADR-003: PostgreSQL with pgvector as the initial vector store

- Status: Accepted
- Date: 2026-08-27

## Context

Metadata/doc embeddings need ACL-filtered semantic search alongside transactional
versions and keyword search. Initial corpus size and recall needs are unmeasured.

## Alternatives

A dedicated vector database may scale/search better but adds a consistency and
operational boundary. OpenSearch offers hybrid retrieval but is another cluster.
In-memory indexes are not durable or horizontally safe.

## Decision

Start with PostgreSQL full-text search plus pgvector, version/ACL filters, and
configurable exact/ANN indexes. Hide storage behind a retrieval port and benchmark
before choosing index parameters or a dedicated store.

## Consequences and tradeoffs

One durable system simplifies local use, publication transactions and backups.
Vector workload may contend with platform OLTP and eventually require replicas or
migration. Retrieval evaluation, not fashion, triggers that change.
