-- QC Operations Platform: findings, RCA, CAPA, evidence, and audit.
CREATE TABLE IF NOT EXISTS qc_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_number TEXT NOT NULL UNIQUE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('conforming','observation','minor','major','critical')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  risk_description TEXT NOT NULL,
  requirement_reference TEXT,
  owner INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','ACTION_REQUIRED','VERIFICATION','CLOSED','REOPENED')),
  closure_evidence TEXT,
  closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  closed_at TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qc_rca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER NOT NULL UNIQUE REFERENCES qc_findings(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('5_WHYS','FISHBONE','FREE_FORM')),
  free_form TEXT,
  why_1 TEXT, why_2 TEXT, why_3 TEXT, why_4 TEXT, why_5 TEXT,
  fishbone_json TEXT,
  updated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qc_capa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER NOT NULL UNIQUE REFERENCES qc_findings(id) ON DELETE CASCADE,
  problem_statement TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  corrective_action TEXT NOT NULL,
  preventive_action TEXT NOT NULL,
  owner INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_date TEXT,
  evidence TEXT,
  effectiveness_check TEXT,
  reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approval TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','OPEN','IMPLEMENTATION','VERIFICATION','EFFECTIVE','CLOSED','REOPENED')),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qc_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER REFERENCES qc_findings(id) ON DELETE CASCADE,
  capa_id INTEGER REFERENCES qc_capa(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  reference TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((finding_id IS NOT NULL AND capa_id IS NULL) OR (finding_id IS NULL AND capa_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS qc_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('FINDING','RCA','CAPA','EVIDENCE')),
  entity_id INTEGER NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','STATUS_TRANSITION','APPROVAL','REJECTION','CLOSURE','REOPEN')),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qc_findings_task ON qc_findings(task_id);
CREATE INDEX IF NOT EXISTS idx_qc_findings_owner_status ON qc_findings(owner,status);
CREATE INDEX IF NOT EXISTS idx_qc_findings_due ON qc_findings(due_date);
CREATE INDEX IF NOT EXISTS idx_qc_rca_finding ON qc_rca(finding_id);
CREATE INDEX IF NOT EXISTS idx_qc_capa_finding_status ON qc_capa(finding_id,status);
CREATE INDEX IF NOT EXISTS idx_qc_evidence_finding ON qc_evidence(finding_id);
CREATE INDEX IF NOT EXISTS idx_qc_evidence_capa ON qc_evidence(capa_id);
CREATE INDEX IF NOT EXISTS idx_qc_audit_entity ON qc_audit_log(entity_type,entity_id,created_at);
