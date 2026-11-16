-- Owner approval required before application to any shared database.
-- No policy is enabled, no grants or customer content are seeded.
BEGIN;
ALTER TABLE public.aigas_hg_policies ADD COLUMN firewall_escalation_enabled boolean NOT NULL DEFAULT false;
-- Preserve existing CHECK semantics while extending only the operation allowlist.
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conrelid::regclass AS tbl,conname,pg_get_constraintdef(oid) AS def
 FROM pg_constraint WHERE contype='c' AND conrelid IN
 ('public.aigas_hg_requests'::regclass,'public.aigas_hg_grants'::regclass,'public.aigas_hg_delegations'::regclass)
 AND pg_get_constraintdef(oid) LIKE '%INTERNAL_DEMO_NOTE%' LOOP
 EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',c.tbl,c.conname);
 EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',c.tbl,c.conname,
 replace(c.def,'''INTERNAL_DEMO_NOTE''::text','''INTERNAL_DEMO_NOTE''::text, ''FIREWALL_ESCALATION_REVIEW''::text'));
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.aigas_hg_decision_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 request_type text;
 request_status text;
 request_digest text;
 request_policy text;
 required_level text;
 sod boolean;
BEGIN
 IF NEW.authority_level IS NULL THEN RAISE EXCEPTION 'Decision authority level required' USING ERRCODE='23514'; END IF;
 SELECT r.operation_type,r.status,r.payload_digest,r.policy_version,p.review_level,p.separation_of_duties
  INTO request_type,request_status,request_digest,request_policy,required_level,sod
  FROM public.aigas_hg_requests r JOIN public.aigas_hg_policies p ON p.tenant_id=r.tenant_id AND p.enabled
  WHERE r.tenant_id=NEW.tenant_id AND r.id=NEW.request_id;
 IF request_type IS NULL THEN RAISE EXCEPTION 'Decision task not found' USING ERRCODE='23514'; END IF;
 IF request_status<>'PENDING' THEN RAISE EXCEPTION 'Decision requires a pending request' USING ERRCODE='23514'; END IF;
 IF NEW.payload_digest IS DISTINCT FROM request_digest OR NEW.policy_version IS DISTINCT FROM request_policy THEN
  RAISE EXCEPTION 'Decision must bind the request digest and policy version' USING ERRCODE='23514';
 END IF;
 IF NEW.reviewer_id=NEW.requester_id AND (request_type IN ('KERNEL_WORKSPACE_RENAME','FIREWALL_ESCALATION_REVIEW') OR sod) THEN
  RAISE EXCEPTION 'Separation of duties required' USING ERRCODE='23514';
 END IF;
 IF (CASE NEW.authority_level WHEN 'OWNER' THEN 3 ELSE 2 END) < (CASE required_level WHEN 'OWNER' THEN 3 ELSE 2 END) THEN
  RAISE EXCEPTION 'Decision below required review level' USING ERRCODE='23514';
 END IF;
 -- The reviewer identity itself must be an active member of the tenant, so a
 -- direct write cannot attach a decision to an outsider or a banned account.
 IF NOT EXISTS (
  SELECT 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id
  WHERE m.tenant_id=NEW.tenant_id AND m.user_id=NEW.reviewer_id AND u.banned IS NOT TRUE
 ) THEN RAISE EXCEPTION 'Reviewer must be an active tenant member' USING ERRCODE='23514'; END IF;
 -- A non-delegated decision cannot claim a level above the reviewer's own role.
 -- Delegated decisions are validated below against the delegator's live role.
 IF NEW.delegation_id IS NULL AND NOT EXISTS (
  SELECT 1 FROM public.aigas_memberships m
  WHERE m.tenant_id=NEW.tenant_id AND m.user_id=NEW.reviewer_id
   AND (CASE m.role WHEN 'OWNER' THEN 3 WHEN 'ADMIN' THEN 2 ELSE 1 END) >= (CASE NEW.authority_level WHEN 'OWNER' THEN 3 ELSE 2 END)
 ) THEN RAISE EXCEPTION 'Reviewer role is below the claimed authority level' USING ERRCODE='23514'; END IF;
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
CREATE OR REPLACE FUNCTION public.aigas_hg_grant_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Execution permits cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'ACTIVE' OR NEW.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Only an active future permit can be issued' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (
   SELECT 1 FROM public.aigas_hg_requests r WHERE r.tenant_id=NEW.tenant_id AND r.id=NEW.request_id AND r.status='APPROVED'
    AND r.requester_id=NEW.requester_id AND r.operation_type=NEW.operation_type AND r.subject_ref=NEW.subject_ref
    AND r.payload_digest=NEW.payload_digest AND r.policy_version=NEW.policy_version
    AND NEW.expires_at<=r.expires_at AND r.expires_at>clock_timestamp()
  ) OR NOT EXISTS (
   SELECT 1 FROM public.aigas_hg_decisions d WHERE d.tenant_id=NEW.tenant_id AND d.request_id=NEW.request_id
    AND d.decision='APPROVE' AND d.reviewer_id=NEW.reviewer_id
    AND d.payload_digest=NEW.payload_digest AND d.policy_version=NEW.policy_version
  ) THEN RAISE EXCEPTION 'Permit must bind an approved request and its reviewer' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (
   SELECT 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id
   WHERE m.tenant_id=NEW.tenant_id AND m.user_id=NEW.reviewer_id AND u.banned IS NOT TRUE
  ) THEN RAISE EXCEPTION 'Permit reviewer must be an active tenant member' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (
   SELECT 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id
   WHERE m.tenant_id=NEW.tenant_id AND m.user_id=NEW.requester_id AND u.banned IS NOT TRUE
    AND (NEW.operation_type<>'KERNEL_WORKSPACE_RENAME' OR m.role IN ('OWNER','ADMIN'))
  ) THEN RAISE EXCEPTION 'Permit requester must be an active member for this operation' USING ERRCODE='23514'; END IF;
  -- The permit must always separate requester and reviewer when the live policy
  -- requires it, or for the Kernel rename where separation is unconditional.
  IF NEW.reviewer_id=NEW.requester_id AND EXISTS (
   SELECT 1 FROM public.aigas_hg_requests r JOIN public.aigas_hg_policies p ON p.tenant_id=r.tenant_id
   WHERE r.tenant_id=NEW.tenant_id AND r.id=NEW.request_id
    AND (p.separation_of_duties OR r.operation_type IN ('KERNEL_WORKSPACE_RENAME','FIREWALL_ESCALATION_REVIEW'))
  ) THEN RAISE EXCEPTION 'Permit requires a reviewer independent of the requester' USING ERRCODE='23514'; END IF;
 ELSE
  IF ROW(NEW.id,NEW.tenant_id,NEW.request_id,NEW.requester_id,NEW.reviewer_id,NEW.operation_type,NEW.subject_ref,NEW.payload_digest,NEW.policy_version,NEW.issued_at,NEW.expires_at)
   IS DISTINCT FROM ROW(OLD.id,OLD.tenant_id,OLD.request_id,OLD.requester_id,OLD.reviewer_id,OLD.operation_type,OLD.subject_ref,OLD.payload_digest,OLD.policy_version,OLD.issued_at,OLD.expires_at)
   OR NOT (OLD.status='ACTIVE' AND NEW.status IN ('CONSUMED','REVOKED','EXPIRED'))
  THEN RAISE EXCEPTION 'Permit is immutable except one consumption or revocation' USING ERRCODE='23514'; END IF;
  IF NEW.status='CONSUMED' AND NOT EXISTS (
   SELECT 1 FROM public.aigas_hg_requests r WHERE r.tenant_id=NEW.tenant_id AND r.id=NEW.request_id
    AND r.status='APPROVED' AND r.requester_id=NEW.consumed_by AND r.expires_at>clock_timestamp()
  ) THEN RAISE EXCEPTION 'Permit consumption must be the requester before expiry' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION public.aigas_fw_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.operation_type='FIREWALL_ESCALATION_REVIEW' THEN
  IF NEW.payload - ARRAY['decision_id','rule_id','rule_version','request_fingerprint'] <> '{}'::jsonb
   OR NOT (NEW.payload ?& ARRAY['decision_id','rule_id','rule_version','request_fingerprint'])
   OR NEW.title<>'Firewall escalation review' OR NEW.description<>'Metadata-only policy review'
   OR NEW.reason<>'Independent review required' OR NEW.provider_ref<>'aigas-kernel'
  THEN RAISE EXCEPTION 'Metadata-only Firewall payload required' USING ERRCODE='23514'; END IF;
  IF NEW.status IN ('PENDING','APPROVED','EXECUTED') AND NOT EXISTS (
   SELECT 1 FROM public.aigas_fw_decisions d
   JOIN public.aigas_fw_rules r ON r.tenant_id=d.tenant_id AND r.id=d.rule_id
   JOIN public.aigas_hg_policies p ON p.tenant_id=d.tenant_id
   WHERE d.tenant_id=NEW.tenant_id AND d.id=NEW.subject_ref AND d.action='ESCALATE'
    AND NEW.payload=jsonb_build_object('decision_id',d.id,'rule_id',d.rule_id,'rule_version',d.rule_version,'request_fingerprint',d.request_fingerprint)
    AND r.version=d.rule_version AND r.enabled AND p.enabled AND p.firewall_escalation_enabled
    AND p.version::text=NEW.policy_version
  ) THEN RAISE EXCEPTION 'Firewall review binding no longer current' USING ERRCODE='23514'; END IF;
  IF NEW.status='EXECUTED' THEN RAISE EXCEPTION 'Provider execution adapter required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER aigas_fw_review_guard BEFORE INSERT OR UPDATE ON public.aigas_hg_requests FOR EACH ROW EXECUTE FUNCTION public.aigas_fw_review_guard();
REVOKE ALL ON FUNCTION public.aigas_fw_review_guard() FROM PUBLIC;
COMMIT;
