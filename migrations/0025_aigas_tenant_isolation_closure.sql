-- TENANT ISOLATION CLOSURE — LOCAL REVIEW ONLY. NOT APPLIED ANYWHERE.
--
-- Architectural decision:
--   AIGAS tables are server-only. The browser/Data API must never hold a table
--   grant on public.aigas_*; the Node server must connect as aigas_runtime
--   (NOBYPASSRLS; NOLOGIN on fresh creation until the operator adds a login) and every
--   transaction must carry aigas.tenant_id + aigas.user_id set by the server
--   after JWT and membership verification. RLS is a second layer, not the
--   only one. The Neon Data API control plane must expose no AIGAS schema;
--   SQL cannot change db_schemas, so that remains an owner action.
--
-- Why this file exists despite 0018/0019:
--   0019 hardcoded 29 tables and missed tables added by 0014/0023. This file
--   is catalog-driven, so every public.aigas_* table with tenant_id is covered
--   now and after later migrations. It supersedes 0019's role/policies; 0019 is
--   optional before this file and MUST NOT be applied after it (0019's broad
--   GRANT would re-open verbs this file revokes). It also adds a restrictive
--   client-deny policy and global reference uniqueness that 0018/0019 do not provide.
--
-- Prerequisites (none performed here):
--   1. Owner approval, isolated staging branch, restore point.
--   2. Apply 0018 and 0022 first; this file restates 0018's revokes and reuses
--      0022's index names with IF NOT EXISTS.
--   3. Create the aigas_runtime login credential outside SQL and store it only
--      in the platform secret store. Never commit or paste the credential.
--   4. In the Neon control plane, stop exposing public via Data API (set
--      db_schemas to a non-AIGAS schema, or disable the endpoint).
--   5. Approve a privileged bootstrap path for first workspace creation and
--      invitation acceptance. Until then aigas_runtime cannot do either, and
--      the app returns *_BOOTSTRAP_REQUIRED instead of silently allowing it.
--
-- This file changes DCL/definitions only. It creates no business rows.
BEGIN;

-- 0. The SECURITY DEFINER helpers below read aigas_memberships. If the applying
--    role neither owns that table nor bypasses RLS, the membership policy can
--    recurse into itself. Fail before changing anything.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'aigas_memberships'
      AND pg_get_userbyid(c.relowner) = current_user
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = current_user AND (rolsuper OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION '0025 must be applied by the AIGAS table owner or a BYPASSRLS migration role';
  END IF;
END $$;

-- 1. Runtime role posture. NOLOGIN is deliberate; the operator enables LOGIN
--    or uses a separate login role that starts with SET ROLE aigas_runtime
--    (NOINHERIT means membership alone grants nothing).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aigas_runtime') THEN
    EXECUTE 'CREATE ROLE aigas_runtime NOLOGIN NOINHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION';
  ELSE
    -- Do not force NOLOGIN on an existing role: after cutover that would lock the
    -- service out. Enforce only the posture attributes.
    EXECUTE 'ALTER ROLE aigas_runtime NOINHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION';
  END IF;
END $$;

-- Client roles must not be able to SET ROLE aigas_runtime. Checked explicitly so
-- a future control-plane grant cannot silently reopen the client path.
DO $$
DECLARE
  client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['authenticated','anonymous','authenticator'] LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_auth_members m
      JOIN pg_roles parent ON parent.oid = m.roleid
      JOIN pg_roles member ON member.oid = m.member
      WHERE parent.rolname = 'aigas_runtime' AND member.rolname = client_role
    ) THEN
      EXECUTE format('REVOKE aigas_runtime FROM %I', client_role);
    END IF;
  END LOOP;
END $$;

-- Remove inherited memberships that would reintroduce BYPASSRLS or owner rights.
DO $$
DECLARE
  granted_role text;
BEGIN
  FOREACH granted_role IN ARRAY ARRAY['neondb_owner','neon_superuser','cloud_admin','authenticated','anonymous'] LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_auth_members m
      JOIN pg_roles parent ON parent.oid = m.roleid
      JOIN pg_roles member ON member.oid = m.member
      WHERE parent.rolname = granted_role AND member.rolname = 'aigas_runtime'
    ) THEN
      EXECUTE format('REVOKE %I FROM aigas_runtime', granted_role);
    END IF;
  END LOOP;
END $$;

