#!/bin/sh
set -e

# Startet Backend (uvicorn) und Frontend (nginx) gleichzeitig
# Backend auf Port 3001, Frontend auf Port 3000

echo "🚀 Starting Smart Pantry Services..."

# Signal Handler für sauberes Shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    nginx -s quit 2>/dev/null || true
    exit 0
}

trap cleanup TERM INT

# Starte Backend im Hintergrund
echo "🔌 Starting Backend (FastAPI) on port 3001..."
cd /app/backend_python
python -m uvicorn app.main:app --host 0.0.0.0 --port 3001 &
BACKEND_PID=$!

# Warte kurz, damit Backend startet
sleep 2

# Starte Nginx für Frontend
echo "🎨 Starting Frontend (Nginx) on port 3000..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Warte auf beide Prozesse
wait $BACKEND_PID $NGINX_PID
