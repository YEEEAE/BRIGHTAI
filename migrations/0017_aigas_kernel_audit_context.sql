-- Local additive migration. Do not apply to production without operator approval.
-- Adds bounded identifiers only; no request or customer content is stored.
BEGIN;

ALTER TABLE public.aigas_audit_events
  ADD COLUMN correlation_id uuid,
  ADD COLUMN policy_version text,
  ADD COLUMN idempotency_key text;

ALTER TABLE public.aigas_audit_events
  ADD CONSTRAINT aigas_audit_events_policy_version_check
    CHECK (policy_version IS NULL OR policy_version ~ '^[a-zA-Z0-9_.:-]{1,120}$'),
  ADD CONSTRAINT aigas_audit_events_idempotency_key_check
    CHECK (idempotency_key IS NULL OR idempotency_key ~ '^[a-zA-Z0-9_.:-]{1,180}$');

CREATE UNIQUE INDEX aigas_audit_events_tenant_idempotency_idx
  ON public.aigas_audit_events(tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMIT;
