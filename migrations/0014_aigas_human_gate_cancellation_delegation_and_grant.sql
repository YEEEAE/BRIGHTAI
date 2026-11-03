-- REVIEW ONLY. Requires 0004, 0006 and 0007. Not applied by this change.
-- Adds CANCELLED, provider binding v3, review level/SoD policy, time-boxed
-- delegation and a single-use execution permit. No seeds, grants or data are inserted.
BEGIN;

ALTER TABLE public.aigas_hg_policies
 ADD COLUMN review_level text NOT NULL DEFAULT 'ADMIN' CHECK (review_level IN ('ADMIN','OWNER')),
 ADD COLUMN separation_of_duties boolean NOT NULL DEFAULT true,
 ADD COLUMN delegation_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.aigas_hg_requests
 ADD COLUMN provider_ref text,
 ADD COLUMN cancelled_at timestamptz,
 ADD COLUMN cancelled_by uuid REFERENCES neon_auth."user"(id),
 ADD COLUMN cancel_reason text;

UPDATE public.aigas_hg_requests
 SET provider_ref=CASE operation_type WHEN 'INTERNAL_DEMO_NOTE' THEN 'aigas-internal' ELSE 'aigas-kernel' END
 WHERE provider_ref IS NULL;
ALTER TABLE public.aigas_hg_requests ALTER COLUMN provider_ref SET NOT NULL;
ALTER TABLE public.aigas_hg_requests
 ADD CONSTRAINT aigas_hg_requests_provider_ref_check CHECK (provider_ref IN ('aigas-kernel','aigas-internal'));

ALTER TABLE public.aigas_hg_requests DROP CONSTRAINT IF EXISTS aigas_hg_requests_status_check;
ALTER TABLE public.aigas_hg_requests DROP CONSTRAINT IF EXISTS aigas_hg_requests_terminal_reason_check;
ALTER TABLE public.aigas_hg_requests
 ADD CONSTRAINT aigas_hg_requests_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED','CANCELLED','EXECUTED')),
 ADD CONSTRAINT aigas_hg_requests_terminal_reason_check CHECK (terminal_reason IS NULL OR terminal_reason IN ('TIMEOUT','POLICY_CHANGED','TARGET_CHANGED','AUTHORITY_CHANGED','LEGACY_UNBOUND','BINDING_UPGRADED','CANCELLED_BY_REQUESTER','CANCELLED_BY_REVIEWER')),
 ADD CONSTRAINT aigas_hg_requests_cancelled_at_check CHECK ((status='CANCELLED')=(cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND cancel_reason IS NOT NULL));

-- Binding v3 includes provider_ref. Older unbound approvals cannot authorize it.
UPDATE public.aigas_hg_requests
 SET status='EXPIRED',terminal_reason='BINDING_UPGRADED'
 WHERE status IN ('PENDING','APPROVED');

ALTER TABLE public.aigas_hg_events DROP CONSTRAINT IF EXISTS aigas_hg_events_event_type_check;
ALTER TABLE public.aigas_hg_events
 ADD CONSTRAINT aigas_hg_events_event_type_check CHECK (event_type IN ('CREATED','APPROVED','REJECTED','EXPIRED','CANCELLED','EXECUTED'));

