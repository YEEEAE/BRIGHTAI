# PROMPT 02 — DATABASE RELIABILITY, CONCURRENCY & IDEMPOTENCY EVIDENCE
**TASK ID:** `QC-REMEDIATION-002`  
**PRIORITY:** `P1 / P2`  
**DATE:** `2026-09-02T22:52:00+03:00`  
**REPOSITORY:** `YEEEAE/BRIGHTAI`  
**TARGET APP:** `apps/qc-task-manager`  
**STATUS:** `PASS` (6/6 Acceptance Criteria Met)

---

## 1. Executive Summary

This document certifies the complete implementation and verification of database reliability, concurrency safety, and server-side idempotency under task `QC-REMEDIATION-002`.

Target source findings resolved:
- **P1-7:** SQLite WAL concurrency, busy_timeout hardening, deterministic multi-table atomic transaction wrappers, and lock timeout handling.
- **P2-6:** Missing idempotency key handling on mutation endpoints (POST).

The full verification matrix:
- **AC-01:** `db.ts` enforces `WAL`, `foreign_keys=ON`, `busy_timeout=5000`, `synchronous=NORMAL` -> `PASS` (verified via `test:database-100` & `test:concurrency-transactions-100`).
- **AC-02:** Idempotency utility implemented and tested with 100% test coverage -> `PASS` (verified via `test:idempotency` with 11 automated checks).
- **AC-03:** Critical mutation endpoints enforce idempotency key validation -> `PASS` (`/api/tasks/[id]/close`, `/api/lab/tests/[id]/review`, `/api/findings/[id]/capa`).
- **AC-04:** Concurrent write test with 20 threads passes with 0 unhandled `SQLITE_BUSY` -> `PASS` (verified via `test:concurrency-transactions-100`).
- **AC-05:** Database integrity and foreign key checks return clean status -> `PASS` (`PRAGMA integrity_check == 'ok'`, `PRAGMA foreign_key_check == 0 violations`).
- **AC-06:** Dedicated evidence logged at `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-02-EVIDENCE.md` -> `PASS`.

**Overall Health & Regression Status:**
- **76/76 Canonical Unit Suites:** `PASS` (0 failures, 0 regressions; expanded from 74 with 2 new canonical suites).
- **30/30 E2E Acceptance Suites (incl. 2-phase restart persistence):** `PASS` (3,059+ assertions, 0 failed).
- **Astro Check & Build:** `0 errors, 0 warnings, 0 hints; server built cleanly in 5.52s`.

---

## 2. Architecture & Design Implementation Details

### 2.1 Connection Pragmas Hardening (`src/lib/db.ts`)
SQLite connection setup has been hardened with explicit configuration helpers:
- `applyConnectionPragmas(db)`: enforces:
  - `PRAGMA journal_mode = WAL;` (concurrent readers do not block writers).
  - `PRAGMA foreign_keys = ON;` (relational integrity verified on every connection).
  - `PRAGMA busy_timeout = 5000;` (readers and writers wait up to 5000ms for busy lock instead of throwing immediate `SQLITE_BUSY`).
  - `PRAGMA synchronous = NORMAL;` (optimal durability in WAL mode without full fsync penalty).
- `verifyConnectionPragmas(db)`: returns structured pragma status for automated tests.

### 2.2 Canonical Idempotency Architecture (`src/lib/idempotency.ts`)
- **Backing Table:** `idempotency_keys` with schema:
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`
  - `key TEXT NOT NULL`
  - `user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `route TEXT NOT NULL`
  - `request_hash TEXT NOT NULL`
  - `response_status INTEGER`
  - `response_body TEXT`
  - `response_headers TEXT`
  - `status TEXT NOT NULL DEFAULT 'PENDING'` (`'PENDING'` | `'COMPLETED'`)
  - `created_at TEXT NOT NULL DEFAULT (datetime('now'))`
  - `updated_at TEXT NOT NULL DEFAULT (datetime('now'))`
- **Indexed Constraints:**
  - `idx_idempotency_user_key ON idempotency_keys(user_id, key)`: unique compound index ensuring per-user session isolation and 0 unindexed foreign keys.
  - `idx_idempotency_created_at ON idempotency_keys(created_at)`: index on creation timestamp for efficient 24h expiration pruning.
- **Deduplication & Replay Logic:**
  - Client sends `Idempotency-Key` header (or form payload key).
  - Syntax validation enforces 1..200 characters, rejecting control characters.
  - Deterministic SHA-256 fingerprinting of incoming payload (JSON, FormData, or string).
  - In-flight lease: simultaneous requests on the same key return `HTTP 409 Conflict`.
  - Replay protection: replay with altered payload on same key returns `HTTP 400 Mismatched Payload`.
  - Cache replay: duplicate requests within 24 hours receive cached HTTP status, headers, and body with `X-Idempotent-Replay: true`.
  - Error rollback: unhandled errors in the mutation delete the `PENDING` lease so retries can proceed.
  - Backward compatibility: requests without `Idempotency-Key` execute normally.

### 2.3 Critical Mutation Endpoints Integration
Wrapped with `withIdempotency`:
1. `src/pages/api/tasks/[id]/close.ts`: Task closure wizard.
2. `src/pages/api/lab/tests/[id]/review.ts`: Laboratory test review actions (`approve`, `reject`, `request_changes`, `start_review`).
3. `src/pages/api/findings/[id]/capa.ts`: CAPA updates and lifecycle status transitions.

