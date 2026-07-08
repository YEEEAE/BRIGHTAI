# syntax=docker/dockerfile:1.7
# ═══════════════════════════════════════════════════════════════════
# BrightAI Dashboard — production image
# Multi-stage build: deps → build → runner
# ═══════════════════════════════════════════════════════════════════

# ─── Stage 1: dependencies ─────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /repo
# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
# Copy all workspace package.jsons (pnpm needs them to resolve)
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile --filter @brightai/dashboard...

# ─── Stage 2: build ────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY . .
# Build with telemetry off
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @brightai/dashboard build

# ─── Stage 3: runner (production) ──────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 brightai

# Copy the standalone output
COPY --from=builder --chown=brightai:nodejs /repo/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=brightai:nodejs /repo/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=brightai:nodejs /repo/apps/dashboard/public ./apps/dashboard/public

USER brightai
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "apps/dashboard/server.js"]
