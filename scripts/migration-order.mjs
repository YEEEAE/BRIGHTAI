// Canonical migration order. Imported by the local rehearsal and the target runner so
// the two can never disagree about sequence.
//
// FRESH_ORDER builds an empty database from migrations/ using the current 0002/0003.
// DELTA_ORDER closes the inspected production branch, which already ran an older 0003
// (before the ledger chain guard existed) and never ran 0013/0014/0016/0017/0018/002x.

// Replaced by a newer file that is used instead on a fresh install.
export const UPGRADE_ONLY = ['0011', '0012', '0013', '0019'];

// The delta baseline reproduces the live branch state, not a fresh install.
export const DELTA_BASELINE = [
  '0001', '0002', '0003@pre-chain-guard', '0004', '0005', '0006', '0007',
  '0008', '0009', '0010', '0015',
];

export const DELTA_ORDER = [
  '0013', '0014', '0016', '0017', '0018', '0020', '0021', '0022', '0023',
  '0025', '0026', '0027', '0028', '0029', '0024',
];

export function freshOrder(files) {
  return files
    .filter(file => !file.historical && !UPGRADE_ONLY.includes(file.key))
    .map(file => file.key);
}

// Tables the inspected branch had before the delta ran. Used as a hard stop so the
// runner cannot be pointed at a database that is not the one under review.
export const LIVE_BASELINE_TABLES = [
  'aigas_audit_events', 'aigas_auth_organizations', 'aigas_department_events',
  'aigas_department_memberships', 'aigas_departments', 'aigas_fw_decisions', 'aigas_fw_rules',
  'aigas_hg_decisions', 'aigas_hg_events', 'aigas_hg_policies', 'aigas_hg_requests',
  'aigas_kernel_policy_decisions', 'aigas_ld_events', 'aigas_ld_evidence_requirements',
  'aigas_member_invitations', 'aigas_memberships', 'aigas_policies', 'aigas_policy_approvals',
  'aigas_policy_delegations', 'aigas_policy_versions', 'aigas_product_access',
  'aigas_product_grants', 'aigas_re_assessments', 'aigas_re_asset_revisions', 'aigas_re_assets',
  'aigas_re_treatment_revisions', 'aigas_sc_cancellations', 'aigas_sc_conversations',
  'aigas_sc_messages', 'aigas_sc_requests', 'aigas_tenants',
];

// Client roles that the Neon Data API provisions. 0018/0025/0027 revoke from them
// unconditionally, so a target without the Data API must either create empty stubs or
// the revoke statements fail with SQLSTATE 42704. See the P02 report, finding PORT-0018.
export const CLIENT_ROLES = ['authenticated', 'anonymous'];
