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
RUN npx prisma generate
# Remove dev dependencies after Prisma generation
RUN npm prune --production

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

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy backend dependencies, Prisma client, and source
COPY --from=backend-deps --chown=nextjs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-deps --chown=nextjs:nodejs /app/backend/generated ./backend/generated
COPY --chown=nextjs:nodejs backend/package*.json ./backend/
COPY --chown=nextjs:nodejs backend/server.js ./backend/
COPY --chown=nextjs:nodejs backend/prisma ./backend/prisma
COPY --chown=nextjs:nodejs backend/utils ./backend/utils

# Copy built frontend (standalone output)
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/public ./public

# Create startup script that runs both services
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Starting backend on port 8000..."' >> /app/start.sh && \
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
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Expose ports
EXPOSE 3000 8000

USER nextjs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]
