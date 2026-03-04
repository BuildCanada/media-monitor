# Search

## Overview

The search system provides hybrid vector + keyword search across all RSS-indexed articles using Turbopuffer.

## Search Modes

| Mode | How it works | Best for |
|------|-------------|----------|
| **Hybrid** (default) | Weighted sum of cosine similarity + BM25 | General queries |
| **Semantic** | Cosine similarity on query embedding | Conceptual/meaning-based |
| **Keyword** | BM25 full-text search on chunk text | Exact phrases, names |

## API

### `POST /api/search`

**Request:**
```json
{
  "query": "Canadian housing policy",
  "mode": "hybrid",
  "filters": {
    "publication": "Globe and Mail",
    "dateFrom": "2026-01-01",
    "dateTo": "2026-03-04",
    "entityType": "person",
    "entityValue": "Justin Trudeau"
  },
  "limit": 20
}
```

**Response:**
```json
{
  "results": [
    {
      "rssItemId": 42,
      "chunkSeq": 0,
      "title": "Housing starts decline...",
      "author": "Jane Smith",
      "publication": "Globe and Mail",
      "pubDate": "2026-02-15T00:00:00Z",
      "category": "Business",
      "articleUrl": "https://...",
      "chunkText": "The latest CMHC data shows...",
      "score": 0.847,
      "entitiesPeople": ["Justin Trudeau", "Sean Fraser"],
      "entitiesOrganizations": ["CMHC", "Bank of Canada"],
      "entitiesLocations": ["Toronto", "Vancouver"],
      "entitiesTopics": ["housing", "economy"]
    }
  ],
  "query": "Canadian housing policy",
  "mode": "hybrid"
}
```

## Filters

All filters are optional and can be combined:

- **publication**: Exact match on publication name
- **dateFrom / dateTo**: Date range on `pub_date`
- **entityType + entityValue**: Filter articles that contain a specific entity

## Deduplication

Search fetches 3x the requested limit, then deduplicates by `rss_item_id` keeping the highest-scoring chunk per article. This ensures each article appears at most once in results.

## Turbopuffer Schema

Namespace: `media-monitor-articles`

| Attribute | Type | Notes |
|-----------|------|-------|
| title | string | Article title |
| author | string | Author name |
| publication | string | Filterable |
| pub_date | string | ISO date, filterable |
| category | string | Feed category |
| article_url | string | Original article URL |
| rss_item_id | int | FK to PostgreSQL |
| chunk_seq | int | Chunk sequence number |
| chunk_text | string | BM25 full-text indexed |
| entities_people | []string | |
| entities_organizations | []string | |
| entities_locations | []string | |
| entities_topics | []string | |

## UI

The search page at `/search` provides:

- Search bar with Enter-to-search
- Mode selector (Hybrid / Semantic / Keyword)
- Filter sidebar: publication dropdown, date range pickers
- Result cards with: title (linked), metadata, snippet, color-coded entity badges
  - Blue = people, Green = organizations, Orange = locations, Purple = topics
