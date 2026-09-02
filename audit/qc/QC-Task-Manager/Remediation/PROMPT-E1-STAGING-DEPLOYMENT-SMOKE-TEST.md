# PROMPT E1 — STAGING DEPLOYMENT & PERSISTENT STORAGE SMOKE TEST

TASK ID:
QC-RUNBOOK-E01

TYPE:
Operational Infrastructure Verification Runbook

PRIMARY ACTORS:
DevOps Engineer, Cloud Platform SRE.

DEPENDS ON:
GATE C.

SOURCE FINDINGS:
- Domains 31 (Deployment), 80 (Environment Management), 7 (Database Reliability).

MISSION:
Deploy the production standalone build to a staging container/VM environment with persistent volume storage, verify TLS termination, CSP headers, reverse proxy configuration (Nginx / Cloudflare), and execute live smoke tests.

PROCEDURE:
1. Deploy container image / Node process using `apps/qc-task-manager/dist`.
2. Mount dedicated persistent SSD volume for SQLite database directory (`/data/qc.db`).
3. Configure Nginx reverse proxy with HTTPS, HTTP/2, and strict Security Headers (CSP, HSTS, X-Content-Type-Options).
4. Run automated smoke tests:
   - Login, create task, upload attachment, verify file saved to persistent disk.
   - Restart container -> verify all data, sessions, and attachments persist without corruption.

ACCEPTANCE CRITERIA:
- AC-01: Staging deployment live and responding with HTTP 200 on HTTPS endpoint.
- AC-02: Security headers verified via `curl -I`.
- AC-03: Persistent volume survives container restart with zero data loss.
- AC-04: Deployment verification documented in `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-E1-STAGING-EVIDENCE.md`.
