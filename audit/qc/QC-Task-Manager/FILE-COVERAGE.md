# File Coverage

| Area | Count | Method | Status |
|---|---:|---|---|
| QC tracked files | 489 | `git ls-files apps/qc-task-manager` | inventoried |
| route files | 116 | filesystem + route manifest | PASS |
| API files | 36 | `src/pages/api` | inventoried/security scanned |
| migrations | 39 | `db/migrations/*.sql` | 39/39 parity PASS |
| schema tables in schema.sql | 50 | `rg '^CREATE TABLE'` | schema test PASS |
| test scripts | 66 | `scripts/test*.mjs` | manifest classified |
| E2E scripts | 32 | `scripts/e2e*.mjs` | 28 canonical + classified remainder |
| docs | 31 | `docs/*.md` | inventoried |
| skills | 365 | `.agents/skills` + `skills-lock.json` | 365/365 hash PASS |

file coverage لا يثبت usability أو UAT أو production readiness.
