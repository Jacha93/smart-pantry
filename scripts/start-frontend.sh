#!/bin/sh
set -e

echo "🎨 Starting Frontend Server (Next.js)..."
cd /app

# Ensure PORT is set (Next.js uses this)
if [ -z "$PORT" ]; then
  export PORT=3000
fi

echo "  - Port: $PORT"

node server.js

