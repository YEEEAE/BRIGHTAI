// TDD contract tests for QC Laboratory role-action summaries, management data,
// and real change-request filters.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempRoot = mkdtempSync(join(tmpdir(), 'brightai-qc-management-'));
process.env.QC_DATABASE_PATH = join(tempRoot, 'management.db');
const management = await import('../src/lib/lab/management.ts');
const { canViewLabManagementDashboard } = await import('../src/lib/permissions.ts');
const changeRequests = await import('../src/lib/lab/changeRequests.ts');

assert.equal(typeof management.getLabRoleActionSummary, 'function');
assert.equal(typeof management.getLabManagementDashboard, 'function');
assert.equal(canViewLabManagementDashboard('admin'), true);
assert.equal(canViewLabManagementDashboard('manager'), true);
assert.equal(canViewLabManagementDashboard('supervisor'), false);
assert.equal(canViewLabManagementDashboard('employee'), false);
assert.equal(typeof changeRequests.parseChangeRequestFilters, 'function');
assert.deepEqual(changeRequests.parseChangeRequestFilters(new URLSearchParams('status=PENDING&aging=24h')), {
  status: 'PENDING',
  aging: '24h',
});

const overviewSource = await readFile(resolve(appDir, 'src/lib/lab/overview.ts'), 'utf8');
const managementSource = await readFile(resolve(appDir, 'src/lib/lab/management.ts'), 'utf8');
assert.doesNotMatch(overviewSource, /\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE INDEX)\b/i);
assert.doesNotMatch(managementSource, /\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE INDEX)\b/i);

const dashboard = management.getLabManagementDashboard();
for (const value of [
  dashboard.attention.approvalQueue,
  dashboard.attention.pendingChangeRequests,
  dashboard.attention.waitingOver24h,
  dashboard.risk.overdueCalibration,
  dashboard.risk.equipmentAttention,
  dashboard.quality.failTests,
  dashboard.quality.holdTests,
  dashboard.quality.openRetests,
  dashboard.quality.dataQualityIssues,
  dashboard.assurance.recentAuditEvents,
]) {
  assert.equal(Number.isFinite(value), true, 'management dashboard counts are finite');
}
assert.equal(dashboard.quality.failHoldTrend.length, 8, 'management dashboard returns eight weekly trend points');
assert.ok(['PASS', 'FAIL'].includes(dashboard.assurance.audit.qcLab.status), 'management dashboard includes audit status');
const { closeDatabase } = await import('../src/lib/db.ts');
closeDatabase();
rmSync(tempRoot, { recursive: true, force: true });

console.log('✅ Lab management contract checks passed.');
