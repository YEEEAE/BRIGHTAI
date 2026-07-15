-- ═══════════════════════════════════════════════════════════════════
-- Migration: 20260715000000_feature_flags
-- Feature Flags System (FEAT-FLAGS-2026-07-15)
-- ═══════════════════════════════════════════════════════════════════
--
-- Creates:
--   1. feature_flags table (global catalog, non-tenant)
--   2. org_feature_flags table (per-org overrides, tenant-scoped)
--   3. FEATURE_FLAG_TOGGLED audit action
--   4. RLS policies for org_feature_flags
--
-- Seeds 5 initial flags with fail-closed defaults (INSERT ... ON CONFLICT DO NOTHING).
-- ═══════════════════════════════════════════════════════════════════

-- Add FEATURE_FLAG_TOGGLED to AuditAction enum
-- PostgreSQL requires this before creating tables that reference it
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'FEATURE_FLAG_TOGGLED';

-- ─────────────────────────────────────────────────────────────────
-- feature_flags — global catalog (non-tenant, BYPASSRLS via service role)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "feature_flags" (
    "id"           TEXT         NOT NULL,
    "key"          TEXT         NOT NULL,
    "description"  TEXT         NOT NULL,
    "defaultValue" BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_key_key" ON "feature_flags"("key");

-- ─────────────────────────────────────────────────────────────────
-- org_feature_flags — per-organization overrides (tenant-scoped, RLS)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "org_feature_flags" (
    "id"             TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "flagKey"        TEXT         NOT NULL,
    "enabled"        BOOLEAN      NOT NULL,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    "updatedBy"      TEXT,

    CONSTRAINT "org_feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_feature_flags_organizationId_flagKey_key"
    ON "org_feature_flags"("organizationId", "flagKey");

CREATE INDEX IF NOT EXISTS "org_feature_flags_organizationId_idx"
    ON "org_feature_flags"("organizationId");

-- Foreign keys
ALTER TABLE "org_feature_flags"
    ADD CONSTRAINT "fk_org_feature_flags_organization"
    FOREIGN KEY ("organizationId")
    REFERENCES "organizations"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "org_feature_flags"
    ADD CONSTRAINT "fk_org_feature_flags_flag"
    FOREIGN KEY ("flagKey")
    REFERENCES "feature_flags"("key")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- RLS policies for org_feature_flags
--
-- org_feature_flags is tenant-scoped: a user in org A must never
-- see or modify org B's flag overrides. We use the same pattern as
-- other tenant-scoped tables (app.current_org_id).
--
-- feature_flags (global catalog) is NOT tenant-scoped — all orgs
-- can read it via service role. No RLS policy needed.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE "org_feature_flags" ENABLE ROW LEVEL SECURITY;

-- Read: only see overrides for the current org
CREATE POLICY "tenant_rls_org_feature_flags_select"
    ON "org_feature_flags"
    FOR SELECT
    USING ("organizationId" = current_setting('app.current_org_id', true));

-- Insert: only into current org
CREATE POLICY "tenant_rls_org_feature_flags_insert"
    ON "org_feature_flags"
    FOR INSERT
    WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- Update: only current org rows
CREATE POLICY "tenant_rls_org_feature_flags_update"
    ON "org_feature_flags"
    FOR UPDATE
    USING ("organizationId" = current_setting('app.current_org_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- Delete: only current org rows
CREATE POLICY "tenant_rls_org_feature_flags_delete"
    ON "org_feature_flags"
    FOR DELETE
    USING ("organizationId" = current_setting('app.current_org_id', true));

-- ─────────────────────────────────────────────────────────────────
-- Seed 5 initial flags
-- INSERT ... ON CONFLICT DO NOTHING → idempotent on re-run
-- All defaultValue = false (fail-closed)
-- ─────────────────────────────────────────────────────────────────

INSERT INTO "feature_flags" ("id", "key", "description", "defaultValue", "createdAt")
VALUES
    (gen_random_uuid()::text, 'ai_streaming',        'بث SSE للمحادثة — يقلل زمن أول توكن من ~3s إلى <500ms (BAI-006)',           false, NOW()),
    (gen_random_uuid()::text, 'firewall_ner_enabled', 'كاشف التعرف على الكيانات العربية (NER) في Firewall — يكتشف PII بالعربي',   false, NOW()),
    (gen_random_uuid()::text, 'billing_v2',           'نظام الفوترة v2 — طبقات التسعير الجديدة والفواتير التفصيلية',               false, NOW()),
    (gen_random_uuid()::text, 'audit_ui_enabled',     'صفحة سجل التدقيق في Dashboard (BAI-018) — عرض كامل للإجراءات والأحداث',    false, NOW()),
    (gen_random_uuid()::text, 'sso_enabled',          'تسجيل الدخول عبر SAML/OIDC — تكامل مع هوية المؤسسة (SSO Enterprise)',       false, NOW())
ON CONFLICT ("key") DO NOTHING;