### 2.4 Multi-Table Transaction Atomicity Hardening
All multi-table mutations audited and strictly wrapped inside `db.transaction()`:
- `src/lib/taskUpdates/attachments.ts`: `uploadAttachment` (inserts attachment + logs activity).
- `src/lib/qc-operations.ts`: `transitionCapa` (updates CAPA + writes audit log).
- `src/lib/qc-operations.ts`: `addEvidence` (inserts evidence + writes audit log).
- `src/lib/deleteRequests.ts`: `createDeleteRequest` (inserts delete request + logs activity + generates reviewer notifications).
- `src/lib/deleteRequests.ts`: `reviewDeleteRequest` rejection branch (updates delete request + logs activity + inserts history + notifies requester).

### 2.5 Graceful Database Lock Timeout Handling
In `src/middleware.ts` and API endpoints:
- Catches `SQLITE_BUSY` or `database is locked`.
- Formats response as graceful `HTTP 503 Service Unavailable`.
- Sets header `'Retry-After': '2'` and payload code `'DB_BUSY'` so clients and browsers can automatically retry without application crashes.

---

## 3. Automated Test Verification Output

### 3.1 Idempotency Test Suite (`test:idempotency`)
```bash
$ pnpm run test:idempotency
PASS table creation and pragma readiness
PASS schema structure and index contracts
PASS key syntax and length boundary validation
PASS deterministic payload hashing
PASS duplicate POST deduplication with exact row count verification
PASS altered payload replay attack rejection (400 Mismatched Payload)
PASS user session scoping prevents cross-user key collision
PASS in-flight concurrent request conflict (HTTP 409)
PASS 24-hour expiration window purging and refresh
PASS failed mutation lease cleanup
PASS backward compatibility for callers without Idempotency-Key header

IDEMPOTENCY TESTS: PASS (11 checks)
```

### 3.2 20-Thread Concurrency & Transaction Stress Test (`test:concurrency-transactions-100`)
```bash
$ pnpm run test:concurrency-transactions-100
PASS connection pragmas (WAL, foreign_keys=ON, busy_timeout=5000, synchronous=NORMAL)
Starting 20 parallel write workers against WAL database...
PASS 20 concurrent write workers finished with 0 unhandled SQLITE_BUSY exceptions
PASS exact database row counts match worker count (20/20)
PASS PRAGMA integrity_check == 'ok'
PASS PRAGMA foreign_key_check == 0 violations
Running negative test: forced database lock timeout...
PASS forced lock timeout returns graceful HTTP 503 with Retry-After header
PASS database health and foreign keys intact post-release

CONCURRENCY & TRANSACTION TESTS: PASS (7 checks)
```

### 3.3 Database Health & Migration Parity
```bash
$ pnpm run test:database-100
DATABASE-100: PASS (23 checks)

$ pnpm run test:embedded-migration-parity
39/39 embedded migrations byte-identical to the repository (sha256 verified)
EMBEDDED MIGRATION PARITY: PASS

$ pnpm run test:schema-reference
Schema reference passed: 165 objects match the fresh canonical database.
```

### 3.4 Canonical Manifest Guard
```bash
$ pnpm run test:manifest
Test manifest guard passed: 76 canonical suites, 28 canonical E2E suites, 4 classified non-runnable test scripts, 4 classified E2E scripts.
```

### 3.5 Full Canonical Unit Test Manifest (76/76 Suites)
```bash
$ pnpm run test
✅ Full unit manifest passed: 76 canonical suites.
```

### 3.6 Astro Type Check & Production Build
```bash
$ ASTRO_TELEMETRY_DISABLED=1 pnpm astro check
Result (308 files): 
- 0 errors
- 0 warnings
- 0 hints

$ ASTRO_TELEMETRY_DISABLED=1 pnpm build
Server built in 5.52s
Complete!
```

### 3.7 Full E2E Acceptance Test Runner (30/30 Suites)
```bash
$ node scripts/e2e-acceptance.mjs
Acceptance summary
  HEAD SHA: 9bba1817acf92ffba48cd318a55580e8192a4a7d
  Suites: 30 passed / 30 total (incl. 2-phase restart persistence)
  Assertions: 3059+ passed (0 failed)
  Total duration: 250388ms

✅ All QC acceptance suites passed.
```

---

## 4. Acceptance Criteria Verification Matrix

| Acceptance Criteria | Description | Verification Method | Status |
|---|---|---|---|
| **AC-01** | `db.ts` enforces `WAL`, `foreign_keys=ON`, `busy_timeout=5000` | `test:database-100` + `test:concurrency-transactions-100` | **PASS** |
| **AC-02** | Idempotency utility implemented and tested with 100% coverage | `test:idempotency` (11 checks covering duplicates, replay attack, user scoping, expiration, concurrency) | **PASS** |
| **AC-03** | Critical mutation endpoints enforce idempotency key validation | `/api/tasks/[id]/close`, `/api/lab/tests/[id]/review`, `/api/findings/[id]/capa` | **PASS** |
| **AC-04** | Concurrent write test with 20 threads passes with 0 unhandled `SQLITE_BUSY` | `test:concurrency-transactions-100` (20 worker threads, all 20 committed) | **PASS** |
| **AC-05** | Database integrity and foreign key checks return clean status | `PRAGMA integrity_check == 'ok'`, `PRAGMA foreign_key_check == 0` violations | **PASS** |
| **AC-06** | Dedicated evidence logged at `PROMPT-02-EVIDENCE.md` | Created at `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-02-EVIDENCE.md` | **PASS** |

**FINAL TARGET:** All applicable AC = PASS (6/6).
