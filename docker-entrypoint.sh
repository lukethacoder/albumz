#!/bin/sh
set -e

# Derive CORS_ORIGIN from ORIGIN if not explicitly set
export CORS_ORIGIN=${CORS_ORIGIN:-$ORIGIN}

echo "[albumz] Running database migrations..."
cd /app/api && node dist/migrate.js

echo "[albumz] Starting API on :3001..."
PORT=3001 node dist/main.js &

echo "[albumz] Starting SvelteKit on :3000..."
export PORT=3000
export API_URL=http://127.0.0.1:3001
cd /app/client && exec node build
