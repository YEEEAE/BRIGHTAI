-- Requires 0001, 0004 and 0006. Apply only to an explicitly authorized target.
-- Owner authorized production / br-young-bird-b43proeb on 2026-11-01.
-- No seeds, access grants, policy durations or customer content are inserted.
BEGIN;
ALTER TABLE public.aigas_tenants ADD COLUMN profile_version bigint NOT NULL DEFAULT 1 CHECK (profile_version > 0);
CREATE FUNCTION public.aigas_hg_tenant_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.name IS DISTINCT FROM OLD.name THEN NEW.profile_version := OLD.profile_version + 1;
 ELSE NEW.profile_version := OLD.profile_version; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER aigas_hg_tenant_revision BEFORE UPDATE ON public.aigas_tenants FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_tenant_revision();

CREATE TABLE public.aigas_hg_policies (
 tenant_id uuid PRIMARY KEY REFERENCES public.aigas_tenants(id),
 version uuid NOT NULL,
 pending_minutes integer NOT NULL CHECK (pending_minutes BETWEEN 1 AND 1440),
 approval_minutes integer NOT NULL CHECK (approval_minutes BETWEEN 1 AND 1440),
 enabled boolean NOT NULL,
 updated_by uuid NOT NULL REFERENCES neon_auth."user"(id),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- First use requires an explicit OWNER/ADMIN policy choice; no implicit duration.
ALTER TABLE public.aigas_hg_requests
 DROP CONSTRAINT aigas_hg_requests_operation_scope_check,
 DROP CONSTRAINT aigas_hg_requests_policy_version_check,
 DROP CONSTRAINT aigas_hg_requests_status_check,
 DROP CONSTRAINT aigas_hg_requests_check,
 ALTER COLUMN policy_version DROP DEFAULT,
 ADD COLUMN operation_type text,
 ADD COLUMN subject_ref uuid,
 ADD COLUMN payload jsonb,
 ADD COLUMN payload_digest text,
 ADD COLUMN expires_at timestamptz,
 ADD COLUMN terminal_reason text,
 ADD COLUMN executed_by uuid REFERENCES neon_auth."user"(id),
 ADD COLUMN execution_result jsonb;
-- Preserve old evidence. Unbound old approvals cannot authorize a new operation.
UPDATE public.aigas_hg_requests SET
 operation_type='INTERNAL_DEMO_NOTE', subject_ref=id, payload=jsonb_build_object('note',description),
 expires_at=created_at,
 status=CASE WHEN completed_at IS NOT NULL THEN 'EXECUTED' WHEN status='REJECTED' THEN 'REJECTED' ELSE 'EXPIRED' END,
 terminal_reason=CASE WHEN completed_at IS NULL AND status<>'REJECTED' THEN 'LEGACY_UNBOUND' ELSE NULL END,
 executed_by=CASE WHEN completed_at IS NOT NULL THEN requester_id ELSE NULL END,
 execution_result=CASE WHEN completed_at IS NOT NULL THEN '{"kind":"LEGACY_DEMO_NOTE"}'::jsonb ELSE NULL END;
ALTER TABLE public.aigas_hg_requests
 ALTER COLUMN operation_type SET NOT NULL,
 ALTER COLUMN subject_ref SET NOT NULL,
 ALTER COLUMN payload SET NOT NULL,
 ALTER COLUMN expires_at SET NOT NULL,
 ADD CHECK (operation_scope=operation_type AND operation_type IN ('KERNEL_WORKSPACE_RENAME','INTERNAL_DEMO_NOTE')),
 ADD CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED','EXECUTED')),
 ADD CHECK (payload_digest IS NULL OR payload_digest ~ '^[0-9a-f]{64}$'),
 ADD CHECK (jsonb_typeof(payload)='object' AND octet_length(payload::text)<=2048),
 ADD CHECK (terminal_reason IS NULL OR terminal_reason IN ('TIMEOUT','POLICY_CHANGED','TARGET_CHANGED','AUTHORITY_CHANGED','LEGACY_UNBOUND')),
 ADD CHECK ((status='EXECUTED')=(completed_at IS NOT NULL AND executed_by IS NOT NULL AND execution_result IS NOT NULL)),
 ADD CHECK (status='EXECUTED' OR (completed_at IS NULL AND executed_by IS NULL AND execution_result IS NULL));
ALTER TABLE public.aigas_hg_decisions ADD COLUMN payload_digest text, ADD COLUMN policy_version text;
CREATE TABLE public.aigas_hg_events (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL,
 request_id uuid NOT NULL,
 requester_id uuid NOT NULL,
 actor_user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
 event_type text NOT NULL CHECK (event_type IN ('CREATED','APPROVED','REJECTED','EXPIRED','EXECUTED')),
 reason_code text,
 audit_id uuid NOT NULL REFERENCES public.aigas_audit_events(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY (tenant_id,request_id,requester_id) REFERENCES public.aigas_hg_requests(tenant_id,id,requester_id),
 UNIQUE (request_id,event_type)
);
CREATE INDEX aigas_hg_events_request_idx ON public.aigas_hg_events(tenant_id,request_id,created_at,id);
CREATE INDEX aigas_hg_expiry_idx ON public.aigas_hg_requests(tenant_id,expires_at) WHERE status IN ('PENDING','APPROVED');

CREATE FUNCTION public.aigas_hg_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Human Gate history is append-only' USING ERRCODE='23514'; END $$;
CREATE TRIGGER aigas_hg_decision_immutable BEFORE UPDATE OR DELETE ON public.aigas_hg_decisions FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_immutable();
CREATE TRIGGER aigas_hg_event_immutable BEFORE UPDATE OR DELETE ON public.aigas_hg_events FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_immutable();
CREATE FUNCTION public.aigas_hg_request_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Request history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'PENDING' OR NEW.payload_digest IS NULL OR NEW.expires_at<=clock_timestamp()
    OR NOT EXISTS (SELECT 1 FROM public.aigas_hg_policies p WHERE p.tenant_id=NEW.tenant_id AND p.version::text=NEW.policy_version AND p.enabled)
  THEN RAISE EXCEPTION 'Bound pending request and current policy required' USING ERRCODE='23514'; END IF;
 ELSE
  IF ROW(NEW.id,NEW.tenant_id,NEW.requester_id,NEW.title,NEW.description,NEW.reason,NEW.operation_scope,NEW.operation_type,NEW.subject_ref,NEW.payload,NEW.payload_digest,NEW.policy_version,NEW.created_at)
   IS DISTINCT FROM ROW(OLD.id,OLD.tenant_id,OLD.requester_id,OLD.title,OLD.description,OLD.reason,OLD.operation_scope,OLD.operation_type,OLD.subject_ref,OLD.payload,OLD.payload_digest,OLD.policy_version,OLD.created_at)
   OR NOT ((OLD.status='PENDING' AND NEW.status IN ('APPROVED','REJECTED','EXPIRED')) OR (OLD.status='APPROVED' AND NEW.status IN ('EXECUTED','EXPIRED')))
   OR NEW.expires_at>OLD.expires_at
   OR (NEW.expires_at IS DISTINCT FROM OLD.expires_at AND NOT (OLD.status='PENDING' AND NEW.status='APPROVED'))
  THEN RAISE EXCEPTION 'Immutable request or invalid transition' USING ERRCODE='23514'; END IF;
  IF NEW.status IN ('APPROVED','REJECTED','EXECUTED') AND NEW.expires_at<=clock_timestamp()
  THEN RAISE EXCEPTION 'Request expired' USING ERRCODE='23514'; END IF;
  IF NEW.status IN ('APPROVED','REJECTED','EXECUTED') AND NOT EXISTS (
   SELECT 1 FROM public.aigas_hg_decisions d WHERE d.tenant_id=NEW.tenant_id AND d.request_id=NEW.id
    AND d.payload_digest=NEW.payload_digest AND d.policy_version=NEW.policy_version
    AND d.decision=CASE WHEN NEW.status='REJECTED' THEN 'REJECT' ELSE 'APPROVE' END
  ) THEN RAISE EXCEPTION 'Bound decision required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER aigas_hg_request_guard BEFORE INSERT OR UPDATE OR DELETE ON public.aigas_hg_requests FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_request_guard();
REVOKE ALL ON public.aigas_hg_policies,public.aigas_hg_events FROM PUBLIC;
ALTER TABLE public.aigas_hg_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_hg_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON FUNCTION public.aigas_hg_tenant_revision(), public.aigas_hg_immutable(), public.aigas_hg_request_guard() FROM PUBLIC;
COMMIT;
