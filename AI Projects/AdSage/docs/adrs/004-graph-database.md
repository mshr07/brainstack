# ADR-004: Neo4j for governed relationship traversal

- Status: Accepted
- Date: 2026-08-27

## Context

Lineage, metric dependencies and safe join paths are variable-depth relationship
problems. Ordinary definition lookup and hierarchy filtering are not.

## Alternatives

Recursive PostgreSQL queries reduce infrastructure but become difficult for
multi-edge path ranking and graph explanation. A graph library lacks shared
durability. Always using a graph adds latency without benefit.

## Decision

Publish approved metadata relationships to Neo4j for bounded lineage/join/dependency
traversals. Keep PostgreSQL as metadata source of truth. Invoke GraphRAG only for
graph intents, with hop/result/ACL limits and a catalog fallback.

## Consequences and tradeoffs

Traversal logic is expressive and explainable. We accept dual-store publication,
eventual consistency and another dependency. Version markers, an outbox and stale
graph detection prevent silently mixing publications.
