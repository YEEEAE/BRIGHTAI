-- EVAL-CERT-001 (2026-08-03): Evaluation runs + signed certificates.
--
-- Non-tenant (public kernel marketing feature) — like lead_queue, these
-- bypass RLS via dbServiceRole (BYPASSRLS). No organization_id.

-- Signing keys registry (rotation; certificates reference publicKeyId)
CREATE TABLE "signing_keys" (
  "id"          TEXT NOT NULL,
  "publicKeyId" TEXT NOT NULL,
  "algorithm"   TEXT NOT NULL DEFAULT 'Ed25519',
  "publicKeyPem" TEXT NOT NULL,
  "signedBy"    TEXT NOT NULL DEFAULT 'يزيد البديوي',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt"   TIMESTAMP(3),
  CONSTRAINT "signing_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "signing_keys_publicKeyId_key" ON "signing_keys"("publicKeyId");
CREATE INDEX "signing_keys_publicKeyId_idx" ON "signing_keys"("publicKeyId");

-- Evaluation runs (partial-saving/resume/replay-friendly)
CREATE TABLE "evaluation_runs" (
  "id"                 TEXT NOT NULL,
  "evaluationId"       TEXT NOT NULL,
  "parentEvaluationId" TEXT,
  "name"               TEXT NOT NULL,
  "status"             "EvalRunStatus" NOT NULL DEFAULT 'running',
  "gate"               "EvalGate" NOT NULL DEFAULT 'incomplete',
  "environment"        "EvalEnvironment" NOT NULL DEFAULT 'demo',
  "provider"           TEXT NOT NULL DEFAULT 'simulated',
  "datasetId"          TEXT NOT NULL,
  "datasetVersion"     INTEGER NOT NULL,
  "datasetHash"        TEXT NOT NULL,
  "policyId"           TEXT NOT NULL,
  "policyVersion"      INTEGER NOT NULL,
  "policyHash"         TEXT NOT NULL,
  "modelId"            TEXT NOT NULL,
  "modelName"          TEXT NOT NULL,
  "modelVersion"       INTEGER NOT NULL,
  "modelProvider"      TEXT NOT NULL,
  "promptId"           TEXT NOT NULL,
  "promptVersion"      INTEGER NOT NULL,
  "totalCases"         INTEGER NOT NULL DEFAULT 0,
  "completedCases"     INTEGER NOT NULL DEFAULT 0,
  "failedCases"        INTEGER NOT NULL DEFAULT 0,
  "criticalCount"      INTEGER NOT NULL DEFAULT 0,
  "humanReviewCount"   INTEGER NOT NULL DEFAULT 0,
  "costSar"            DECIMAL(10,4) NOT NULL DEFAULT 0,
  "p50Ms"              INTEGER NOT NULL DEFAULT 0,
  "p95Ms"              INTEGER NOT NULL DEFAULT 0,
  "p99Ms"              INTEGER NOT NULL DEFAULT 0,
  "inputHash"          TEXT NOT NULL,
  "outputHash"         TEXT NOT NULL,
  "runHash"            TEXT NOT NULL,
  "version"            INTEGER NOT NULL DEFAULT 1,
  "immutable"          BOOLEAN NOT NULL DEFAULT false,
  "startedAt"          TIMESTAMP(3) NOT NULL,
  "finishedAt"         TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "evaluation_runs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "evaluation_runs_evaluationId_key" ON "evaluation_runs"("evaluationId");
CREATE INDEX "evaluation_runs_environment_createdAt_idx" ON "evaluation_runs"("environment", "createdAt");
CREATE INDEX "evaluation_runs_status_idx" ON "evaluation_runs"("status");

-- Per-case results (caseId unique within run; no edits after save)
CREATE TABLE "evaluation_cases" (
  "id"            TEXT NOT NULL,
  "runId"         TEXT NOT NULL,
  "caseId"        TEXT NOT NULL,
  "traceId"       TEXT NOT NULL,
  "state"         TEXT NOT NULL,
  "expected"      TEXT NOT NULL,
  "actual"        TEXT NOT NULL,
  "riskLevel"     TEXT NOT NULL,
  "piiTypes"      JSONB NOT NULL DEFAULT '[]',
  "injectionDetected" BOOLEAN NOT NULL DEFAULT false,
  "scorerResults" JSONB NOT NULL DEFAULT '{}',
  "costSar"       DECIMAL(10,4) NOT NULL DEFAULT 0,
  "latencyMs"     INTEGER NOT NULL DEFAULT 0,
  "inputHash"     TEXT NOT NULL,
  "outputHash"    TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evaluation_cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "evaluation_cases_runId_caseId_key" ON "evaluation_cases"("runId", "caseId");
CREATE INDEX "evaluation_cases_runId_idx" ON "evaluation_cases"("runId");
ALTER TABLE "evaluation_cases" ADD CONSTRAINT "evaluation_cases_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Certificates (signed; revoke-only, never delete)
CREATE TABLE "evaluation_certificates" (
  "id"              TEXT NOT NULL,
  "certificateId"   TEXT NOT NULL,
  "runId"           TEXT NOT NULL,
  "signedBy"        TEXT NOT NULL DEFAULT 'يزيد البديوي',
  "environment"     "EvalEnvironment" NOT NULL DEFAULT 'demo',
  "gate"            "EvalGate" NOT NULL,
  "signedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signedByKeyId"   TEXT NOT NULL DEFAULT 'v1',
  "signature"       TEXT NOT NULL,
  "payloadDigest"   TEXT NOT NULL,
  "verifyUrl"       TEXT NOT NULL,
  "revokedAt"       TIMESTAMP(3),
  "revokedBy"       TEXT,
  "revocationReason" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evaluation_certificates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "evaluation_certificates_certificateId_key" ON "evaluation_certificates"("certificateId");
CREATE INDEX "evaluation_certificates_runId_idx" ON "evaluation_certificates"("runId");
ALTER TABLE "evaluation_certificates" ADD CONSTRAINT "evaluation_certificates_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Immutable audit trail (hash chain for tamper-evidence)
CREATE TABLE "evaluation_audit_events" (
  "id"            TEXT NOT NULL,
  "evaluationId"  TEXT NOT NULL,
  "certificateId" TEXT,
  "action"        TEXT NOT NULL,
  "actor"         TEXT NOT NULL DEFAULT 'system',
  "metadata"      JSONB NOT NULL DEFAULT '{}',
  "prevHash"      TEXT,
  "hash"          TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evaluation_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "evaluation_audit_events_evaluationId_idx" ON "evaluation_audit_events"("evaluationId");
CREATE INDEX "evaluation_audit_events_certificateId_idx" ON "evaluation_audit_events"("certificateId");
CREATE INDEX "evaluation_audit_events_createdAt_idx" ON "evaluation_audit_events"("createdAt");
