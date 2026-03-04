#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Waiting for PostgreSQL..."
until pg_isready -h db -U postgres -q; do
  sleep 1
done

echo "Creating database schemas..."
psql "$DATABASE_URL" -c "CREATE SCHEMA IF NOT EXISTS media_monitor;"
psql "$DATABASE_URL" -c "CREATE SCHEMA IF NOT EXISTS media_monitor_private;"

echo "Running migrations..."
npx drizzle-kit push

echo "Writing .dev.vars..."
cat > .dev.vars << EOF
DATABASE_URL=$DATABASE_URL
EOF

echo "Dev environment ready!"
