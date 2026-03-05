# Architecture

Media Monitor is a Canadian media monitoring tool with an RSS ingestion pipeline and a unified search layer.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare Workers                     │
│                                                         │
│  Cron (every 5 min)                                     │
│    └─ RSS Pipeline (ingest web articles)                │
│                                                         │
│  Queues                                                 │
│    └─ rss-process-tasks → RSS task processor             │
│                                                         │
│  Bindings                                               │
│    ├─ AI (Workers AI for embeddings)                    │
│    ├─ IMAGES (R2 bucket)                                │
│    └─ GLINER_CONTAINER (Durable Object → container)     │
└─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   PostgreSQL    │    │   Turbopuffer    │
│   (metadata,    │    │   (vectors,      │
│    entities,    │    │    BM25 index,   │
│    job state)   │    │    chunk text)   │
└─────────────────┘    └──────────────────┘
```

## Pipelines

### RSS Pipeline

Ingests articles from National Post and Globe and Mail RSS feeds.

1. **Orchestrator** fetches enabled RSS feeds, parses XML, deduplicates
2. Inserts new `rss_items` (status: pending), queues each for processing
3. **Task processor** per item:
   - Extracts content via defuddle.md
   - Chunks markdown (~900 tokens, 15% overlap)
   - Embeds chunks via Workers AI (bge-base-en-v1.5, 768 dims)
   - Extracts entities via GLiNER2 container (people, orgs, locations, topics)
   - Upserts chunks + embeddings + entities to Turbopuffer
   - Saves entities to PostgreSQL

### Search

Hybrid search across all RSS-indexed articles via Turbopuffer:

- **Semantic**: Cosine similarity on embedded query
- **Keyword**: BM25 full-text search on chunk text
- **Hybrid**: Weighted sum of both (default)
- Supports metadata filters: publication, date range, entity type/value
- Deduplicates by article (keeps best chunk per article)

## Database Schemas

### `media_monitor` (public content)

| Table | Purpose |
|-------|---------|
| publications | Newspaper catalog |
| issues | One issue per publication per date |
| articles | Individual newspaper articles |
| sections | Newspaper sections |
| article_authors | Bylines |
| article_images | Images stored in R2 |
| article_tags | Classifications |

### `media_monitor_private` (internal operations)

| Table | Purpose |
|-------|---------|
| rss_feeds | RSS feed URLs and metadata |
| rss_items | Individual RSS articles + processing state |
| rss_entities | Extracted entities (NER + topics) |
| rss_ingest_jobs | RSS ingest job tracking |

## Key Technologies

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Cloudflare Workers, OpenNext adapter |
| Database | PostgreSQL (Drizzle ORM) |
| Vector DB | Turbopuffer (hybrid BM25 + vector) |
| Embeddings | Cloudflare Workers AI (bge-base-en-v1.5) |
| NER | GLiNER2 (Cloudflare Containers) |
| Content extraction | defuddle.md |
| RSS parsing | fast-xml-parser |
| Queue | Cloudflare Queues |
| Storage | Cloudflare R2 (images) |
