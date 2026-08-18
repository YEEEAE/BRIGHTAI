import { getDb } from '../db';
import { canViewLabTests, canReviewLabTest, canViewLabEquipment, canViewLabDocuments, canViewLabRetests, canViewLabReports, canViewLabDataQuality } from '../permissions';
import type { User } from '../types';
import {
  getLabTestRecordById,
  listLabTestSamples,
  getLabTestEquipmentSnapshot,
  getLabTestDocumentSnapshots,
  getLabTestRetestHistory,
  getLabTestAuditTimeline,
} from './tests';
import { getLabEquipmentDetail, getLabEquipmentTimeline, listLabEquipmentMaintenance } from './equipment';
import { getLabCalibrationSummary } from './calibration';
import { getLabDocumentVersions } from './documents';
import { runLabDataQualityChecks } from './dataQuality';
import { searchLabRetests, NO_LAB_RETEST_FILTERS } from './retests';

export type LabAiContextResult = { ok: true; context: Record<string, unknown> } | { ok: false; status: 400 | 403 | 404; error: string };

const TEST_RECORD_FIELDS = 'id, test_number, test_type, product_id, product_name, product_code, equipment_id, equipment_name, equipment_code, template_id, lot_number, sample_count, tested_by, tester_name, reviewed_by, reviewer_name, approved_by, approver_name, status, final_result, remarks, sampling_area, medium_used, connector_type, actual_pressure, torque_in_lb, time_sec, angle, temperature_measured, rejected_reason, void_reason, submitted_at, submitted_at, reviewed_at, approved_at, created_by, creator_name, created_at';

/** Employee record-level scope mirrors the register/details page: employees
 *  may only open tests they tested or created. */
function employeeCanAccessTest(record: Record<string, unknown> | undefined, user: User): boolean {
  if (!record) return false;
  const testedBy = record.tested_by == null ? null : Number(record.tested_by);
  const createdBy = record.created_by == null ? null : Number(record.created_by);
  return user.role !== 'employee' || testedBy === user.id || createdBy === user.id;
}

function minimizedTestContext(testId: number): Record<string, unknown> | null {
  const record = getLabTestRecordById(testId);
  if (!record) return null;
  const picked: Record<string, unknown> = {};
  for (const field of TEST_RECORD_FIELDS.split(', ').map((f) => f.trim())) {
    if (record[field] !== undefined) picked[field] = record[field];
  }
  return {
    test: picked,
    samples: listLabTestSamples(testId).map((s) => ({ sample_no: s.sample_no, sample_identifier: s.sample_identifier, result: s.result, status: s.status, leakage_rate: s.leakage_rate })),
    equipment_snapshot: getLabTestEquipmentSnapshot(testId) ?? null,
    document_snapshots: getLabTestDocumentSnapshots(testId),
    retests: getLabTestRetestHistory(testId).map((r) => ({ retest_number: r.retest_number, reason: r.reason, status: r.status, created_at: r.created_at, new_test_result: r.new_test_result })),
    timeline_tail: getLabTestAuditTimeline(testId).slice(-15).map((a) => ({ action: a.action, created_at: a.created_at, note: a.note })),
  };
}

/** Summarize one test — any role that can view lab tests, record-level read only. */
export function labTestSummaryContext(testId: number, user: User): LabAiContextResult {
  if (!canViewLabTests(user.role)) return { ok: false, status: 403, error: 'You are not authorized to use AI assistance for laboratory tests.' };
  if (!employeeCanAccessTest(getLabTestRecordById(testId), user)) return { ok: false, status: 404, error: 'Test not found.' };
  const context = minimizedTestContext(testId);
  if (!context) return { ok: false, status: 404, error: 'Test not found.' };
  return { ok: true, context };
}

/** Identify missing fields on one test — same scope as viewing the record. */
export function labMissingFieldsContext(testId: number, user: User): LabAiContextResult {
  if (!canViewLabTests(user.role)) return { ok: false, status: 403, error: 'You are not authorized to use AI assistance for laboratory tests.' };
  if (!employeeCanAccessTest(getLabTestRecordById(testId), user)) return { ok: false, status: 404, error: 'Test not found.' };
  const context = minimizedTestContext(testId);
  if (!context) return { ok: false, status: 404, error: 'Test not found.' };
  return { ok: true, context };
}

/** Suggest review questions — reviewers only (supervisor+). */
export function labReviewQuestionsContext(testId: number, user: User): LabAiContextResult {
  if (!canReviewLabTest(user.role)) return { ok: false, status: 403, error: 'AI review questions are only available to reviewers.' };
  const context = minimizedTestContext(testId);
  if (!context) return { ok: false, status: 404, error: 'Test not found.' };
  return { ok: true, context };
}

