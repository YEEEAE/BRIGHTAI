# syntax=docker/dockerfile:1.7-labs
# ═══════════════════════════════════════════════════════════════════
# BrightAI Marketing Site — production image
# DOCKER-001 (2026-07-15): Multi-stage build for air-gapped + self-hosted deploys.
#
# Architecture: Astro 6 hybrid (output: 'static' + @astrojs/node standalone adapter)
#   - dist/client/ — 190 prerendered HTML pages + assets
#   - dist/server/ — Node standalone server (entry.mjs) for SSR + API routes
#   - public/    — static files served as-is (logos, fonts, OG images)
#
# Build stages:
#   base   → node:22.22.2-alpine + corepack (pnpm@10.19.0)
#   deps   → pnpm install (cached via BuildKit mount)
#   build  → astro build + schema sync + sitemap generation
#   runtime → minimal Alpine image with dist + node_modules
# ═══════════════════════════════════════════════════════════════════

# ─── Stage 1: base (shared between deps + build) ──────────────────
FROM node:22.22.2-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app

# ─── Stage 2: deps ─────────────────────────────────────────────────
FROM base AS deps

# Copy workspace config + manifest files (pnpm needs these to resolve).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/dashboard/.npmrc* ./apps/dashboard/ 2>/dev/null || true
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
COPY packages/firewall-detectors/package.json ./packages/firewall-detectors/ 2>/dev/null || true
COPY packages/lead-queue/package.json ./packages/lead-queue/ 2>/dev/null || true

# Install with BuildKit cache mount (pnpm store persists across builds).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ─── Stage 3: build ────────────────────────────────────────────────
FROM base AS build

# Copy installed deps + source.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules 2>/dev/null || true
COPY . .

# Build the marketing site (Astro 6 hybrid mode).
# `pnpm build` already includes: image-sitemap + astro build + avif:generate +
#   sitemap:generate + sync:dist:flat + schema syncs + purge:css.
# Source files are copied via `COPY . .` so the .agents/ + docs/ are
# available at build time but excluded from the runtime image via .dockerignore.
RUN pnpm build

# ─── Stage 4: runtime (production) ─────────────────────────────────
FROM node:22.22.2-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
# Render compatibility (TRUSTED_PROXY_COUNT defaults to 1).
ENV TRUSTED_PROXY_COUNT=1

# Health-check uses wget (Alpine has it via busybox).
RUN apk add --no-cache wget

# Copy production artifacts.
# - dist/ contains both dist/client/ (prerendered) + dist/server/ (Node entry).
# - node_modules/ pruned to runtime-only deps via... actually pnpm doesn't
#   prune by default — we accept ~80MB of devDeps for simplicity. Production
#   image stays under 300MB.
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Non-root user (node image ships with uid 1000 'node' user).
USER node

EXPOSE 10000

# Health check — /api/health/ is server-rendered (prerender=false) so
# it requires the Node process to be alive (not just static file serving).
# This catches real SSR outages, matching Render's healthCheckPath.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health/ || exit 1

# Node standalone adapter entry. Matches render.yaml startCommand.
CMD ["node", "./dist/server/entry.mjs"]