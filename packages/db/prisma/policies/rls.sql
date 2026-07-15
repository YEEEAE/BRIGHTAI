-- ═══════════════════════════════════════════════════════════════════
-- BrightAI — Row-Level Security (RLS) Policies
-- ═══════════════════════════════════════════════════════════════════
--
-- Tenant isolation at the database level. Even if a route handler
-- forgets to scope a query, the DB refuses to leak data.
--
-- How it works:
--   - The application calls `SET LOCAL app.current_org_id = 'org_xxx'`
--     inside a transaction before each query.
--   - The application calls `SET LOCAL app.current_user_id = 'usr_xxx'`
--     for user-scoped checks.
--   - Each tenant table has a policy:
--       USING      (organization_id = current_setting('app.current_org_id'))
--       WITH CHECK (organization_id = current_setting('app.current_org_id'))
--   - FORCE ROW LEVEL SECURITY is on — even table owners respect the
--     policies. Service-role operations use the `brightai_service` role,
--     which has BYPASSRLS.
--
-- Roles:
--   - brightai_app        — application user; subject to RLS
--   - brightai_service    — migrations + admin scripts; BYPASSRLS
--   - brightai_readonly   — analytics + BI; subject to RLS, read-only
--
-- This file is idempotent. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 0. Roles
-- ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brightai_app') THEN
    CREATE ROLE brightai_app NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brightai_service') THEN
    CREATE ROLE brightai_service NOLOGIN BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brightai_readonly') THEN
    CREATE ROLE brightai_readonly NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO brightai_app, brightai_service, brightai_readonly;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO brightai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO brightai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO brightai_readonly;

-- ─────────────────────────────────────────────────────────────────
-- 1. Helper functions
-- ─────────────────────────────────────────────────────────────────

-- Read the current tenant id from session. Returns empty string if unset.
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('app.current_org_id', true), ''), '')
$$;

-- Read the current user id from session.
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('app.current_user_id', true), ''), '')
$$;

-- Is the current connection acting in service-role mode (bypass)?
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.is_service', true) = 'true'
    OR pg_has_role(current_user, 'brightai_service', 'MEMBER')
$$;

-- ─────────────────────────────────────────────────────────────────
-- 2. Enable + Force RLS on every tenant table
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations',
    'memberships',
    'invitations',
    'organization_compliance',
    'policies',
    'ai_requests',
    'integrations',
    'api_keys',
    'audit_logs',
    'domains',
    'onboarding_progress',
    'data_export_requests',
    'data_deletion_requests',
    'subscriptions',
    'users',
    'passkeys',
    'two_factor_backup_codes',
    'sessions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

-- ─────────────────────────────────────────────────────────────────
-- 3. ORGANIZATIONS — read by id or slug (for subdomain resolver);
--    mutations require ownership.
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS org_select ON organizations;
CREATE POLICY org_select ON organizations
  FOR SELECT
  USING (
    is_service_role()
    OR id = current_org_id()
    OR slug = current_setting('app.current_org_slug', true)
  );

DROP POLICY IF EXISTS org_insert ON organizations;
CREATE POLICY org_insert ON organizations
  FOR INSERT
  WITH CHECK (is_service_role()); -- only signup flow + service role

DROP POLICY IF EXISTS org_update ON organizations;
CREATE POLICY org_update ON organizations
  FOR UPDATE
  USING (is_service_role() OR id = current_org_id())
  WITH CHECK (is_service_role() OR id = current_org_id());

DROP POLICY IF EXISTS org_delete ON organizations;
CREATE POLICY org_delete ON organizations
  FOR DELETE
  USING (is_service_role()); -- hard delete restricted to service role

-- ─────────────────────────────────────────────────────────────────
-- 4. MEMBERSHIPS — only members of the same org can see memberships
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS member_select ON memberships;
CREATE POLICY member_select ON memberships
  FOR SELECT
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  );

DROP POLICY IF EXISTS member_insert ON memberships;
CREATE POLICY member_insert ON memberships
  FOR INSERT
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

