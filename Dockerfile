# Multi-stage Dockerfile für Frontend + Backend

# ============================================
# Stage 1: Backend Dependencies & Prisma Client
# ============================================
FROM node:20-alpine AS backend-deps
RUN npm install -g npm@latest
WORKDIR /app/backend
COPY backend/package*.json ./
# Install all dependencies (including devDependencies for Prisma)
RUN npm ci
# Copy Prisma schema and generate client
COPY backend/prisma ./prisma
# Generate Prisma Client
RUN cd /app/backend && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate --schema=./prisma/schema.prisma
# Remove devDependencies but keep @prisma/client and prisma (needed for migrations)
RUN npm prune --production

# ============================================
# Stage 2: Frontend Builder
# ============================================
FROM node:20-alpine AS frontend-builder
RUN npm install -g npm@latest
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY next.config.js ./
COPY postcss.config.mjs ./
COPY components.json ./
RUN npm ci
COPY src ./src
COPY public ./public
COPY eslint.config.mjs ./
# Build frontend (standalone mode)
RUN npm run build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:20-alpine AS runner
RUN npm install -g npm@latest

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache dumb-init netcat-openbsd wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy backend dependencies and source
COPY --from=backend-deps --chown=nextjs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --chown=nextjs:nodejs backend/package*.json ./backend/
COPY --chown=nextjs:nodejs backend/server.js ./backend/
COPY --chown=nextjs:nodejs backend/prisma ./backend/prisma
COPY --chown=nextjs:nodejs backend/utils ./backend/utils

# Copy built frontend
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/public ./public

# Copy startup scripts
COPY --chown=nextjs:nodejs scripts/start-backend.sh /app/start-backend.sh
COPY --chown=nextjs:nodejs scripts/start-frontend.sh /app/start-frontend.sh
RUN chmod +x /app/start-backend.sh /app/start-frontend.sh

# Environment defaults (can be overridden at runtime)
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Expose ports (just documentation, real ports defined in compose)
EXPOSE 3000 3001

USER nextjs

ENTRYPOINT ["dumb-init", "--"]
# Default command (can be overridden in compose)
CMD ["/app/start-backend.sh"]
