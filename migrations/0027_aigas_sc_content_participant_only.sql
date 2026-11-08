-- 0027 — Secure Chat content is participant-only at the database layer.
--
-- REVIEW ONLY — DO NOT APPLY AUTOMATICALLY.
-- Applies only after 0025 (runtime role, scope helpers, RLS posture) has been
-- reviewed and applied on an isolated, restorable environment. Production needs
-- the database owner's written approval plus Security/Privacy sign-off.
-- Ordering: never apply 0019 without 0025 and this file. 0019 alone would grant
-- aigas_runtime SELECT/INSERT on both content tables under a tenant-wide policy.
--
-- Why: 0019/0025 create one tenant-scoped policy (`aigas_runtime_tenant`) on
-- every table that has tenant_id, including `aigas_sc_conversations` and
-- `aigas_sc_messages`. That predicate proves "same tenant", not "same author".
-- With the append-only SELECT/INSERT grants from 0019, an OWNER/ADMIN query
-- could read a colleague's stored text at the database layer even though no
-- application route exists today. The product invariant is PARTICIPANT_ONLY.
--
-- This migration only narrows access. It adds no storage path, no rows and no
-- read API. Re-enabling transcript reads or retention jobs requires a separate
-- approved change with its own evidence.
--
-- Pre-check (must return zero rows):
--   SELECT schemaname, tablename, policyname FROM pg_policies
--   WHERE schemaname='public'
--     AND tablename IN ('aigas_sc_conversations','aigas_sc_messages')
--     AND permissive='PERMISSIVE'
--     AND (coalesce(qual,'') NOT LIKE '%user_id%' OR coalesce(with_check,'') NOT LIKE '%user_id%');
--
-- Rollback to the 0009 default (RLS enabled, no policy => deny all):
--   DROP POLICY IF EXISTS sc_content_participant ON public.aigas_sc_conversations;
--   DROP POLICY IF EXISTS sc_content_participant ON public.aigas_sc_messages;
--   ALTER TABLE public.aigas_sc_conversations NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE public.aigas_sc_messages NO FORCE ROW LEVEL SECURITY;
-- Re-running 0025 does NOT recreate a tenant-wide policy on these two tables.
BEGIN;

ALTER TABLE public.aigas_sc_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_sc_messages ENABLE ROW LEVEL SECURITY;
-- FORCE also applies the participant policy to the table owner. Retention,
-- legal-hold or support reads must therefore use a separately approved role and
-- policy; owner credentials are not an implicit content backdoor.
ALTER TABLE public.aigas_sc_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_sc_messages FORCE ROW LEVEL SECURITY;

-- Remove every tenant-wide predicate this content must never inherit.
DROP POLICY IF EXISTS aigas_runtime_tenant ON public.aigas_sc_conversations;
DROP POLICY IF EXISTS aigas_runtime_tenant ON public.aigas_sc_messages;
DROP POLICY IF EXISTS sc_content_participant ON public.aigas_sc_conversations;
DROP POLICY IF EXISTS sc_content_participant ON public.aigas_sc_messages;

-- Participant-only predicate for any role that later receives a grant. The
-- GUCs are set transaction-locally by the server after JWT + membership checks;
-- they are never accepted from a request body. No role has SELECT today.
CREATE POLICY sc_content_participant ON public.aigas_sc_conversations
  FOR ALL
  USING (
    tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
  );

CREATE POLICY sc_content_participant ON public.aigas_sc_messages
  FOR ALL
  USING (
    tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
  );

-- No application verb on content tables until a retention/read policy is
-- approved. INSERT is revoked too: there is no approved storage path yet.
DO $$
BEGIN
  IF to_regrole('aigas_runtime') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.aigas_sc_conversations, public.aigas_sc_messages FROM aigas_runtime';
  END IF;
  IF to_regrole('authenticated') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.aigas_sc_conversations, public.aigas_sc_messages FROM authenticated';
  END IF;
  IF to_regrole('anonymous') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.aigas_sc_conversations, public.aigas_sc_messages FROM anonymous';
  END IF;
END $$;

-- Fail the migration instead of committing a weaker posture.
DO $$
DECLARE
  target text;
  weak_policy text;
BEGIN
  FOREACH target IN ARRAY ARRAY['aigas_sc_conversations','aigas_sc_messages'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = target AND c.relrowsecurity AND c.relforcerowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled and forced on public.%', target;
    END IF;

    SELECT p.policyname INTO weak_policy
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = target
      AND p.permissive = 'PERMISSIVE'
      AND (coalesce(p.qual,'') NOT LIKE '%user_id%' OR coalesce(p.with_check,'') NOT LIKE '%user_id%')
    LIMIT 1;
    IF weak_policy IS NOT NULL THEN
      RAISE EXCEPTION 'policy % on public.% is not participant-scoped', weak_policy, target;
    END IF;

    IF to_regrole('aigas_runtime') IS NOT NULL AND has_table_privilege('aigas_runtime', 'public.' || target, 'SELECT') THEN
      RAISE EXCEPTION 'aigas_runtime still holds SELECT on public.%', target;
    END IF;
  END LOOP;
END $$;

COMMIT;