-- 2. Data API client roles: zero object privileges on public.
--    This is intentionally broader than AIGAS: the architectural decision is
--    that public is server-only. If a future browser API is needed, expose a
--    dedicated schema with its own grants instead of reusing public.
--    Client roles exist only when the Data API or Neon Auth created them, so
--    each REVOKE is guarded by to_regrole: on a project without those roles the
--    file proceeds to establish the rest of the posture instead of aborting with
--    42704. The guard changes no grant; when the role exists the REVOKE is identical.
DO $$
BEGIN
  IF to_regrole('authenticated') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated';
  END IF;
  -- Functions in public are EXECUTE to PUBLIC by default. Remove that path as well;
  -- this database currently has no non-AIGAS functions in public.
  EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC';
  IF to_regrole('anonymous') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anonymous';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anonymous';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anonymous';
  END IF;
END $$;

-- A table grant to PUBLIC would survive the revokes above and would make
-- authenticated inherit it. Remove it on AIGAS tables specifically.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'aigas\_%'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', target.relname);
  END LOOP;
END $$;

-- Stop the owner role from auto-granting to client roles on future objects.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neondb_owner') THEN
    IF to_regrole('authenticated') IS NOT NULL THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated';
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated';
    END IF;
    IF to_regrole('anonymous') IS NOT NULL THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON TABLES FROM anonymous';
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anonymous';
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anonymous';
    END IF;
  END IF;
  IF to_regrole('authenticated') IS NOT NULL THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated';
  END IF;
  IF to_regrole('anonymous') IS NOT NULL THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anonymous';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anonymous';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anonymous';
  END IF;
END $$;

-- 3. Least-privilege object grants for the runtime role. RLS policies in
--    section 5 still bound every row; these grants only decide which verbs
--    are possible at all. Append-only tables never receive UPDATE/DELETE.
--
--    Reset any earlier disposition first. `GRANT` is additive: if 0019 (or an
--    earlier draft) already granted UPDATE/DELETE on every table, the selective
--    grants below would not remove those verbs. This reset is what makes the
--    intended verb matrix true on a database where 0019 ran first.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM aigas_runtime;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM aigas_runtime;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM aigas_runtime;
GRANT USAGE ON SCHEMA public TO aigas_runtime;

DO $$
DECLARE
  target record;
  read_only text[] := ARRAY['aigas_product_grants','aigas_ld_evidence_requirements','aigas_trial_requests','aigas_trial_entitlements'];
  append_only text[] := ARRAY[
    'aigas_audit_events','aigas_ld_events','aigas_kernel_policy_decisions',
    'aigas_fw_decisions','aigas_hg_decisions','aigas_hg_events',
    'aigas_department_events','aigas_policy_approvals',
    'aigas_re_asset_revisions','aigas_re_treatment_revisions',
    'aigas_sc_cancellations','aigas_sc_messages','aigas_sc_conversations',
    'aigas_trial_events'
  ];
  select_insert text[] := ARRAY['aigas_auth_organizations'];
  select_insert_update text[] := ARRAY[
    'aigas_sc_requests','aigas_hg_requests','aigas_re_assets',
    'aigas_policies','aigas_policy_versions','aigas_policy_delegations',
    'aigas_departments','aigas_product_access','aigas_member_invitations'
  ];
BEGIN
  FOR target IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'aigas\_%'
  LOOP
    IF target.relname = ANY(read_only) THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO aigas_runtime', target.relname);
    ELSIF target.relname IN ('aigas_sc_messages','aigas_sc_conversations') THEN
      -- Stored chat text has no approved application read/write path. `0027`
      -- makes the RLS predicate participant-only; keep the verbs closed too.
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM aigas_runtime', target.relname);
    ELSIF target.relname = ANY(append_only) THEN
      EXECUTE format('GRANT SELECT, INSERT ON TABLE public.%I TO aigas_runtime', target.relname);
    ELSIF target.relname = ANY(select_insert) THEN
      EXECUTE format('GRANT SELECT, INSERT ON TABLE public.%I TO aigas_runtime', target.relname);
    ELSIF target.relname = ANY(select_insert_update) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE ON TABLE public.%I TO aigas_runtime', target.relname);
    ELSIF target.relname = 'aigas_tenants' THEN
      EXECUTE 'GRANT SELECT, UPDATE ON TABLE public.aigas_tenants TO aigas_runtime';
    ELSE
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO aigas_runtime', target.relname);
    END IF;
  END LOOP;
END $$;