CREATE OR REPLACE FUNCTION public.aigas_hg_request_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Request history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'PENDING' OR NEW.payload_digest IS NULL OR NEW.expires_at<=clock_timestamp()
    OR NOT EXISTS (SELECT 1 FROM public.aigas_hg_policies p WHERE p.tenant_id=NEW.tenant_id AND p.version::text=NEW.policy_version AND p.enabled)
  THEN RAISE EXCEPTION 'Bound pending request and current policy required' USING ERRCODE='23514'; END IF;
 ELSE
  IF ROW(NEW.id,NEW.tenant_id,NEW.requester_id,NEW.title,NEW.description,NEW.reason,NEW.operation_scope,NEW.operation_type,NEW.subject_ref,NEW.payload,NEW.payload_digest,NEW.policy_version,NEW.provider_ref,NEW.created_at)
   IS DISTINCT FROM ROW(OLD.id,OLD.tenant_id,OLD.requester_id,OLD.title,OLD.description,OLD.reason,OLD.operation_scope,OLD.operation_type,OLD.subject_ref,OLD.payload,OLD.payload_digest,OLD.policy_version,OLD.provider_ref,OLD.created_at)
   OR NOT ((OLD.status='PENDING' AND NEW.status IN ('APPROVED','REJECTED','EXPIRED','CANCELLED'))
     OR (OLD.status='APPROVED' AND NEW.status IN ('EXECUTED','EXPIRED','CANCELLED')))
   OR NEW.expires_at>OLD.expires_at
   OR (NEW.expires_at IS DISTINCT FROM OLD.expires_at AND NOT (OLD.status='PENDING' AND NEW.status='APPROVED'))
  THEN RAISE EXCEPTION 'Immutable request or invalid transition' USING ERRCODE='23514'; END IF;
  IF NEW.status IN ('APPROVED','REJECTED','EXECUTED','CANCELLED') AND NEW.expires_at<=clock_timestamp()
  THEN RAISE EXCEPTION 'Request expired' USING ERRCODE='23514'; END IF;
  IF NEW.status='CANCELLED' THEN
   IF NEW.cancelled_by IS NULL OR NEW.cancel_reason IS NULL THEN RAISE EXCEPTION 'Cancellation evidence required' USING ERRCODE='23514'; END IF;
   IF NEW.cancelled_by<>NEW.requester_id AND NOT EXISTS (
    SELECT 1 FROM public.aigas_memberships m WHERE m.tenant_id=NEW.tenant_id AND m.user_id=NEW.cancelled_by AND m.role IN ('OWNER','ADMIN')
   ) THEN RAISE EXCEPTION 'Cancellation not authorized' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.status IN ('APPROVED','REJECTED','EXECUTED') AND NOT EXISTS (
   SELECT 1 FROM public.aigas_hg_decisions d WHERE d.tenant_id=NEW.tenant_id AND d.request_id=NEW.id
    AND d.payload_digest=NEW.payload_digest AND d.policy_version=NEW.policy_version
    AND d.decision=CASE WHEN NEW.status='REJECTED' THEN 'REJECT' ELSE 'APPROVE' END
  ) THEN RAISE EXCEPTION 'Bound decision required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;

ALTER TABLE public.aigas_hg_decisions DROP CONSTRAINT IF EXISTS aigas_hg_decisions_check;
ALTER TABLE public.aigas_hg_decisions
 ADD COLUMN delegation_id uuid,
 ADD COLUMN authority_level text CHECK (authority_level IS NULL OR authority_level IN ('ADMIN','OWNER'));

CREATE TABLE public.aigas_hg_delegations (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
 delegator_id uuid NOT NULL REFERENCES neon_auth."user"(id),
 delegatee_id uuid NOT NULL REFERENCES neon_auth."user"(id),
 operation_type text NOT NULL CHECK (operation_type IN ('KERNEL_WORKSPACE_RENAME','INTERNAL_DEMO_NOTE')),
 level text NOT NULL CHECK (level IN ('ADMIN','OWNER')),
 delegator_role text NOT NULL CHECK (delegator_role IN ('OWNER','ADMIN')),
 reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 2 AND 500),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 starts_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 revoked_by uuid REFERENCES neon_auth."user"(id),
 revoke_reason text,
 CHECK (delegatee_id<>delegator_id),
 CHECK (expires_at>starts_at),
 CHECK (level='ADMIN' OR delegator_role='OWNER'),
 CHECK ((revoked_at IS NULL)=(revoked_by IS NULL)),
 CHECK (revoked_at IS NULL OR (revoke_reason IS NOT NULL AND char_length(btrim(revoke_reason)) BETWEEN 2 AND 500))
);
ALTER TABLE public.aigas_hg_decisions
 ADD CONSTRAINT aigas_hg_decisions_delegation_fk FOREIGN KEY (delegation_id) REFERENCES public.aigas_hg_delegations(id);
