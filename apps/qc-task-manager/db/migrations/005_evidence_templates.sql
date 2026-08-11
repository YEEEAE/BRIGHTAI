-- Evidence Architecture + Task Templates.
--
-- This migration is purely ADDITIVE: it introduces a new task_templates table,
-- extends task_attachments with the evidence-metadata columns required by the
-- evidence platform (type/description/source/collected_by/collected_at/
-- verification_status), and links tasks to the template that produced them
-- together with an immutable configuration snapshot.
--
-- No existing column or constraint is modified or dropped. All ALTER TABLE
-- statements use safe ADD COLUMN forms (NOT NULL columns ship with a DEFAULT).

-- ─────────────────────────── 1. task_templates ───────────────────────────
-- Canonical, reusable task configuration. Lifecycle: DRAFT → ACTIVE → ARCHIVED.
-- Only ACTIVE templates can be instantiated. JSON columns carry the structured
-- configuration; the snapshot copied onto a task at instantiation time is built
-- from these so later template edits never mutate existing tasks.
CREATE TABLE IF NOT EXISTS task_templates (
  id                         INTEGER PRIMARY KEY AUTOINCREMENT,
  code                       TEXT NOT NULL UNIQUE,
  title                      TEXT NOT NULL,
  description                TEXT,
  department                 TEXT NOT NULL DEFAULT 'QC',
  priority                   TEXT NOT NULL DEFAULT 'medium'
                               CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  task_type                  TEXT,
  sla_policy_id              INTEGER REFERENCES sla_policies(id) ON DELETE SET NULL,
  checklist_json             TEXT NOT NULL DEFAULT '[]',
  evidence_requirements_json TEXT NOT NULL DEFAULT '[]',
  recurrence                 TEXT NOT NULL DEFAULT 'none'
                               CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  finding_defaults_json      TEXT NOT NULL DEFAULT '{}',
  assignment_rules_json      TEXT NOT NULL DEFAULT '{}',
  lifecycle_status           TEXT NOT NULL DEFAULT 'DRAFT'
                               CHECK (lifecycle_status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  version                    INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_by                 INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at                 TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                 TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_templates_status     ON task_templates(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_task_templates_department ON task_templates(department);

-- ─────────────── 2. task_attachments → evidence metadata ────────────────
-- The completion-evidence BLOBs already live in task_attachments (is_evidence=1).
-- These columns promote them into first-class evidence records with provenance
-- and a verification lifecycle.
ALTER TABLE task_attachments ADD COLUMN evidence_type       TEXT;
ALTER TABLE task_attachments ADD COLUMN evidence_label      TEXT;
ALTER TABLE task_attachments ADD COLUMN description         TEXT;
ALTER TABLE task_attachments ADD COLUMN source              TEXT NOT NULL DEFAULT 'manual_upload';
ALTER TABLE task_attachments ADD COLUMN collected_by        INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE task_attachments ADD COLUMN collected_at        TEXT;
ALTER TABLE task_attachments ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
  CHECK (verification_status IN ('UNVERIFIED', 'VALID', 'REJECTED', 'AI_REVIEWED', 'HUMAN_VERIFIED'));

-- ─────────────────── 3. tasks → template linkage ────────────────────────
-- template_id points at the source template (SET NULL if the template is
-- deleted). template_snapshot freezes the configuration used to create the task
-- so the task never drifts when the template is edited later.
ALTER TABLE tasks ADD COLUMN template_id       INTEGER REFERENCES task_templates(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN template_snapshot TEXT;
