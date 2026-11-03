-- LOCAL PREPARATION ONLY. Apply only to an explicitly approved isolated environment.
-- Additive upgrade for databases that already carry 0010. No table is recreated and no
-- policy, approval, delegation or decision row is created, converted or deleted.
-- The matching fresh-install baseline in 0010 gains the same column, constraint and index;
-- this file is safe to run once on an older 0010 and is a no-op on a fresh 0010.
BEGIN;

-- Number of distinct, non-authoring approvers a version needs before it can be published.
-- 1 keeps the existing single-reviewer flow; 2 is the opt-in four-eyes requirement.
ALTER TABLE public.aigas_policy_versions
  ADD COLUMN IF NOT EXISTS required_approvals smallint NOT NULL DEFAULT 1;

ALTER TABLE public.aigas_policy_versions
  DROP CONSTRAINT IF EXISTS aigas_policy_versions_required_approvals_check;
ALTER TABLE public.aigas_policy_versions
  ADD CONSTRAINT aigas_policy_versions_required_approvals_check
    CHECK (required_approvals BETWEEN 1 AND 2);

-- Withdrawing a submitted version returns it to DRAFT and must be recorded in the
-- append-only approval trail. The 0010 constraint predates that action.
ALTER TABLE public.aigas_policy_approvals
  DROP CONSTRAINT IF EXISTS aigas_policy_approvals_action_check;

ALTER TABLE public.aigas_policy_approvals
  ADD CONSTRAINT aigas_policy_approvals_action_check
    CHECK (action IN ('SUBMITTED','APPROVED','PUBLISHED','RETIRED','WITHDRAWN'));

-- One recorded decision per actor, policy version and action within a review round. A
-- refresh or a repeated click can never stack the same approval twice; a later round
-- after a withdrawal is counted from its own SUBMITTED entry, so the lookup is an index.
CREATE INDEX IF NOT EXISTS aigas_policy_approvals_actor_action_idx
  ON public.aigas_policy_approvals(tenant_id, policy_id, version, action, actor_user_id);

REVOKE ALL ON public.aigas_policy_approvals FROM PUBLIC;

COMMIT;
