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
  '0025', '0026', '0027', '0028', '0029', '0024', '0030', '0031', '0032', '0033',
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

// Optional empty client roles for rehearsing the Neon Data API privilege posture.
// Current migrations guard revocation when these roles are absent.
export const CLIENT_ROLES = ['authenticated', 'anonymous'];

// Resume only a verified prefix of the fresh-install ledger; never replay upgrade-only
// migrations or infer application from table counts. Validate ALL rows before writing.
export function resumeOrder(files, ledger) {
  const order = freshOrder(files);
  const expected = order.map(key => files.find(file => file.key === key));
  const known = new Map(expected.map(file => [file.name, file]));
  const applied = new Set();
  for (const row of ledger) {
    const file = known.get(row.filename);
    if (!file || row.status !== 'APPLIED' || row.sha256 !== file.sha256 || applied.has(row.filename)) {
      throw new Error(`Unverified migration ledger: ${row.filename}`);
    }
    applied.add(row.filename);
  }
  if (!applied.size) throw new Error('Resume requires an existing verified ledger');
  let missing = false;
  for (const file of expected) {
    if (!applied.has(file.name)) missing = true;
    else if (missing) throw new Error(`Ledger is not a fresh-order prefix: ${file.name}`);
  }
  return expected.filter(file => !applied.has(file.name));
}

// Existing SQL files own a single outer transaction. Move ONLY that envelope to
// the caller, allowing schema changes and their hash receipt to commit atomically.
export function migrationBody(body) {
  const match = body.match(/^((?:\s|--[^\n]*(?:\n|$))*)BEGIN;([\s\S]*)COMMIT;((?:\s|--[^\n]*(?:\n|$))*)$/i);
  if (!match) throw new Error('Migration must have one outer BEGIN/COMMIT envelope');
  if (/^\s*(?:BEGIN|COMMIT|ROLLBACK)\s*;/im.test(match[2])) {
    // PL/pgSQL BEGIN has no semicolon; transaction control is not permitted inside.
    throw new Error('Unexpected transaction boundary in migration');
  }
  return match[1] + match[2];
}

// Schema and receipt are one durable unit; callers may record failure separately.
export async function applyMigration(client, file) {
  const started = Date.now();
  await client.query('BEGIN');
  try {
    await client.query(migrationBody(file.body));
    await client.query(
      `INSERT INTO ops.aigas_migration_ledger(filename,sha256,duration_ms,status)
       VALUES($1,$2,$3,'APPLIED') ON CONFLICT(filename) DO UPDATE
       SET status='APPLIED',duration_ms=EXCLUDED.duration_ms,applied_at=now(),detail=NULL`,
      [file.name, file.sha256, Date.now() - started]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
