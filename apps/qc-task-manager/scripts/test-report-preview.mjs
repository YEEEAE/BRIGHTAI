import assert from 'node:assert/strict';

const { resolveReportPreview } = await import('../src/lib/reporting/preview.ts');
const { emptyReportFilters } = await import('../src/lib/reporting/filters.ts');

const employee = { id: 4, role: 'employee', department: 'QC' };
const supervisor = { id: 2, role: 'supervisor', department: 'QC' };

const denied = await resolveReportPreview({
  actor: employee,
  reportType: 'lab-test-register',
  filters: emptyReportFilters,
  comprehensive: false,
});
assert.equal(denied.allowed, false, 'unauthorized lab preview is denied before count resolution');
assert.match(denied.reason, /laboratory reports/i);

const preview = await resolveReportPreview({
  actor: supervisor,
  reportType: 'monthly-qc',
  filters: emptyReportFilters,
  comprehensive: false,
});
assert.equal(preview.allowed, true);
assert.equal(preview.scope.kind, 'department');
assert.equal(preview.actor.role, 'supervisor');
assert.ok('matchingRowCount' in preview);

console.log('Report preview tests passed.');
