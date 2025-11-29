# Multi-stage Dockerfile für Frontend + Backend

# ============================================
# Stage 1: Backend Dependencies & Prisma Client
# ============================================
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
# Install all dependencies (including devDependencies for Prisma)
RUN npm ci
# Copy Prisma schema and generate client
COPY backend/prisma ./prisma
# Generate Prisma Client (muss im backend Verzeichnis ausgeführt werden)
# WICHTIG: DATABASE_URL muss für generate gesetzt sein (auch wenn nicht verwendet)
# Prisma 7 benötigt DATABASE_URL auch für generate, auch wenn sie nicht verwendet wird
RUN cd /app/backend && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate --schema=./prisma/schema.prisma
# Verify that generated client exists (Standard-Pfad: node_modules/.prisma/client)
RUN ls -la /app/backend/node_modules/.prisma/client/index.js || (echo "ERROR: Prisma Client wurde nicht generiert!" && exit 1)
# Verify that @prisma/client runtime exists
RUN ls -la /app/backend/node_modules/@prisma/client/runtime/client.js || (echo "ERROR: Prisma Client Runtime fehlt!" && exit 1)
# WICHTIG: npm prune --production entfernt prisma CLI, aber @prisma/client muss bleiben
# Prüfe vorher, dass @prisma/client als dependency vorhanden ist
RUN npm prune --production
# Verify that Prisma Client files still exist after prune
RUN ls -la /app/backend/node_modules/.prisma/client/index.js || (echo "ERROR: Prisma Client wurde nach npm prune entfernt!" && exit 1)
RUN ls -la /app/backend/node_modules/@prisma/client/runtime/client.js || (echo "ERROR: Prisma Client Runtime wurde nach npm prune entfernt!" && exit 1)
# Verify that @prisma/client package exists
RUN ls -la /app/backend/node_modules/@prisma/client/package.json || (echo "ERROR: @prisma/client package fehlt!" && exit 1)

# ============================================
# Stage 2: Frontend Builder
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY next.config.js ./
COPY postcss.config.mjs ./
COPY components.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY src ./src
COPY public ./public
COPY eslint.config.mjs ./

# Build frontend (standalone mode)
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init and netcat for database health check
RUN apk add --no-cache dumb-init netcat-openbsd

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy backend dependencies (includes Prisma client in node_modules/.prisma/client) and source
# Copy node_modules but ensure .prisma/client is included
COPY --from=backend-deps --chown=nextjs:nodejs /app/backend/node_modules ./backend/node_modules
# Explicitly verify Prisma client exists in final image
RUN ls -la /app/backend/node_modules/.prisma/client/index.js || (echo "ERROR: Prisma Client fehlt im finalen Image!" && exit 1)
COPY --chown=nextjs:nodejs backend/package*.json ./backend/
COPY --chown=nextjs:nodejs backend/server.js ./backend/
COPY --chown=nextjs:nodejs backend/prisma ./backend/prisma
# prisma.config.ts wird in Prisma 6.x nicht benötigt (nur Prisma 7+)
# COPY --chown=nextjs:nodejs backend/prisma.config.ts ./backend/
COPY --chown=nextjs:nodejs backend/utils ./backend/utils

# Copy built frontend (standalone output)
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/public ./public

# Create startup script that runs migrations and then both services
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Waiting for database to be ready..."' >> /app/start.sh && \
    echo 'until nc -z smart-pantry-postgres 5432; do sleep 1; done' >> /app/start.sh && \
    echo 'echo "Database is ready. Running Prisma migrations..."' >> /app/start.sh && \
    echo 'cd /app/backend && npx prisma migrate deploy --schema=./prisma/schema.prisma' >> /app/start.sh && \
    echo 'echo "Migrations completed. Starting backend on port 8000..."' >> /app/start.sh && \
    echo 'cd /app/backend && node server.js &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Backend started with PID $BACKEND_PID"' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'echo "Starting frontend on port 3000..."' >> /app/start.sh && \
    echo 'cd /app && node server.js &' >> /app/start.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Frontend started with PID $FRONTEND_PID"' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_PORT=8000
ENV HOSTNAME="0.0.0.0"
# NEXT_PUBLIC_API_URL wird in compose.yml aus BACKEND_PORT gebaut
# ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Expose ports
EXPOSE 3000 8000

USER nextjs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]