CREATE INDEX aigas_hg_delegations_active_idx ON public.aigas_hg_delegations(tenant_id,delegatee_id,operation_type,expires_at) WHERE revoked_at IS NULL;

CREATE FUNCTION public.aigas_hg_delegation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Delegation history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Delegation must expire in the future' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.aigas_memberships m WHERE m.tenant_id=NEW.tenant_id AND m.user_id=NEW.delegator_id AND m.role=NEW.delegator_role)
   THEN RAISE EXCEPTION 'Delegator role mismatch' USING ERRCODE='23514'; END IF;
  IF (CASE NEW.level WHEN 'OWNER' THEN 3 ELSE 2 END) > (CASE NEW.delegator_role WHEN 'OWNER' THEN 3 ELSE 2 END)
   THEN RAISE EXCEPTION 'Delegation exceeds delegator authority' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id WHERE m.tenant_id=NEW.tenant_id AND m.user_id=NEW.delegatee_id AND u.banned IS NOT TRUE)
   THEN RAISE EXCEPTION 'Delegatee must be an active member' USING ERRCODE='23514'; END IF;
 ELSE
  IF ROW(NEW.id,NEW.tenant_id,NEW.delegator_id,NEW.delegatee_id,NEW.operation_type,NEW.level,NEW.delegator_role,NEW.reason,NEW.created_at,NEW.starts_at,NEW.expires_at)
   IS DISTINCT FROM ROW(OLD.id,OLD.tenant_id,OLD.delegator_id,OLD.delegatee_id,OLD.operation_type,OLD.level,OLD.delegator_role,OLD.reason,OLD.created_at,OLD.starts_at,OLD.expires_at)
   OR OLD.revoked_at IS NOT NULL OR NEW.revoked_at IS NULL
  THEN RAISE EXCEPTION 'Delegation is immutable except one revocation' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER aigas_hg_delegation_guard BEFORE INSERT OR UPDATE OR DELETE ON public.aigas_hg_delegations FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_delegation_guard();

CREATE FUNCTION public.aigas_hg_decision_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 request_type text;
 required_level text;
 sod boolean;
BEGIN
 IF NEW.authority_level IS NULL THEN RAISE EXCEPTION 'Decision authority level required' USING ERRCODE='23514'; END IF;
 SELECT r.operation_type,p.review_level,p.separation_of_duties INTO request_type,required_level,sod
  FROM public.aigas_hg_requests r JOIN public.aigas_hg_policies p ON p.tenant_id=r.tenant_id
  WHERE r.tenant_id=NEW.tenant_id AND r.id=NEW.request_id;
 IF request_type IS NULL THEN RAISE EXCEPTION 'Decision task not found' USING ERRCODE='23514'; END IF;
 IF NEW.reviewer_id=NEW.requester_id AND (request_type='KERNEL_WORKSPACE_RENAME' OR sod) THEN
  RAISE EXCEPTION 'Separation of duties required' USING ERRCODE='23514';
 END IF;
 IF (CASE NEW.authority_level WHEN 'OWNER' THEN 3 ELSE 2 END) < (CASE required_level WHEN 'OWNER' THEN 3 ELSE 2 END) THEN
  RAISE EXCEPTION 'Decision below required review level' USING ERRCODE='23514';
 END IF;
 IF NEW.delegation_id IS NOT NULL THEN
  IF NOT EXISTS (
   SELECT 1 FROM public.aigas_hg_delegations d JOIN public.aigas_memberships dm ON dm.tenant_id=d.tenant_id AND dm.user_id=d.delegator_id
   WHERE d.id=NEW.delegation_id AND d.tenant_id=NEW.tenant_id AND d.delegatee_id=NEW.reviewer_id
    AND d.operation_type=request_type AND d.revoked_at IS NULL AND d.starts_at<=clock_timestamp() AND d.expires_at>clock_timestamp()
    AND (CASE d.level WHEN 'OWNER' THEN 3 ELSE 2 END) >= (CASE required_level WHEN 'OWNER' THEN 3 ELSE 2 END)
    AND (CASE dm.role WHEN 'OWNER' THEN 3 WHEN 'ADMIN' THEN 2 ELSE 1 END) >= (CASE d.level WHEN 'OWNER' THEN 3 ELSE 2 END)
  ) THEN RAISE EXCEPTION 'Decision delegation is not active or sufficient' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER aigas_hg_decision_guard BEFORE INSERT ON public.aigas_hg_decisions FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_decision_guard();

