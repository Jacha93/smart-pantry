#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
# Loop until Postgres is ready
until nc -z smart-pantry-postgres 5432; do
  echo "  - Database not ready yet..."
  sleep 1
done
echo "✅ Database is ready."

echo "🚀 Running Prisma migrations..."
# Check if migrations directory exists
if [ -d "/app/backend/prisma/migrations" ]; then
  cd /app/backend
  # Prisma migrate deploy - stille Ausgabe außer bei Fehlern
  npx prisma migrate deploy --schema=./prisma/schema.prisma > /dev/null 2>&1 || {
    echo "❌ Migration failed, showing output:"
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    exit 1
  }
  echo "✅ Migrations completed."
  
  echo "🔧 Generating Prisma Client..."
  # Prisma generate - stille Ausgabe außer bei Fehlern
  npx prisma generate --schema=./prisma/schema.prisma > /dev/null 2>&1 || {
    echo "❌ Prisma Client generation failed, showing output:"
    npx prisma generate --schema=./prisma/schema.prisma
    exit 1
  }
  echo "✅ Prisma Client generated."
else
  echo "⚠️ Migrations directory not found at /app/backend/prisma/migrations"
  ls -la /app/backend/prisma/
fi

echo "🔌 Starting Backend Server..."
cd /app/backend

# Ensure BACKEND_PORT is set
if [ -z "$BACKEND_PORT" ]; then
  export BACKEND_PORT=3001
fi

echo "  - Port: $BACKEND_PORT"
echo "  - Host: 0.0.0.0"

node server.js

