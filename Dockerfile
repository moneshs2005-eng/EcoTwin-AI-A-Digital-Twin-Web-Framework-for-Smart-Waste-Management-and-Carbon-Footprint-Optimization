# ==============================================================================
# EcoTwin AI - Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --ignore-scripts

# Copy source code and build client bundle
COPY . .
RUN npm run build

# Stage 2: Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl/wget for container health checks
RUN apk add --no-cache curl wget

# Copy package configurations
COPY package.json package-lock.json* ./

# Install runtime dependencies (including tsx for running typescript server)
RUN npm install --omit=dev --ignore-scripts && npm install tsx typescript @types/node

# Copy built frontend assets and server files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/data ./data

# Ensure data directory exists and has write permissions
RUN mkdir -p /app/data

# Expose standard application port
EXPOSE 3000

# Container Healthcheck targeting the backend health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/ping || exit 1

# Start the full-stack server
CMD ["npx", "tsx", "server.ts"]