DROP POLICY IF EXISTS member_update ON memberships;
CREATE POLICY member_update ON memberships
  FOR UPDATE
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

DROP POLICY IF EXISTS member_delete ON memberships;
CREATE POLICY member_delete ON memberships
  FOR DELETE
  USING (is_service_role());

-- ─────────────────────────────────────────────────────────────────
-- 5. INVITATIONS
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS invite_all ON invitations;
CREATE POLICY invite_all ON invitations
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 6. ORGANIZATION_COMPLIANCE
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS compliance_all ON organization_compliance;
CREATE POLICY compliance_all ON organization_compliance
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 7. POLICIES
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS policy_all ON policies;
CREATE POLICY policy_all ON policies
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 8. AI_REQUESTS
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS request_all ON ai_requests;
CREATE POLICY request_all ON ai_requests
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 9. INTEGRATIONS
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS integration_all ON integrations;
CREATE POLICY integration_all ON integrations
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 10. API_KEYS
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS apikey_all ON api_keys;
CREATE POLICY apikey_all ON api_keys
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 11. AUDIT_LOGS — append-only at the policy level
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS audit_select ON audit_logs;
CREATE POLICY audit_select ON audit_logs
  FOR SELECT
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  );

DROP POLICY IF EXISTS audit_insert ON audit_logs;
CREATE POLICY audit_insert ON audit_logs
  FOR INSERT
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

DROP POLICY IF EXISTS audit_update ON audit_logs;
CREATE POLICY audit_update ON audit_logs
  FOR UPDATE
  USING (is_service_role()) -- audit logs are immutable from app
  WITH CHECK (false);         -- no updates allowed

DROP POLICY IF EXISTS audit_delete ON audit_logs;
CREATE POLICY audit_delete ON audit_logs
  FOR DELETE
  USING (is_service_role()); -- only retention jobs (service role)

-- ─────────────────────────────────────────────────────────────────
-- 12. DOMAINS
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS domain_all ON domains;
CREATE POLICY domain_all ON domains
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 13. ONBOARDING_PROGRESS
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS onboarding_all ON onboarding_progress;
CREATE POLICY onboarding_all ON onboarding_progress
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 14. DATA EXPORT / DELETION REQUESTS
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS data_export_all ON data_export_requests;
CREATE POLICY data_export_all ON data_export_requests
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

DROP POLICY IF EXISTS data_deletion_all ON data_deletion_requests;
CREATE POLICY data_deletion_all ON data_deletion_requests
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 14b. SUBSCRIPTIONS — tenant-isolated (BAI-004 / 2026-07-15).
--     Webhook handler uses service role (BYPASSRLS) because there's
--     no user session in webhook context — the org comes from Stripe
--     customer metadata set at checkout time.
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS subscription_all ON subscriptions;
CREATE POLICY subscription_all ON subscriptions
  FOR ALL
  USING (
    is_service_role()
    OR organization_id = current_org_id()
  )
  WITH CHECK (
    is_service_role()
    OR organization_id = current_org_id()
  );

