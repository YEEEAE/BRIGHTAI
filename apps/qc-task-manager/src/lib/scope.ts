// Employee row-scope fragments — SINGLE authority for the data-ownership rule
// "employees see only records they own (created) or are assigned to (tested)".
//
// These SQL fragments were previously copy-pasted as raw literals across
// 10+ modules and a role page; a change to the ownership rule had to be made
// in every copy. The fragments now live exactly here and nowhere else (the
// architecture guard fails on any other occurrence).
//
// Two shapes per rule: an unprefixed fragment for single-table queries (and
// for the `NOT (...)` peer-exclusion queries), and a `t.`-prefixed fragment
// for the joined register queries. SQL stays fully parameterized: each
// fragment binds the same placeholder pair produced by rowScopeParams(userId).
// No user input is concatenated.

/** Task ownership, unprefixed (single-table queries, NOT(...) exclusions). */
export const TASK_OWNERSHIP_SQL = '(assigned_to = ? OR created_by = ?)';

/** Lab test ownership, unprefixed. */
export const LAB_TEST_OWNERSHIP_SQL = '(tested_by = ? OR created_by = ?)';

/** Lab document ownership (owner or creator), unprefixed. */
export const LAB_DOCUMENT_OWNERSHIP_SQL = '(owner_id = ? OR created_by = ?)';

/** Task ownership scope for joined register queries (alias `t`). */
export const TASK_ROW_SCOPE_SQL = '(t.assigned_to = ? OR t.created_by = ?)';

/** Lab test ownership scope for joined register queries (alias `t`). */
export const LAB_TEST_ROW_SCOPE_SQL = '(t.tested_by = ? OR t.created_by = ?)';

/** Lab document ownership scope for joined queries (alias `d`). */
export const LAB_DOCUMENT_ROW_SCOPE_SQL = '(d.owner_id = ? OR d.created_by = ?)';

/** Placeholder pair bound to any scope fragment (same user id, twice). */
export function rowScopeParams(userId: number): [number, number] {
  return [userId, userId];
}