CREATE TABLE public.aigas_hg_grants (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL,
 request_id uuid NOT NULL UNIQUE,
 requester_id uuid NOT NULL,
 reviewer_id uuid NOT NULL REFERENCES neon_auth."user"(id),
 operation_type text NOT NULL CHECK (operation_type IN ('KERNEL_WORKSPACE_RENAME','INTERNAL_DEMO_NOTE')),
 subject_ref uuid NOT NULL,
 payload_digest text NOT NULL CHECK (payload_digest ~ '^[0-9a-f]{64}$'),
 policy_version text NOT NULL,
 issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CONSUMED','REVOKED','EXPIRED')),
 consumed_at timestamptz,
 consumed_by uuid REFERENCES neon_auth."user"(id),
 FOREIGN KEY (tenant_id,request_id,requester_id) REFERENCES public.aigas_hg_requests(tenant_id,id,requester_id),
 CHECK (expires_at>issued_at),
 CHECK ((status='CONSUMED')=(consumed_at IS NOT NULL AND consumed_by IS NOT NULL))
);
CREATE INDEX aigas_hg_grants_tenant_status_idx ON public.aigas_hg_grants(tenant_id,status,expires_at);

CREATE FUNCTION public.aigas_hg_grant_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Execution permits cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'ACTIVE' OR NEW.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Only an active future permit can be issued' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (
   SELECT 1 FROM public.aigas_hg_requests r WHERE r.tenant_id=NEW.tenant_id AND r.id=NEW.request_id AND r.status='APPROVED'
    AND r.requester_id=NEW.requester_id AND r.operation_type=NEW.operation_type AND r.subject_ref=NEW.subject_ref
    AND r.payload_digest=NEW.payload_digest AND r.policy_version=NEW.policy_version
  ) OR NOT EXISTS (
   SELECT 1 FROM public.aigas_hg_decisions d WHERE d.tenant_id=NEW.tenant_id AND d.request_id=NEW.request_id
    AND d.decision='APPROVE' AND d.reviewer_id=NEW.reviewer_id
    AND d.payload_digest=NEW.payload_digest AND d.policy_version=NEW.policy_version
  ) THEN RAISE EXCEPTION 'Permit must bind an approved request and its reviewer' USING ERRCODE='23514'; END IF;
 ELSE
  IF ROW(NEW.id,NEW.tenant_id,NEW.request_id,NEW.requester_id,NEW.reviewer_id,NEW.operation_type,NEW.subject_ref,NEW.payload_digest,NEW.policy_version,NEW.issued_at,NEW.expires_at)
   IS DISTINCT FROM ROW(OLD.id,OLD.tenant_id,OLD.request_id,OLD.requester_id,OLD.reviewer_id,OLD.operation_type,OLD.subject_ref,OLD.payload_digest,OLD.policy_version,OLD.issued_at,OLD.expires_at)
   OR NOT (OLD.status='ACTIVE' AND NEW.status IN ('CONSUMED','REVOKED','EXPIRED'))
  THEN RAISE EXCEPTION 'Permit is immutable except one consumption or revocation' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER aigas_hg_grant_guard BEFORE INSERT OR UPDATE OR DELETE ON public.aigas_hg_grants FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_grant_guard();

REVOKE ALL ON public.aigas_hg_delegations,public.aigas_hg_grants FROM PUBLIC;
ALTER TABLE public.aigas_hg_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_hg_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON FUNCTION public.aigas_hg_delegation_guard(), public.aigas_hg_decision_guard(), public.aigas_hg_grant_guard() FROM PUBLIC;
COMMIT;
