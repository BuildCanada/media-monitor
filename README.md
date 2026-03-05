# Media Monitor

Canadian media monitoring platform. Ingests RSS feeds, extracts content, generates embeddings, and provides semantic search.

## Architecture

Two Cloudflare Workers running from the same repo:

| Worker | Entry Point | Purpose |
|--------|-------------|---------|
| `media-monitor` | `custom-worker.ts` | Next.js app (HTTP only) |
| `media-monitor-worker` | `worker/index.ts` | Queue consumer + cron triggers |

Jobs use a Rails ActiveJob-like pattern (`src/jobs/`): `performLater()` queues in production, runs inline in development.

## Local Development

```bash
# Install dependencies
npm ci

# Start Next.js dev server (jobs run inline)
npm run dev

# Optionally start the queue worker (for testing queue behavior)
npm run worker:dev
```

Requires `.dev.vars` with `DATABASE_URL` and `TURBOPUFFER_API_KEY`, and a local PostgreSQL database.

## Deploy

**CI (Cloudflare Workers Builds)** deploys the Next.js app automatically on push:
- Build command: `npm ci && npm run build:prod`
- Deploy command: `npm run deploy:app`

**Queue worker** is deployed separately:
```bash
npm run deploy:worker
```

**Both at once** (local only):
```bash
npm run deploy:all
```

## Secrets

Required on both workers:
```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put TURBOPUFFER_API_KEY
npx wrangler secret put DATABASE_URL --config worker/wrangler.jsonc
npx wrangler secret put TURBOPUFFER_API_KEY --config worker/wrangler.jsonc
```

## Cron Schedules

| Schedule | Job |
|----------|-----|
| `*/5 * * * *` | RSS feed ingest |
