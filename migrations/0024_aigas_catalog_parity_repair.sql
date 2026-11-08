-- LOCAL INCREMENTAL REPAIR DRAFT — NOT APPLIED.
-- Reconcile only the catalog gaps observed on production on 2026-11-08:
-- nullable audit-context columns from 0017 and the Ledger append-chain trigger
-- from 0013. This does not replace either source migration and does not change
-- rows, constraints, indexes, table privileges, roles, or RLS policies.
--
-- Apply only after an owner-approved isolated staging rehearsal and after the
-- operator records which source migrations were already satisfied. There is
-- no migration ledger on the inspected database. Do not replay 0017 after this
-- repair unless that source migration is made idempotent or its completion is
-- otherwise reconciled, because its original ADD COLUMN statements are not
-- guarded with IF NOT EXISTS.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.aigas_audit_events') IS NULL THEN
    RAISE EXCEPTION 'Required table public.aigas_audit_events is missing';
  END IF;
  IF to_regclass('public.aigas_ld_events') IS NULL THEN
    RAISE EXCEPTION 'Required table public.aigas_ld_events is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'aigas_ld_events'
      AND column_name IN ('tenant_id', 'sequence_no', 'previous_hash', 'integrity_hash')
    GROUP BY table_schema, table_name
    HAVING count(*) = 4
  ) THEN
    RAISE EXCEPTION 'Ledger chain prerequisite columns are incomplete';
  END IF;
END
$$;

-- Optional identifiers for historical rows; no defaults means no fabricated
-- audit context is written while the columns are added.
ALTER TABLE public.aigas_audit_events
  ADD COLUMN IF NOT EXISTS correlation_id uuid,
  ADD COLUMN IF NOT EXISTS policy_version text,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

DO $$
DECLARE
  actual_type text;
  expected record;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('correlation_id', 'uuid'),
      ('policy_version', 'text'),
      ('idempotency_key', 'text')
    ) AS v(column_name, data_type)
  LOOP
    SELECT c.data_type INTO actual_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'aigas_audit_events'
      AND c.column_name = expected.column_name;

    IF actual_type IS DISTINCT FROM expected.data_type THEN
      RAISE EXCEPTION 'Unexpected type for aigas_audit_events.%: expected %, found %',
        expected.column_name, expected.data_type, actual_type;
    END IF;
  END LOOP;
END
$$;

-- Same append-link guard contract as 0013. Existing rows are not rewritten or
-- revalidated; future inserts must point to the immediately previous event.
CREATE OR REPLACE FUNCTION public.aigas_ld_events_chain_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  parent public.aigas_ld_events%ROWTYPE;
BEGIN
  IF NEW.sequence_no = 1 THEN
    IF NEW.previous_hash IS NOT NULL THEN
      RAISE EXCEPTION 'Ledger genesis must not reference a previous hash';
    END IF;
    RETURN NEW;
  END IF;

  SELECT * INTO parent
  FROM public.aigas_ld_events
  WHERE tenant_id = NEW.tenant_id
    AND sequence_no = NEW.sequence_no - 1;

  IF NOT FOUND OR parent.integrity_hash IS DISTINCT FROM NEW.previous_hash THEN
    RAISE EXCEPTION 'Ledger sequence gap or wrong previous hash';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.aigas_ld_events_chain_guard() FROM PUBLIC;

DO $$
DECLARE
  trigger_exists boolean;
  trigger_matches boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'aigas_ld_events'
      AND t.tgname = 'aigas_ld_events_chain_guard'
      AND NOT t.tgisinternal
  ) INTO trigger_exists;

  IF trigger_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = 'aigas_ld_events'
        AND t.tgname = 'aigas_ld_events_chain_guard'
        AND NOT t.tgisinternal
        AND t.tgfoid = to_regprocedure('public.aigas_ld_events_chain_guard()')
    ) INTO trigger_matches;

    IF NOT trigger_matches THEN
      RAISE EXCEPTION 'Trigger name exists with a different function';
    END IF;
  ELSE
    EXECUTE 'CREATE TRIGGER aigas_ld_events_chain_guard
      BEFORE INSERT ON public.aigas_ld_events
      FOR EACH ROW EXECUTE FUNCTION public.aigas_ld_events_chain_guard()';
  END IF;
END
$$;

COMMIT;
