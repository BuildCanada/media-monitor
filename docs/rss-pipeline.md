# RSS Pipeline

## Overview

The RSS pipeline ingests articles from Canadian newspaper RSS feeds, extracts content and entities, creates embeddings, and indexes everything in Turbopuffer for hybrid search.

## Feed Sources

14 feeds are seeded by default:

| Publication | Feeds |
|-------------|-------|
| National Post | Main + News, Opinion, Business, Sports, Entertainment, Life |
| Globe and Mail | Canada + Politics, Business, Opinion, Sports, Arts, Life |

Feeds are managed via the UI at `/rss` or the API.

## Processing Pipeline

### 1. RSS Fetch & Dedup (`src/lib/rss/orchestrator.ts`)

- Queries all enabled `rss_feeds`
- Fetches and parses each feed's XML via `fast-xml-parser`
- Deduplicates items by `guid` and `link` against existing `rss_items`
- Inserts new items with `processing_status: pending`
- Queues each new item for processing

### 2. Content Extraction (`src/lib/rss/content-extractor.ts`)

- Calls `https://md.defuddle.app/?url={articleUrl}` for each article
- Returns clean markdown content, title, word count
- Stores markdown in `rss_items.content_markdown`
- Computes SHA-256 `content_hash` for dedup (skips if hash matches existing)

### 3. Chunking (`src/lib/rss/chunker.ts`)

QMD-inspired markdown-aware chunking:

- **Target size**: ~900 tokens (~3600 chars)
- **Overlap**: 15% between consecutive chunks
- **Breakpoint scoring**: Prefers splitting at natural boundaries
  - H1: 100, H2: 90, H3: 80, HR: 60, paragraph: 20, sentence: 10
  - Distance decay (squared) from target split position
- **Safety**: Never splits inside fenced code blocks

### 4. Embedding (`src/lib/rss/embedder.ts`)

- Model: `@cf/baai/bge-base-en-v1.5` via Cloudflare Workers AI
- Output: 768-dimensional vectors
- Batches up to 100 chunks per API call

### 5. Entity Extraction (`src/lib/rss/entity-extractor.ts`)

Calls the GLiNER2 container (Cloudflare Containers via Durable Object):

- **NER**: people, organizations, locations
- **Topic classification**: Multi-label from 19 Canadian-relevant topics
- Input truncated to ~4000 chars for efficiency
- Results deduplicated by entity value (keeps highest confidence)
- Stored in `rss_entities` table

### 6. Vector Upsert (`src/lib/rss/turbopuffer.ts`)

Each chunk is upserted to Turbopuffer namespace `media-monitor-articles`:

- **ID**: `rss-{itemId}-chunk-{seq}`
- **Vector**: 768-dim embedding
- **Attributes**: title, author, publication, pub_date, category, article_url, chunk_text (BM25-indexed), entity arrays

## Processing States

```
pending → extracting → embedding → completed
                                 → failed (with error message)
```

Each state transition is persisted to `rss_items.processing_status`.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/rss/feeds` | List all feeds |
| POST | `/api/rss/feeds` | Add a new feed |
| PATCH | `/api/rss/feeds/:feedId` | Update feed (enable/disable) |
| POST | `/api/rss/feeds/seed` | Seed default NP + G&M feeds |
| POST | `/api/rss/ingest/trigger` | Trigger RSS ingest manually |
| GET | `/api/rss/ingest/jobs` | List ingest jobs |
| GET | `/api/rss/ingest/jobs/:jobId` | Get ingest job detail |
| GET | `/api/rss/items` | List RSS items (filterable) |
| GET | `/api/rss/items/:itemId` | Get item detail + entities |

## GLiNER2 Container

Located in `gliner-service/`:

- **Dockerfile**: Python 3.11 + FastAPI + GLiNER2
- **Endpoints**: `POST /extract`, `GET /health`
- **Model**: `fastino/gliner2-base-v1`
- Runs as Cloudflare Container via Durable Object binding

### Topic Labels

politics, economy, business, technology, health, environment, education, immigration, housing, energy, infrastructure, defence, indigenous affairs, agriculture, trade, law, crime, culture, sports
