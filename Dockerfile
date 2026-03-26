# TheRoundTable Orchestration Server
# Multi-stage build: install deps → compile TypeScript → slim runtime image

# --- Stage 1: Install dependencies ---
FROM node:20-slim AS deps

WORKDIR /app

# Copy workspace root + package manifests
COPY package.json package-lock.json ./
COPY packages/orchestration/package.json ./packages/orchestration/
COPY packages/graph/package.json ./packages/graph/

# Install all workspace dependencies
RUN npm ci --workspace=packages/orchestration --workspace=packages/graph

# --- Stage 2: Build TypeScript ---
FROM deps AS build

WORKDIR /app

# Copy source
COPY packages/graph/ ./packages/graph/
COPY packages/orchestration/ ./packages/orchestration/

# Build graph package first (orchestration depends on it)
RUN cd packages/graph && npx tsc --outDir dist || true

# Build orchestration
RUN cd packages/orchestration && npx tsc --outDir dist || true

# --- Stage 3: Production runtime ---
FROM node:20-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Copy package manifests
COPY package.json package-lock.json ./
COPY packages/orchestration/package.json ./packages/orchestration/
COPY packages/graph/package.json ./packages/graph/

# Install production deps only
RUN npm ci --workspace=packages/orchestration --workspace=packages/graph --omit=dev

# Copy built output
COPY --from=build /app/packages/graph/dist/ ./packages/graph/dist/
COPY --from=build /app/packages/orchestration/dist/ ./packages/orchestration/dist/

# Copy graph source (needed for seed data imports)
COPY packages/graph/src/ ./packages/graph/src/

# Port configured via env, default 3001
ENV PORT=3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "packages/orchestration/dist/index.js"]