-- Read-only directory columns the server actually reads. No writes.
DO $$
BEGIN
  IF to_regclass('neon_auth."user"') IS NOT NULL THEN
    EXECUTE 'GRANT USAGE ON SCHEMA neon_auth TO aigas_runtime';
    EXECUTE 'GRANT SELECT (id, name, email, banned, "emailVerified") ON neon_auth."user" TO aigas_runtime';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON neon_auth."user" FROM aigas_runtime';
  END IF;
  IF to_regclass('neon_auth.invitation') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT (id, email, status, "expiresAt", "organizationId", "inviterId", role) ON neon_auth.invitation TO aigas_runtime';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON neon_auth.invitation FROM aigas_runtime';
  END IF;
  IF to_regclass('neon_auth.member') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ("organizationId", "userId", role) ON neon_auth.member TO aigas_runtime';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON neon_auth.member FROM aigas_runtime';
  END IF;
  IF to_regclass('neon_auth.organization') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT (id) ON neon_auth.organization TO aigas_runtime';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON neon_auth.organization FROM aigas_runtime';
  END IF;
END $$;

-- 4. Scope helpers. The GUCs are transaction-local and are set only by the
--    server after JWT verification and a membership read. They are never
--    accepted from a request body. SECURITY DEFINER avoids recursive RLS on
--    the memberships table and returns booleans/roles only, never rows.
CREATE OR REPLACE FUNCTION public.aigas_actor()
RETURNS uuid LANGUAGE sql STABLE SET search_path = pg_catalog, public AS $$
  SELECT nullif(current_setting('aigas.user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.aigas_is_tenant_member(wanted uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT wanted IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.aigas_memberships m
    WHERE m.tenant_id = wanted AND m.user_id = public.aigas_actor()
  )
$$;

CREATE OR REPLACE FUNCTION public.aigas_actor_role(wanted uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT m.role FROM public.aigas_memberships m
  WHERE m.tenant_id = wanted AND m.user_id = public.aigas_actor()
$$;

CREATE OR REPLACE FUNCTION public.aigas_actor_is_manager(wanted uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT public.aigas_actor_role(wanted) IN ('OWNER','ADMIN')
$$;

CREATE OR REPLACE FUNCTION public.aigas_tenant_scope(wanted uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = pg_catalog, public AS $$
  SELECT wanted IS NOT NULL
    AND wanted = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND public.aigas_is_tenant_member(wanted)
$$;

-- Functions are EXECUTE to PUBLIC by default in PostgreSQL. Revoking from
-- authenticated alone leaves that PUBLIC path in place, so revoke every AIGAS
-- function from PUBLIC as well, then grant only the runtime role below.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname LIKE 'aigas\_%'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', target.signature);
    IF to_regrole('authenticated') IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', target.signature);
    END IF;
    IF to_regrole('anonymous') IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anonymous', target.signature);
    END IF;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.aigas_actor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_is_tenant_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_actor_role(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_actor_is_manager(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_tenant_scope(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aigas_actor() TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_is_tenant_member(uuid) TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_actor_role(uuid) TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_actor_is_manager(uuid) TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_tenant_scope(uuid) TO aigas_runtime;

-- 5. RLS policies. The old Secure Chat policies trusted sc_* GUCs alone and the
--    0019 list missed later tables. Both are replaced by one tenant predicate.
DO $$
BEGIN
  IF to_regclass('public.aigas_sc_requests') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS sc_request_owner ON public.aigas_sc_requests';
  END IF;
  IF to_regclass('public.aigas_sc_cancellations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS sc_cancellation_owner ON public.aigas_sc_cancellations';
  END IF;
END $$;

-- Drop every policy name this file or 0019 may have created, on every AIGAS table.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'aigas\_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target.relname);
    EXECUTE format('DROP POLICY IF EXISTS aigas_runtime_tenant ON public.%I', target.relname);
    EXECUTE format('DROP POLICY IF EXISTS aigas_runtime_self_membership ON public.%I', target.relname);
    EXECUTE format('DROP POLICY IF EXISTS aigas_runtime_tenant_membership ON public.%I', target.relname);
    EXECUTE format('DROP POLICY IF EXISTS aigas_runtime_self_tenants ON public.%I', target.relname);
    EXECUTE format('DROP POLICY IF EXISTS aigas_client_deny ON public.%I', target.relname);
  END LOOP;
END $$;

-- One tenant-scoped policy for every table that carries tenant_id, except the
-- Secure Chat content tables: their text is participant-only (`0027`). aigas_tenants
-- and aigas_memberships are handled explicitly below.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'aigas\_%'
      AND c.relname NOT IN ('aigas_tenants','aigas_memberships')
      -- Secure Chat text is participant-only, not tenant-wide. `0027` installs
      -- the author-scoped policy; never recreate a tenant predicate here.
      AND c.relname NOT IN ('aigas_sc_messages','aigas_sc_conversations')
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public' AND col.table_name = c.relname
          AND col.column_name = 'tenant_id'
      )
  LOOP
    EXECUTE format(
      'CREATE POLICY aigas_runtime_tenant ON public.%I FOR ALL TO aigas_runtime '
      'USING (public.aigas_tenant_scope(tenant_id)) '
      'WITH CHECK (public.aigas_tenant_scope(tenant_id))', target.relname);
  END LOOP;
END $$;

-- Tenants: read only for members; rename only for OWNER/ADMIN. No INSERT/DELETE
-- policy, so first-workspace bootstrap stays a privileged path.
DROP POLICY IF EXISTS aigas_runtime_tenant_read ON public.aigas_tenants;
DROP POLICY IF EXISTS aigas_runtime_tenant_rename ON public.aigas_tenants;
CREATE POLICY aigas_runtime_tenant_read ON public.aigas_tenants
  FOR SELECT TO aigas_runtime USING (public.aigas_is_tenant_member(id));
CREATE POLICY aigas_runtime_tenant_rename ON public.aigas_tenants
  FOR UPDATE TO aigas_runtime
  USING (public.aigas_tenant_scope(id) AND public.aigas_actor_is_manager(id))
  WITH CHECK (public.aigas_tenant_scope(id) AND public.aigas_actor_is_manager(id));

-- Memberships: self rows for bootstrap discovery; tenant roster for members;
-- writes only by OWNER/ADMIN and never against the actor's own row.
DROP POLICY IF EXISTS aigas_runtime_tenant_membership_read ON public.aigas_memberships;
DROP POLICY IF EXISTS aigas_runtime_tenant_membership_insert ON public.aigas_memberships;
DROP POLICY IF EXISTS aigas_runtime_tenant_membership_update ON public.aigas_memberships;
DROP POLICY IF EXISTS aigas_runtime_tenant_membership_delete ON public.aigas_memberships;
CREATE POLICY aigas_runtime_self_membership ON public.aigas_memberships
  FOR SELECT TO aigas_runtime USING (user_id = public.aigas_actor());
CREATE POLICY aigas_runtime_tenant_membership_read ON public.aigas_memberships
  FOR SELECT TO aigas_runtime USING (public.aigas_tenant_scope(tenant_id));
CREATE POLICY aigas_runtime_tenant_membership_insert ON public.aigas_memberships
  FOR INSERT TO aigas_runtime
  WITH CHECK (public.aigas_tenant_scope(tenant_id) AND public.aigas_actor_is_manager(tenant_id));
CREATE POLICY aigas_runtime_tenant_membership_update ON public.aigas_memberships
  FOR UPDATE TO aigas_runtime
  USING (public.aigas_tenant_scope(tenant_id) AND public.aigas_actor_is_manager(tenant_id) AND user_id <> public.aigas_actor())
  WITH CHECK (public.aigas_tenant_scope(tenant_id) AND public.aigas_actor_is_manager(tenant_id) AND user_id <> public.aigas_actor());
CREATE POLICY aigas_runtime_tenant_membership_delete ON public.aigas_memberships
  FOR DELETE TO aigas_runtime
  USING (public.aigas_tenant_scope(tenant_id) AND public.aigas_actor_is_manager(tenant_id) AND user_id <> public.aigas_actor());

-- Restrictive client deny. If a future grant is added to authenticated or
-- anonymous, this policy still denies every verb. It is TO PUBLIC with an
-- explicit current_user test, not TO authenticated: neondb_owner is a member
-- of authenticated on this database, and a role-targeted restrictive policy
-- would also apply to the owner and break the server path.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'aigas\_%'
  LOOP
    EXECUTE format(
      'CREATE POLICY aigas_client_deny ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC '
      'USING (current_user NOT IN (''authenticated'',''anonymous'',''authenticator'')) '
      'WITH CHECK (current_user NOT IN (''authenticated'',''anonymous'',''authenticator''))', target.relname);
  END LOOP;
END $$;

-- 6. Usage aggregates stay callable only by the runtime role.
DO $$
BEGIN
  IF to_regprocedure('public.aigas_sc_usage_window(uuid,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window(uuid,uuid) FROM PUBLIC';
    IF to_regrole('authenticated') IS NOT NULL THEN
      EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window(uuid,uuid) FROM authenticated';
    END IF;
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.aigas_sc_usage_window(uuid,uuid) TO aigas_runtime';
  END IF;
  IF to_regprocedure('public.aigas_sc_usage_window_v2(uuid,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM PUBLIC';
    IF to_regrole('authenticated') IS NOT NULL THEN
      EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM authenticated';
    END IF;
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) TO aigas_runtime';
  END IF;
END $$;

-- 7. Global reference uniqueness. Under RLS a cross-tenant row is invisible, so
--    the application pre-check cannot detect a reused request UUID. These
--    indexes are the database-level backstop; the pre-check stays advisory.
--    Names match 0022 so IF NOT EXISTS is a no-op when 0022 ran first.
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  IF to_regclass('public.aigas_fw_decisions') IS NOT NULL THEN
    SELECT count(*) INTO duplicate_count FROM (
      SELECT request_id FROM public.aigas_fw_decisions
      WHERE request_id IS NOT NULL GROUP BY request_id HAVING count(*) > 1
    ) duplicates;
    IF duplicate_count > 0 THEN
      RAISE EXCEPTION 'duplicate firewall request_id across tenants; resolve before applying 0025';
    END IF;
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS aigas_fw_decisions_request_scope_idx ON public.aigas_fw_decisions(request_id) WHERE request_id IS NOT NULL';
  END IF;

  IF to_regclass('public.aigas_sc_requests') IS NOT NULL THEN
    SELECT count(*) INTO duplicate_count FROM (
      SELECT id FROM public.aigas_sc_requests GROUP BY id HAVING count(*) > 1
    ) duplicates;
    IF duplicate_count > 0 THEN
      RAISE EXCEPTION 'duplicate secure-chat request id across tenants; resolve before applying 0025';
    END IF;
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS aigas_sc_requests_scope_idx ON public.aigas_sc_requests(id)';
  END IF;
END $$;

-- 8. Fail closed if the resulting posture is not what this file promises.
--    Each client check runs only when the role exists: has_table_privilege on a
--    missing role raises 42704, which would turn a postcondition into a crash.
DO $$
DECLARE
  offender text;
BEGIN
  IF to_regrole('authenticated') IS NOT NULL THEN
    SELECT string_agg(c.relname, ', ') INTO offender
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'aigas\_%'
      AND EXISTS (
        SELECT 1
        FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) AS t(verb)
        WHERE has_table_privilege('authenticated', c.oid, verb)
      );
    IF offender IS NOT NULL THEN
      RAISE EXCEPTION 'authenticated still has AIGAS table privileges: %', offender;
    END IF;
  END IF;

  IF to_regrole('anonymous') IS NOT NULL THEN
    SELECT string_agg(c.relname, ', ') INTO offender
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'aigas\_%'
      AND EXISTS (
        SELECT 1
        FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) AS t(verb)
        WHERE has_table_privilege('anonymous', c.oid, verb)
      );
    IF offender IS NOT NULL THEN
      RAISE EXCEPTION 'anonymous still has AIGAS table privileges: %', offender;
    END IF;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    SELECT string_agg(p.proname, ', ') INTO offender
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE');
    IF offender IS NOT NULL THEN
      RAISE EXCEPTION 'authenticated can still execute public functions: %', offender;
    END IF;
  END IF;

  IF to_regrole('anonymous') IS NOT NULL THEN
    SELECT string_agg(p.proname, ', ') INTO offender
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND has_function_privilege('anonymous', p.oid, 'EXECUTE');
    IF offender IS NOT NULL THEN
      RAISE EXCEPTION 'anonymous can still execute public functions: %', offender;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'aigas_runtime'
      AND (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication)
  ) THEN
    RAISE EXCEPTION 'aigas_runtime is not least privilege';
  END IF;

  SELECT string_agg(c.relname, ', ') INTO offender
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'aigas\_%'
    AND c.relrowsecurity IS NOT TRUE;
  IF offender IS NOT NULL THEN
    RAISE EXCEPTION 'RLS is not enabled on: %', offender;
  END IF;
END $$;

COMMIT;

-- FORCE ROW LEVEL SECURITY is deliberately not used. It does not override
-- rolbypassrls, so it would neither protect the owner connection nor make RLS
-- a substitute for the runtime-role cutover. The only real fix is a connection
-- role with NOBYPASSRLS plus the policies above.
