-- ═══════════════════════════════════════════════════════════════════
-- BrightAI — Postgres init script (runs once on first container start)
-- ═══════════════════════════════════════════════════════════════════
--
-- Creates the application + service roles. The actual GRANTs for
-- existing tables happen in rls.sql (run by setup-local-db.mjs after
-- Prisma migrate). This file only creates the LOGIN roles.
--
-- Why here: docker-entrypoint-initdb.d runs before the schema exists,
-- so the roles can be referenced by RLS policies + Prisma's
-- DATABASE_URL. Brightai_admin is the role that owns the schema and
-- runs migrations. The other two are used by the application at
-- runtime (RLS subject) and service-role jobs (BYPASSRLS).
--
-- Passwords here are dev-only and match .env.example.
-- ═══════════════════════════════════════════════════════════════════

-- brightai_app: runtime application user, subject to RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brightai_app') THEN
    CREATE ROLE brightai_app LOGIN PASSWORD 'brightai_app';
  END IF;
END
$$;

-- brightai_service: cross-tenant background jobs, BYPASSRLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brightai_service') THEN
    CREATE ROLE brightai_service LOGIN PASSWORD 'brightai_service' BYPASSRLS;
  END IF;
END
$$;

-- brightai_readonly: analytics / BI, subject to RLS, read-only
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brightai_readonly') THEN
    CREATE ROLE brightai_readonly LOGIN PASSWORD 'brightai_readonly';
  END IF;
END
$$;
