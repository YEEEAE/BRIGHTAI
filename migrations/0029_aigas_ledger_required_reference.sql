-- LOCAL ONLY: SQL NULL must not satisfy the synthetic evidence UUID contract.
-- NOT VALID preserves historical rows; new rows must satisfy the current contract.
BEGIN;
ALTER TABLE public.aigas_ld_events ADD CONSTRAINT aigas_ld_synthetic_reference_required
 CHECK (source <> 'ledger.synthetic-lab' OR
   ((metadata_json->>'decision_ref') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') IS TRUE) NOT VALID;
COMMIT;
