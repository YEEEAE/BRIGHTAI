-- REVIEWED UPGRADE: legacy Firewall 0002 (three states) -> current five states + binding.
-- Apply only to a database that already has the three-state Firewall tables.
-- A fresh install should use the current 0002_aigas_firewall.sql; a database that
-- already applied the five-state 0002 but lacks the binding columns should use 0011.
-- Converts any stored BLOCK/RULE_BLOCK values to DENY/RULE_DENY. No prompt is read,
-- written or hashed here.
BEGIN;

-- 1) Drop the constraints that encode the legacy three-state vocabulary.
ALTER TABLE public.aigas_fw_rules DROP CONSTRAINT IF EXISTS aigas_fw_rules_action_check;
ALTER TABLE public.aigas_fw_rules DROP CONSTRAINT IF EXISTS aigas_fw_rules_check;
ALTER TABLE public.aigas_fw_decisions DROP CONSTRAINT IF EXISTS aigas_fw_decisions_action_check;
ALTER TABLE public.aigas_fw_decisions DROP CONSTRAINT IF EXISTS aigas_fw_decisions_reason_check;
ALTER TABLE public.aigas_fw_decisions DROP CONSTRAINT IF EXISTS aigas_fw_decisions_check2;
ALTER TABLE public.aigas_fw_decisions DROP CONSTRAINT IF EXISTS aigas_fw_decisions_check3;
ALTER TABLE public.aigas_fw_decisions DROP CONSTRAINT IF EXISTS aigas_fw_decisions_check4;
ALTER TABLE public.aigas_fw_decisions DROP CONSTRAINT IF EXISTS aigas_fw_decisions_check5;

-- 2) Convert stored legacy values before the new checks are added.
UPDATE public.aigas_fw_rules SET action='DENY' WHERE action='BLOCK';
UPDATE public.aigas_fw_decisions SET action='DENY' WHERE action='BLOCK';
UPDATE public.aigas_fw_decisions SET reason='RULE_DENY' WHERE reason='RULE_BLOCK';

-- 3) Durable execution binding.
ALTER TABLE public.aigas_fw_decisions ADD COLUMN policy_version text;
ALTER TABLE public.aigas_fw_decisions ADD COLUMN request_fingerprint text;
UPDATE public.aigas_fw_decisions SET policy_version='firewall-evaluator-v2' WHERE policy_version IS NULL;
ALTER TABLE public.aigas_fw_decisions ALTER COLUMN policy_version SET DEFAULT 'firewall-evaluator-v2';
ALTER TABLE public.aigas_fw_decisions ALTER COLUMN policy_version SET NOT NULL;

-- 4) Current five-state rules and templates.
ALTER TABLE public.aigas_fw_rules
 ADD CONSTRAINT aigas_fw_rules_action_check CHECK (action IN ('ALLOW','WARN','REDACT','ESCALATE','DENY'));
ALTER TABLE public.aigas_fw_rules
 ADD CONSTRAINT aigas_fw_rules_check CHECK (template IS NULL OR
  (template='public' AND name='بيانات عامة' AND pattern='معلومة عامة' AND action='ALLOW' AND priority=30) OR
  (template='identifier' AND name='معرّف اصطناعي' AND pattern='DEMO-ID-1234' AND action='REDACT' AND priority=20) OR
  (template='prohibited' AND name='محتوى محظور اصطناعي' AND pattern='DEMO-BLOCK' AND action='DENY' AND priority=10));

-- 5) Current five-state decisions.
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_action_check CHECK (action IN ('ALLOW','WARN','REDACT','ESCALATE','DENY'));
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_reason_check CHECK (reason IN ('NO_ACTIVE_POLICY','INVALID_POLICY','RULE_DENY','RULE_ESCALATE','RULE_REDACT','RULE_WARN','RULE_ALLOW','NO_MATCH_LAB_ONLY','NO_MATCH_ENFORCED','KERNEL_POLICY_DENIED'));
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_reason_action_check CHECK (
  (reason IN ('NO_ACTIVE_POLICY','INVALID_POLICY','RULE_DENY','NO_MATCH_ENFORCED','KERNEL_POLICY_DENIED') AND action='DENY') OR
  (reason='RULE_ESCALATE' AND action='ESCALATE') OR
  (reason='RULE_REDACT' AND action='REDACT') OR
  (reason='RULE_WARN' AND action='WARN') OR
  (reason IN ('RULE_ALLOW','NO_MATCH_LAB_ONLY') AND action='ALLOW'));
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_rule_ref_check CHECK ((reason IN ('RULE_DENY','RULE_ESCALATE','RULE_REDACT','RULE_WARN','RULE_ALLOW'))=(rule_id IS NOT NULL));
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_guard_lab_check CHECK (mode <> 'GUARD' OR reason <> 'NO_MATCH_LAB_ONLY');
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_lab_guard_check CHECK (mode <> 'LAB' OR reason <> 'NO_MATCH_ENFORCED');
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_kernel_deny_check CHECK (reason <> 'KERNEL_POLICY_DENIED' OR mode='GUARD');

-- 6) Binding format. Legacy GUARD rows may have no fingerprint, so the presence
-- check is NOT VALID for history but enforced for every new row.
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_policy_version_check CHECK (policy_version ~ '^[a-zA-Z0-9_.:-]{1,120}$');
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_request_fingerprint_check CHECK (request_fingerprint IS NULL OR request_fingerprint ~ '^[0-9a-f]{64}$');
ALTER TABLE public.aigas_fw_decisions
 ADD CONSTRAINT aigas_fw_decisions_guard_binding_check CHECK (mode <> 'GUARD' OR request_fingerprint IS NOT NULL) NOT VALID;

COMMIT;
