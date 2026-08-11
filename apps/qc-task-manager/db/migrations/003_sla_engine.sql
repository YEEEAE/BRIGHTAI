-- Configurable SLA policies, task SLA snapshots, and idempotent escalations.
CREATE TABLE IF NOT EXISTS sla_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  priority TEXT,
  department TEXT,
  task_type TEXT,
  target_duration_seconds INTEGER NOT NULL CHECK (target_duration_seconds > 0),
  warning_percent INTEGER NOT NULL DEFAULT 70 CHECK (warning_percent BETWEEN 0 AND 99),
  critical_percent INTEGER NOT NULL DEFAULT 90 CHECK (critical_percent BETWEEN 1 AND 100),
  pause_on_hold INTEGER NOT NULL DEFAULT 0 CHECK (pause_on_hold IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (critical_percent > warning_percent)
);

CREATE TABLE IF NOT EXISTS escalation_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  threshold_percent INTEGER NOT NULL CHECK (threshold_percent > 0),
  recipient_roles TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (threshold_percent, recipient_roles)
);

CREATE TABLE IF NOT EXISTS escalation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  escalation_policy_id INTEGER NOT NULL REFERENCES escalation_policies(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL UNIQUE,
  trigger_rule TEXT NOT NULL,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  triggered_at TEXT NOT NULL,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('PENDING','DELIVERED','FAILED')),
  delivered_at TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  last_error TEXT
);

ALTER TABLE tasks ADD COLUMN task_type TEXT;
ALTER TABLE tasks ADD COLUMN sla_policy_id INTEGER REFERENCES sla_policies(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN sla_started_at TEXT;
ALTER TABLE tasks ADD COLUMN sla_due_at TEXT;
ALTER TABLE tasks ADD COLUMN sla_paused_at TEXT;
ALTER TABLE tasks ADD COLUMN sla_elapsed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (sla_elapsed_seconds >= 0);
ALTER TABLE tasks ADD COLUMN sla_remaining_seconds INTEGER;
ALTER TABLE tasks ADD COLUMN sla_percent_used REAL NOT NULL DEFAULT 0 CHECK (sla_percent_used >= 0);
ALTER TABLE tasks ADD COLUMN sla_status TEXT NOT NULL DEFAULT 'NORMAL' CHECK (sla_status IN ('NORMAL','AT_RISK','CRITICAL','BREACHED','PAUSED'));

CREATE INDEX IF NOT EXISTS idx_tasks_sla_status ON tasks(sla_status);
CREATE INDEX IF NOT EXISTS idx_tasks_sla_due ON tasks(sla_due_at);
CREATE INDEX IF NOT EXISTS idx_sla_policies_match ON sla_policies(priority, department, task_type, is_active);
CREATE INDEX IF NOT EXISTS idx_escalation_events_task ON escalation_events(task_id, triggered_at);
CREATE INDEX IF NOT EXISTS idx_escalation_events_retry ON escalation_events(delivery_status, triggered_at);
