#!/bin/bash
set -e

echo "=== Media Monitor — Local Setup ==="

# 1. Check postgres
if ! pg_isready -q 2>/dev/null; then
  echo "Starting PostgreSQL via Homebrew..."
  brew services start postgresql@17 || brew services start postgresql@15
  sleep 2
fi

echo "✓ PostgreSQL is running"

# 2. Create database + schemas
psql postgres -c "CREATE DATABASE media_monitor;" 2>/dev/null || echo "  (database already exists)"
psql media_monitor -c "CREATE SCHEMA IF NOT EXISTS media_monitor;" 2>/dev/null
psql media_monitor -c "CREATE SCHEMA IF NOT EXISTS media_monitor_private;" 2>/dev/null
echo "✓ Database and schemas ready"

# 3. Detect user for connection string
DB_USER=$(whoami)
DATABASE_URL="postgresql://${DB_USER}@localhost:5432/media_monitor"

# 4. Write env files if they don't exist
if [ ! -f .env.local ]; then
  cat > .env.local <<EOF
DATABASE_URL=${DATABASE_URL}
TURBOPUFFER_API_KEY=
EOF
  echo "✓ Created .env.local"
else
  echo "  .env.local already exists, skipping"
fi

if [ ! -f .dev.vars ]; then
  cat > .dev.vars <<EOF
DATABASE_URL=${DATABASE_URL}
TURBOPUFFER_API_KEY=
EOF
  echo "✓ Created .dev.vars"
else
  echo "  .dev.vars already exists, skipping"
fi

# 5. Install deps
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# 6. Push schema
echo "Pushing database schema..."
DATABASE_URL="${DATABASE_URL}" npx drizzle-kit push 2>&1 | tail -1
echo "✓ Schema pushed"

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Add your TURBOPUFFER_API_KEY to .env.local and .dev.vars"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:3000"
echo "  4. Seed RSS feeds: POST http://localhost:3000/api/rss/feeds/seed"