/** Compare a test against its approved SOP/WI reference content. */
export function labSopComparisonContext(testId: number, user: User): LabAiContextResult {
  if (!canViewLabTests(user.role)) return { ok: false, status: 403, error: 'You are not authorized to use AI assistance for laboratory tests.' };
  if (!employeeCanAccessTest(getLabTestRecordById(testId), user)) return { ok: false, status: 404, error: 'Test not found.' };
  const context = minimizedTestContext(testId);
  if (!context) return { ok: false, status: 404, error: 'Test not found.' };
  // Resolve the stored (document_id, version_number) snapshots to the immutable
  // approved version content — the only legitimate source of acceptance criteria.
  const references = getDb()
    .prepare(
      `SELECT s.role, s.document_id, s.document_code, s.version_number, s.title,
              v.content_md, v.change_summary, v.approved_at, v.approved_by
       FROM lab_test_document_snapshots s
       LEFT JOIN lab_document_versions v ON v.document_id = s.document_id AND v.version = s.version_number
       WHERE s.test_id = ?
       ORDER BY s.role ASC`,
    )
    .all(testId) as Record<string, unknown>[];
  return { ok: true, context: { ...context, approved_references: references } };
}

/** Summarize equipment history — any role that can view lab equipment. */
export function labEquipmentHistoryContext(equipmentId: number, user: User): LabAiContextResult {
  if (!canViewLabEquipment(user.role)) return { ok: false, status: 403, error: 'You are not authorized to use AI assistance for laboratory equipment.' };
  const detail = getLabEquipmentDetail(equipmentId);
  if (!detail) return { ok: false, status: 404, error: 'Equipment not found.' };
  const maintenance = listLabEquipmentMaintenance(equipmentId);
  return { ok: true, context: {
    equipment: { id: detail.equipment.id, code: detail.equipment.code, name: detail.equipment.name, serial_number: detail.equipment.serial_number, location: detail.equipment.location, status_raw: detail.equipment.status_raw, is_archived: detail.equipment.is_archived, test_count: detail.test_count },
    timeline_tail: getLabEquipmentTimeline(equipmentId).slice(0, 30),
    maintenance_tail: maintenance.slice(0, 15).map((m) => ({ maintenance_date: m.maintenance_date, maintenance_type: m.maintenance_type, status: m.status, completed_date: m.completed_date, notes: m.notes })),
    calibration_summary: getLabCalibrationSummary(equipmentId),
  } };
}

/** Summarize SOP/WI change history for one document. */
export function labDocumentChangesContext(documentId: number, user: User): LabAiContextResult {
  if (!canViewLabDocuments(user.role)) return { ok: false, status: 403, error: 'You are not authorized to use AI assistance for controlled documents.' };
  const view = getLabDocumentVersions(documentId);
  if (!view) return { ok: false, status: 404, error: 'Document not found.' };
  return { ok: true, context: {
    document: { id: view.document.id, code: view.document.code, title: view.document.title, type: view.document.type, status: view.document.status, current_version_id: view.document.current_version_id, effective_date: view.document.effective_date, review_due_date: view.document.review_due_date },
    versions: view.versions.map((v) => ({ version: v.version, status: v.status, change_summary: v.change_summary, author_name: v.author_name, reviewer_name: v.reviewer_name, approver_name: v.approver_name, approved_at: v.approved_at, created_at: v.created_at })),
  } };
}

/** Summarize historical FAIL patterns — supervisor+ (reports scope). */
export function labFailPatternsContext(user: User): LabAiContextResult {
  if (!canViewLabReports(user.role)) return { ok: false, status: 403, error: 'AI FAIL-pattern summaries are only available to supervisors and above.' };
  const rows = getDb()
    .prepare(
      `SELECT t.test_number, t.test_type, t.final_result, t.status, t.submitted_at, t.approved_at, t.rejected_reason, t.created_at,
              p.code AS product_code, p.name AS product_name,
              e.code AS equipment_code, e.name AS equipment_name
       FROM lab_test_records t
       LEFT JOIN lab_products p ON p.id = t.product_id
       LEFT JOIN lab_equipment e ON e.id = t.equipment_id
       WHERE t.final_result = 'FAIL' AND t.status <> 'VOID'
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT 200`,
    )
    .all() as Record<string, unknown>[];
  return { ok: true, context: { scope: 'historical FAIL results (excludes VOID)', fail_tests: rows, total: rows.length } };
}

/** Summarize repeated retests — any role that can view lab retests. */
export function labRetestPatternsContext(user: User): LabAiContextResult {
  if (!canViewLabRetests(user.role)) return { ok: false, status: 403, error: 'You are not authorized to use AI assistance for laboratory retests.' };
  const result = searchLabRetests({ ...NO_LAB_RETEST_FILTERS, per_page: 200, page: 1 });
  return { ok: true, context: { scope: 'retest register', retests: result.rows, total: result.total } };
}

/** Summarize data-quality issues — data-quality scope (supervisor+). */
export function labDataQualitySummaryContext(user: User): LabAiContextResult {
  if (!canViewLabDataQuality(user.role)) return { ok: false, status: 403, error: 'AI data-quality summaries are only available to supervisors and above.' };
  const report = runLabDataQualityChecks();
  return { ok: true, context: {
    totals: { total: report.total, tests: report.tests.length, equipment: report.equipment.length, documents: report.documents.length, products: report.products.length },
    tests: report.tests, equipment: report.equipment, documents: report.documents, products: report.products,
  } };
}
