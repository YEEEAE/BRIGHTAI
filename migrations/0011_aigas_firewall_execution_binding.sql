-- REVIEW ONLY upgrade. Applies only to a database that already carries an earlier 0002
-- revision without execution binding. A fresh install should use the current
-- 0002_aigas_firewall.sql directly. Do not apply to Neon production from this task.
-- Requires Kernel 0001 and the reviewed Kernel administration migration 0006.
BEGIN;
ALTER TABLE public.aigas_fw_decisions ADD COLUMN policy_version text;
ALTER TABLE public.aigas_fw_decisions ADD COLUMN request_fingerprint text;
-- Existing rows cannot be rebound after the fact; mark them with the evaluator
-- version. Their fingerprint stays NULL and runtime treats them as a conflict,
-- never as a replayable decision.
UPDATE public.aigas_fw_decisions SET policy_version='firewall-evaluator-v2' WHERE policy_version IS NULL;
ALTER TABLE public.aigas_fw_decisions ALTER COLUMN policy_version SET DEFAULT 'firewall-evaluator-v2';
ALTER TABLE public.aigas_fw_decisions ALTER COLUMN policy_version SET NOT NULL;
-- NOT VALID keeps historical rows readable while enforcing the format on new writes.
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_policy_version_check CHECK (policy_version ~ '^[a-zA-Z0-9_.:-]{1,120}$') NOT VALID;
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_request_fingerprint_check CHECK (request_fingerprint IS NULL OR request_fingerprint ~ '^[0-9a-f]{64}$') NOT VALID;
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_guard_binding_check CHECK (mode <> 'GUARD' OR request_fingerprint IS NOT NULL) NOT VALID;
COMMIT;
