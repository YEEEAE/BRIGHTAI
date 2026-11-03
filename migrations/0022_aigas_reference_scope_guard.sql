-- 0022 — Reference scope guard for client-supplied operation identifiers.
--
-- REVIEW ONLY — DO NOT APPLY AUTOMATICALLY.
-- Applies to an approved isolated environment first; production requires the
-- platform owner's written approval, a verified backup/restore point and a
-- maintenance decision. This file creates indexes only; it does not change
-- rows, grants, policies or application data.
--
-- Why: `aigas_fw_decisions.request_id` and `aigas_sc_requests.id` are supplied
-- by the caller (a Firewall request UUID or a Secure Chat request UUID). The
-- current unique keys are tenant-scoped, so the same identifier could be used
-- by two workspaces. Server code now refuses a foreign-tenant reference before
-- writing; these indexes make the rule durable in PostgreSQL and give the
-- lookup an index instead of a table scan.
--
-- Pre-check before applying:
--   SELECT request_id, count(DISTINCT tenant_id) AS tenants
--   FROM public.aigas_fw_decisions
--   WHERE request_id IS NOT NULL
--   GROUP BY request_id HAVING count(DISTINCT tenant_id) > 1;
--
--   SELECT id, count(DISTINCT tenant_id) AS tenants
--   FROM public.aigas_sc_requests
--   GROUP BY id HAVING count(DISTINCT tenant_id) > 1;
--
-- Both queries must return zero rows. If they do not, stop: resolve the
-- conflicting references with an approved incident process; do not delete
-- evidence or rewrite history to make the index apply.
--
-- Rollback:
--   DROP INDEX IF EXISTS public.aigas_fw_decisions_request_scope_idx;
--   DROP INDEX IF EXISTS public.aigas_sc_requests_scope_idx;
--
-- Human approval point: platform owner + security review.
BEGIN;

CREATE UNIQUE INDEX aigas_fw_decisions_request_scope_idx
  ON public.aigas_fw_decisions(request_id)
  WHERE request_id IS NOT NULL;

CREATE UNIQUE INDEX aigas_sc_requests_scope_idx
  ON public.aigas_sc_requests(id);

COMMIT;
