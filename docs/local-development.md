# Local Development

## Quick Start

```bash
# Automated setup (macOS with Homebrew)
bash scripts/setup-local.sh

# Then:
npm run dev
open http://localhost:3000
```

## Manual Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (via Homebrew: `brew install postgresql@17`)
- A Turbopuffer account (for search functionality)

### 1. Start PostgreSQL

```bash
brew services start postgresql@17
```

### 2. Create Database

```bash
psql postgres -c "CREATE DATABASE media_monitor;"
psql media_monitor -c "CREATE SCHEMA IF NOT EXISTS media_monitor;"
psql media_monitor -c "CREATE SCHEMA IF NOT EXISTS media_monitor_private;"
```

### 3. Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
cp .env.example .dev.vars
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `TURBOPUFFER_API_KEY` | For search | API key from turbopuffer.com/dashboard |

`.env.local` is used by Next.js dev server. `.dev.vars` is used by Wrangler (Cloudflare Workers).

### 4. Install Dependencies

```bash
npm install
```

### 5. Push Schema

```bash
npx drizzle-kit push
```

If Drizzle reports "No changes detected" but tables are missing, generate and apply manually:

```bash
npx drizzle-kit generate
# Then apply the SQL file, skipping CREATE SCHEMA lines:
psql media_monitor < drizzle/0000_*.sql
```

### 6. Run Dev Server

```bash
npm run dev
```

Open http://localhost:3000

### 7. Seed RSS Feeds

```bash
curl -X POST http://localhost:3000/api/rss/feeds/seed
```

Or click "Seed Feeds" in the RSS Feeds page UI.

## DevContainer (Alternative)

The `.devcontainer/` directory provides a Docker-based dev environment:

```bash
# In VS Code: Cmd+Shift+P → "Dev Containers: Reopen in Container"
# Or with devcontainer CLI:
devcontainer up
```

This automatically:
- Starts PostgreSQL 17 in a container
- Creates the database and schemas
- Installs dependencies
- Pushes the Drizzle schema

## Common Tasks

### Trigger RSS Ingest

```bash
curl -X POST http://localhost:3000/api/rss/ingest/trigger
```

### Check Ingest Jobs

```bash
curl http://localhost:3000/api/rss/ingest/jobs
```

### Search Articles

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Canadian housing", "mode": "hybrid"}'
```

### View Database

```bash
psql media_monitor
\dt media_monitor.*
\dt media_monitor_private.*
```

### Regenerate Cloudflare Types

```bash
npm run cf-typegen
```

## Wrangler (Cloudflare Workers) Dev

For testing queue handlers and cron locally:

```bash
npx wrangler dev
```

Note: The GLiNER2 container and Workers AI require Cloudflare's runtime. For local testing, the API routes use mock queues (items are inserted to DB but not processed through the full pipeline).

## Project Structure

```
media-monitor/
├── src/
│   ├── app/                    # Next.js pages + API routes
│   │   ├── api/
│   │   │   ├── rss/            # RSS feed/item/ingest endpoints
│   │   │   ├── search/         # Search endpoint
│   │   │   ├── scrape/         # PressReader scrape endpoints
│   │   │   └── ...
│   │   ├── rss/                # RSS management UI pages
│   │   ├── search/             # Search UI page
│   │   └── ...
│   ├── components/
│   │   ├── layout/             # Sidebar, breadcrumbs
│   │   └── ui/                 # Badge, toggle, entity badges
│   ├── db/
│   │   ├── schema/
│   │   │   ├── media-monitor/  # Public content tables
│   │   │   └── private/        # Internal operations tables
│   │   └── index.ts            # DB connection
│   └── lib/
│       ├── rss/                # RSS pipeline modules
│       │   ├── feed-fetcher.ts
│       │   ├── orchestrator.ts
│       │   ├── content-extractor.ts
│       │   ├── chunker.ts
│       │   ├── embedder.ts
│       │   ├── entity-extractor.ts
│       │   ├── turbopuffer.ts
│       │   ├── task-processor.ts
│       │   └── seed-feeds.ts
│       ├── scraper/            # PressReader pipeline
│       └── pressreader/        # PressReader API client
├── gliner-service/             # GLiNER2 NER container
│   ├── Dockerfile
│   └── main.py
├── docs/                       # Documentation
├── scripts/                    # Setup scripts
├── custom-worker.ts            # Cloudflare Workers entry point
├── wrangler.jsonc              # Cloudflare configuration
└── drizzle.config.ts           # Database migration config
```
