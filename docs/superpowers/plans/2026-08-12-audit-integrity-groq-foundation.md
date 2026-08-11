# Audit Integrity and Groq AI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a verifiable SHA-256 audit chain to `task_activity_log` and a server-only, validated, rate-limited Groq AI foundation.

**Architecture:** A sequential SQLite migration adds hash fields, backfills legacy activity rows deterministically, and `activity.ts` becomes the only application writer for chained events. The AI layer uses `service.ts` as the feature boundary, `groq.ts` as the centralized provider, Zod schemas/guardrails for output validation, and a separate sanitized AI audit table.

**Tech Stack:** Astro SSR, TypeScript, better-sqlite3, native `fetch`, Node `crypto`, Zod, SQLite migrations.

---

### Task 1: Audit chain contract and migration

**Files:**
- Create: `apps/qc-task-manager/db/migrations/007_audit_integrity.sql`
- Modify: `apps/qc-task-manager/src/lib/migrations.ts` only through migration discovery (no runner redesign)
- Test: `apps/qc-task-manager/scripts/test-audit-integrity.mjs`

- [ ] Add `previous_hash` and `event_hash` columns/index to `task_activity_log`, preserving existing rows and backfilling them in id order with the documented canonical serialization.
- [ ] Add tests for deterministic hashes, tamper detection, first-invalid reporting, and legacy backfill.

### Task 2: Chained activity writer and verifier

**Files:**
- Modify: `apps/qc-task-manager/src/lib/activity.ts`
- Modify: `apps/qc-task-manager/src/lib/audit/index.ts`
- Modify: `apps/qc-task-manager/src/lib/seed.ts` only where direct activity inserts bypass the writer
- Test: `apps/qc-task-manager/scripts/test-audit-integrity.mjs`

- [ ] Implement the fixed-key canonical event JSON and SHA-256 calculation.
- [ ] Make `logActivity` append atomically with the latest hash and explicit UTC timestamp.
- [ ] Implement `verifyAuditChain()` returning PASS/FAIL, first invalid event, expected hash, and actual hash.
- [ ] Document that the chain detects tampering but does not make SQLite physically immutable.

### Task 3: Groq provider and AI service

**Files:**
- Create: `apps/qc-task-manager/src/lib/ai/{types,provider,groq,prompts,schemas,guardrails,service}.ts`
- Modify: `apps/qc-task-manager/src/lib/ai/index.ts`
- Create: `apps/qc-task-manager/db/migrations/008_ai_audit.sql`
- Test: `apps/qc-task-manager/scripts/test-ai-foundation.mjs`

- [ ] Add server-only provider configuration with `AI_MODEL` fallback `llama-3.3-70b-versatile`, `GROQ_API_KEY`, timeout, and bounded transient retries.
- [ ] Add safe structured-output parsing through Zod and sanitized failure handling.
- [ ] Add per-user/feature in-memory rate limiting and sanitized AI audit persistence.
- [ ] Ensure no browser/public env imports or secret/header logging exists.

### Task 4: Environment and documentation

**Files:**
- Modify: `apps/qc-task-manager/.env.example`
- Create or update ignored: `apps/qc-task-manager/.env`
- Modify: `.gitignore` only if needed
- Create: `docs/AI-ARCHITECTURE.md`
- Modify: `apps/qc-task-manager/scripts/test.mjs`, `scripts/test-migrations.mjs`, package scripts

- [ ] Keep the example secret-free and ensure `.env` is ignored.
- [ ] Document provider, model, environment, data flow, security, privacy, timeout/retry behavior, rate limiting, and audit references.
- [ ] Add focused test commands to the QC package and update migration counts.

### Task 5: Verification

- [ ] Run focused audit and AI tests red/green during implementation.
- [ ] Run QC test suite, typecheck, production build, security hygiene, architecture guard, and diff checks.
- [ ] Update `.agents/brain.md` with files, evidence, limitations, and the new ledger entry; do not commit or push.