-- ─────────────────────────────────────────────────────────────────
-- 15. USERS — user can read their own row + same-org members.
--     Updates restricted to self (service role for admin ops).
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS user_select ON users;
CREATE POLICY user_select ON users
  FOR SELECT
  USING (
    is_service_role()
    OR id = current_user_id()
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = users.id
        AND m.organization_id = current_org_id()
        AND m.status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS user_insert ON users;
CREATE POLICY user_insert ON users
  FOR INSERT
  WITH CHECK (is_service_role() OR id = current_user_id());

DROP POLICY IF EXISTS user_update ON users;
CREATE POLICY user_update ON users
  FOR UPDATE
  USING (is_service_role() OR id = current_user_id())
  WITH CHECK (is_service_role() OR id = current_user_id());

DROP POLICY IF EXISTS user_delete ON users;
CREATE POLICY user_delete ON users
  FOR DELETE
  USING (is_service_role());

-- ─────────────────────────────────────────────────────────────────
-- 16. PASSKEYS — user-scoped only (no tenant access)
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS passkey_all ON passkeys;
CREATE POLICY passkey_all ON passkeys
  FOR ALL
  USING (is_service_role() OR user_id = current_user_id())
  WITH CHECK (is_service_role() OR user_id = current_user_id());

-- ─────────────────────────────────────────────────────────────────
-- 17. TWO_FACTOR_BACKUP_CODES — user-scoped only
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS backup_code_all ON two_factor_backup_codes;
CREATE POLICY backup_code_all ON two_factor_backup_codes
  FOR ALL
  USING (is_service_role() OR user_id = current_user_id())
  WITH CHECK (is_service_role() OR user_id = current_user_id());

-- ─────────────────────────────────────────────────────────────────
-- 18. SESSIONS — user-scoped reads; service role manages lifecycle
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS session_select ON sessions;
CREATE POLICY session_select ON sessions
  FOR SELECT
  USING (is_service_role() OR user_id = current_user_id());

DROP POLICY IF EXISTS session_insert ON sessions;
CREATE POLICY session_insert ON sessions
  FOR INSERT
  WITH CHECK (is_service_role() OR user_id = current_user_id());

DROP POLICY IF EXISTS session_update ON sessions;
CREATE POLICY session_update ON sessions
  FOR UPDATE
  USING (is_service_role() OR user_id = current_user_id())
  WITH CHECK (is_service_role() OR user_id = current_user_id());

DROP POLICY IF EXISTS session_delete ON sessions;
CREATE POLICY session_delete ON sessions
  FOR DELETE
  USING (is_service_role() OR user_id = current_user_id());

-- ─────────────────────────────────────────────────────────────────
-- 19. GRANTs — explicit per-role
-- ─────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO brightai_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO brightai_app;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO brightai_readonly;
-- brightai_service already has BYPASSRLS; explicit grants keep it tidy.
GRANT ALL ON ALL TABLES IN SCHEMA public TO brightai_service;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO brightai_service;

-- ─────────────────────────────────────────────────────────────────
-- 20. Audit log hash chain — prevent tampering
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.compute_audit_hash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prev text;
BEGIN
  SELECT a.hash INTO prev
    FROM audit_logs a
   WHERE a.organization_id = NEW.organization_id
   ORDER BY a.created_at DESC
   LIMIT 1;
  NEW.prev_hash := prev;
  NEW.hash := encode(
    digest(
      coalesce(prev, '') || '|' ||
      NEW.organization_id || '|' ||
      NEW.action::text || '|' ||
      coalesce(NEW.actor_id, '') || '|' ||
      NEW.created_at::text,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS audit_log_hash ON audit_logs;
CREATE TRIGGER audit_log_hash
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_audit_hash();

-- ─────────────────────────────────────────────────────────────────
-- 21. Convenience: RLS-aware transaction wrapper
-- ─────────────────────────────────────────────────────────────────

-- Usage from app:
--   SELECT set_tenant_context('org_xxx', 'usr_yyy');
--
-- Returns void; raises if org_id is missing or malformed.
CREATE OR REPLACE FUNCTION public.set_tenant_context(
  p_org_id text,
  p_user_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_org_id IS NULL OR p_org_id = '' THEN
    RAISE EXCEPTION 'set_tenant_context: org_id is required';
  END IF;
  PERFORM set_config('app.current_org_id', p_org_id, true);
  IF p_user_id IS NOT NULL THEN
    PERFORM set_config('app.current_user_id', p_user_id, true);
  END IF;
END
$$;

GRANT EXECUTE ON FUNCTION public.set_tenant_context(text, text) TO brightai_app, brightai_readonly;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO brightai_app, brightai_readonly;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO brightai_app, brightai_readonly;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO brightai_app, brightai_readonly;

-- ─────────────────────────────────────────────────────────────────
-- End of RLS policies
-- ─────────────────────────────────────────────────────────────────