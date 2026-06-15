# Caching

`CacheService` uses Redis when available and falls back to in-memory cache. This keeps local mock runs simple while allowing production deployments to share cache across workers.

## Cached Items

- Jira API responses can be cached at the client boundary in future work.
- Embeddings are cached by embedding model and text hash.
- Retrieval results are cached by query, filters, top-k, and index version.
- Safe repeated answers are cached by normalized question, filters, retrieval mode, and index version.

## Invalidation

Incremental sync clears retrieval and answer caches only when created or updated tickets are indexed. Full index rebuild always clears retrieval and answer caches.

Embedding metadata stores:

- ticket ID
- updated timestamp
- comment count
- status
- description hash
- embedding hash

These fields are used to decide whether chunks can be reused or should be rebuilt during incremental sync.

## Future Cache Backends

The cache service interface can be extended to support database-backed cache, distributed locks, cache tags, and per-tenant namespaces.
