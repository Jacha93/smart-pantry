# Multi-stage Dockerfile für Frontend + Backend
# App-Ziel: Vite-App + FastAPI in einem Container
# Marketing-Ziel: Nur die öffentliche Landingpage als statische Site

# ============================================
# Stage 1: Frontend Builder (Vite)
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app
ARG BUILD_SCRIPT=build:web

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
RUN npm run ${BUILD_SCRIPT}

# ============================================
# Stage 2: Marketing Runner (Nginx only)
# ============================================
FROM nginx:1.27-alpine AS marketing-runner
WORKDIR /usr/share/nginx/html

# Copy marketing build output
COPY --from=frontend-builder /app/dist ./

# Minimaler Static-Server für die öffentliche Landingpage
COPY nginx-marketing.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Stage 3: App Runner (Python + Frontend)
# ============================================
FROM python:3.13-slim AS app-runner
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
