// QC-100 security contract: the role matrix is executable and the source
// remains governed by src/lib/permissions.ts as its only authorization owner.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as permissions from '../src/lib/permissions.ts';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const roles = ['employee', 'supervisor', 'manager', 'admin'];
const all = [true, true, true, true];
const supervisorPlus = [false, true, true, true];
const managerPlus = [false, false, true, true];
const adminOnly = [false, false, false, true];
const employeeOnly = [true, false, false, false];

function checkMatrix(name, fn, expected) {
  assert.deepEqual(roles.map((role) => fn(role)), expected, `${name} role matrix`);
}

// Anonymous is denied before any permission predicate is reached by the
// requireApiUser/session wall; authenticated role predicates are exhaustive.
checkMatrix('PERMISSIONS.canViewDashboard', permissions.PERMISSIONS.canViewDashboard, [false, true, true, true]);
checkMatrix('PERMISSIONS.canManageUsers', permissions.PERMISSIONS.canManageUsers, adminOnly);
checkMatrix('PERMISSIONS.canViewUserAudit', permissions.PERMISSIONS.canViewUserAudit, adminOnly);
checkMatrix('PERMISSIONS.canManageTemplates', permissions.PERMISSIONS.canManageTemplates, adminOnly);
checkMatrix('PERMISSIONS.canOverrideEvidenceGate', permissions.PERMISSIONS.canOverrideEvidenceGate, managerPlus);
checkMatrix('canAccessManagerArea', permissions.canAccessManagerArea, managerPlus);
checkMatrix('canAccessSupervisorArea', permissions.canAccessSupervisorArea, supervisorPlus);
checkMatrix('canSubmitDeleteRequest', permissions.canSubmitDeleteRequest, employeeOnly);
checkMatrix('canReviewDeleteRequests', permissions.canReviewDeleteRequests, managerPlus);
checkMatrix('canAssignTask', permissions.canAssignTask, supervisorPlus);
checkMatrix('canViewTeamWorkload', permissions.canViewTeamWorkload, supervisorPlus);
checkMatrix('canApproveCapa', permissions.canApproveCapa, managerPlus);
checkMatrix('canApproveFinding', permissions.canApproveFinding, managerPlus);
checkMatrix('canReviewFinding', permissions.canReviewFinding, supervisorPlus);
checkMatrix('canViewLab', permissions.canViewLab, all);
checkMatrix('canCreateLabTest', permissions.canCreateLabTest, all);
checkMatrix('canReviewLabTest', permissions.canReviewLabTest, supervisorPlus);
checkMatrix('canApproveLabTest', permissions.canApproveLabTest, managerPlus);
checkMatrix('canVoidLabTest', permissions.canVoidLabTest, managerPlus);
checkMatrix('canCreateLabProduct', permissions.canCreateLabProduct, managerPlus);
checkMatrix('canArchiveLabProduct', permissions.canArchiveLabProduct, managerPlus);
checkMatrix('canApproveLabTemplate', permissions.canApproveLabTemplate, managerPlus);
checkMatrix('canArchiveLabTemplate', permissions.canArchiveLabTemplate, managerPlus);
checkMatrix('canCreateLabEquipment', permissions.canCreateLabEquipment, managerPlus);
checkMatrix('canArchiveLabEquipment', permissions.canArchiveLabEquipment, managerPlus);
checkMatrix('canApplyLabEquipmentChange', permissions.canApplyLabEquipmentChange, managerPlus);
checkMatrix('canCreateLabCalibration', permissions.canCreateLabCalibration, managerPlus);
checkMatrix('canViewLabReports', permissions.canViewLabReports, supervisorPlus);
checkMatrix('canExportLabData', permissions.canExportLabData, supervisorPlus);
checkMatrix('canViewLabDataQuality', permissions.canViewLabDataQuality, supervisorPlus);
checkMatrix('canViewLabManagementDashboard', permissions.canViewLabManagementDashboard, managerPlus);
checkMatrix('canViewLabAudit', permissions.canViewLabAudit, supervisorPlus);
checkMatrix('canReviewLabChangeRequests', permissions.canReviewLabChangeRequests, managerPlus);
checkMatrix('canUseLabAiAssist', permissions.canUseLabAiAssist, all);

assert.equal(permissions.canApproveLabChangeRequest({ id: 10, role: 'manager' }, { requested_by: 10 }), false, 'change request requester cannot approve own request');
assert.equal(permissions.canApproveLabChangeRequest({ id: 11, role: 'manager' }, { requested_by: 10 }), true, 'unrelated manager may approve change request');
assert.equal(permissions.canApproveLabTestRecord({ id: 10, role: 'manager' }, { status: 'SUBMITTED', tested_by: 10, reviewed_by: null, created_by: 10 }), false, 'tester cannot approve own test');
assert.equal(permissions.canApproveLabTestRecord({ id: 10, role: 'manager' }, { status: 'SUBMITTED', tested_by: 11, reviewed_by: 10, created_by: 11 }), false, 'reviewer cannot approve same test');
assert.equal(permissions.canApproveLabDocumentRecord({ id: 10, role: 'manager' }, { status: 'IN_REVIEW', owner_id: 10, created_by: 10, author_id: 10 }), false, 'document author cannot approve own version');
assert.equal(permissions.canApproveLabDocumentRecord({ id: 11, role: 'manager' }, { status: 'IN_REVIEW', owner_id: 10, created_by: 10, author_id: 10 }), true, 'unrelated manager may approve document version');
assert.equal(permissions.canApproveLabTemplateVersionRecord({ id: 10, role: 'manager' }, { status: 'IN_REVIEW', created_by: 10, author_id: 10 }), false, 'template author cannot approve own version');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|astro)$/.test(entry.name)) out.push(path);
  }
  return out;
}

const permissionPath = join(appRoot, 'src/lib/permissions.ts');
const permissionSource = readFileSync(permissionPath, 'utf8');
const duplicateNames = [...permissionSource.matchAll(/^export function (can\w+)/gm)].map((m) => m[1]).filter((name, i, names) => names.indexOf(name) !== i);
assert.deepEqual(duplicateNames, [], 'permissions.ts has no duplicate exported permission declarations');

for (const file of walk(join(appRoot, 'src/pages/api'))) {
  const source = readFileSync(file, 'utf8');
  const label = relative(appRoot, file);
  if (!label.endsWith('health.ts') && !label.endsWith('readiness.ts')) assert.match(source, /requireApiUser\(/, `${label} re-checks session`);
  if (/export const (POST|PUT|PATCH|DELETE)/.test(source)) assert.match(source, /requireCsrf\(/, `${label} protects state change with CSRF`);
}

console.log('SECURITY-RBAC-PRIVACY-100: PASS (role matrix, segregation, canonical permission source, API guards)');
