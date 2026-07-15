-- USAGE-001 (2026-07-15): AI token usage tracking table.
--
-- Records every AI provider call (Groq + Gemini) for:
--   - Usage-based billing
--   - Cost anomaly alerts (>2x daily average)
--   - Product analytics (prompt → model → cost)
--
-- Marketing site anon chat → organizationId = null.
-- Authenticated dashboard chat → links to Organization via foreign key.

CREATE TABLE "ai_usage_entries" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "userId" TEXT,
  "sessionId" TEXT,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptTokens" INTEGER NOT NULL,
  "completionTokens" INTEGER NOT NULL,
  "totalTokens" INTEGER NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "promptId" TEXT,
  "cost" DECIMAL(10,6) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_usage_entries_pkey" PRIMARY KEY ("id")
);

-- Index for org-scoped queries (dashboard usage page).
CREATE INDEX "ai_usage_entries_organizationId_createdAt_idx" ON "ai_usage_entries"("organizationId", "createdAt");

-- Index for provider-scoped analytics (which models are used most).
CREATE INDEX "ai_usage_entries_provider_createdAt_idx" ON "ai_usage_entries"("provider", "createdAt");

-- Index for time-range queries (global cost reports).
CREATE INDEX "ai_usage_entries_createdAt_idx" ON "ai_usage_entries"("createdAt");

-- Foreign key: nullable (anon) + SetNull on org delete (preserve historical cost).
ALTER TABLE "ai_usage_entries" ADD CONSTRAINT "ai_usage_entries_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
