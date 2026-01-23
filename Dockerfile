# Multi-stage Dockerfile für Frontend + Backend
# Frontend: Vite Build → statische Dateien
# Backend: Python/FastAPI mit uvicorn

# ============================================
# Stage 1: Frontend Builder (Vite)
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Kopiere Package-Dateien
COPY package*.json ./
COPY vite.config.ts tsconfig.json ./
COPY components.json ./

# Installiere Dependencies
RUN npm ci

# Kopiere Frontend-Quellen
COPY src ./src
COPY public ./public
COPY index.html ./

# Build Frontend (Output: /app/dist/)
RUN npm run build

# ============================================
# Stage 2: Production Runner (Python + Frontend)
# ============================================
FROM python:3.13-slim AS runner
WORKDIR /app

# Installiere System-Dependencies (Nginx für Frontend Serving)
RUN apt-get update && apt-get install -y \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Kopiere Backend
COPY backend_python/requirements.txt ./backend_python/
RUN pip install --no-cache-dir -r backend_python/requirements.txt

COPY backend_python/ ./backend_python/

# Kopiere Frontend Build (von Stage 1)
COPY --from=frontend-builder /app/dist ./frontend/dist

# Nginx Config für Frontend Serving
COPY nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Startup Script (startet Backend + Nginx)
COPY scripts/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose Ports
EXPOSE 3000 3001

# Starte beide Services
CMD ["/app/start.sh"]
