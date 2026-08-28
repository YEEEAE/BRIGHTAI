// Read-only Manager/Admin Laboratory management dashboard queries.
//
// This module is deliberately separate from the employee/supervisor command
// center and from the global dashboard charts. It returns operational queues
// and risk counts backed by the existing lab_* tables only.
import { getDb } from '../db';
import { localToday } from '../dashboard';
import { verifyAllAuditChains, type AllAuditChainsVerification } from '../audit/qcChain';
import { countLabDataQualityIssues, LATEST_DUE_SQL, CALIBRATION_DUE_SOON_DAYS } from './overview';

// Kept as a convenience export for management-focused consumers/tests; the
// implementation remains in the command-center overview authority.
export { getLabRoleActionSummary } from './overview';

export interface LabManagementDashboard {
  attention: {
    approvalQueue: number;
    pendingChangeRequests: number;
    waitingOver24h: number;
    rejectedChanges: number;
  };
  risk: {
    overdueCalibration: number;
    dueSoonCalibration: number;
    equipmentAttention: number;
    documentsInReview: number;
    documentsOverdue: number;
    pendingAcknowledgements: number;
    wiTotal: number;
    wiWithContent: number;
  };
  quality: {
    failTests: number;
    holdTests: number;
    openRetests: number;
    completedRetests: number;
    dataQualityIssues: number;
    failHoldTrend: Array<{ week: string; fail: number; hold: number }>;
  };
  assurance: {
    recentAuditEvents: number;
    audit: AllAuditChainsVerification;
  };
}

const n = (row: { n?: number | null } | undefined): number => Number(row?.n ?? 0);

function count(db: ReturnType<typeof getDb>, sql: string, ...params: unknown[]): number {
  return n(db.prepare(sql).get(...params) as { n?: number | null });
}

function failHoldTrend(db: ReturnType<typeof getDb>): Array<{ week: string; fail: number; hold: number }> {
  const points: Array<{ week: string; fail: number; hold: number }> = [];
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  for (let index = 7; index >= 0; index -= 1) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - index * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const week = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const row = db.prepare(`
      SELECT
        SUM(CASE WHEN final_result = 'FAIL' THEN 1 ELSE 0 END) AS fail,
        SUM(CASE WHEN final_result = 'HOLD' THEN 1 ELSE 0 END) AS hold
      FROM lab_test_records
      WHERE status <> 'VOID'
        AND final_result IN ('FAIL', 'HOLD')
        AND datetime(created_at) >= datetime(?)
        AND datetime(created_at) < datetime(?)
    `).get(`${week} 00:00:00`, `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} 00:00:00`) as { fail?: number | null; hold?: number | null };
    points.push({ week, fail: Number(row.fail ?? 0), hold: Number(row.hold ?? 0) });
  }
  return points;
}

export function getLabManagementDashboard(): LabManagementDashboard {
  const db = getDb();
  const today = localToday();
  const soon = new Date();
  soon.setDate(soon.getDate() + CALIBRATION_DUE_SOON_DAYS);
  const soonIso = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, '0')}-${String(soon.getDate()).padStart(2, '0')}`;

  const approvalQueue = count(db, "SELECT COUNT(*) AS n FROM lab_test_records WHERE status = 'UNDER_REVIEW'");
  const pendingChangeRequests = count(db, "SELECT COUNT(*) AS n FROM lab_change_requests WHERE status = 'PENDING'");
  const waitingOver24h = count(db, "SELECT COUNT(*) AS n FROM lab_change_requests WHERE status = 'PENDING' AND created_at < datetime('now', '-1 day')");
  const rejectedChanges = count(db, "SELECT COUNT(*) AS n FROM lab_change_requests WHERE status = 'REJECTED'");

  const overdueCalibration = count(db, `SELECT COUNT(*) AS n FROM lab_equipment e WHERE e.is_archived = 0 AND ${LATEST_DUE_SQL} IS NOT NULL AND ${LATEST_DUE_SQL} < date(?)`, today);
  const dueSoonCalibration = count(db, `SELECT COUNT(*) AS n FROM lab_equipment e WHERE e.is_archived = 0 AND ${LATEST_DUE_SQL} IS NOT NULL AND ${LATEST_DUE_SQL} >= date(?) AND ${LATEST_DUE_SQL} <= date(?)`, today, soonIso);
  const equipmentAttention = count(db, `SELECT COUNT(*) AS n FROM lab_equipment e WHERE e.is_archived = 0 AND (
    EXISTS (SELECT 1 FROM lab_equipment_maintenance m WHERE m.equipment_id = e.id AND m.completed_date IS NULL)
    OR (${LATEST_DUE_SQL} IS NOT NULL AND ${LATEST_DUE_SQL} < date(?))
  )`, today);
  const documentsInReview = count(db, "SELECT COUNT(*) AS n FROM lab_documents WHERE status = 'IN_REVIEW'");
  const documentsOverdue = count(db, "SELECT COUNT(*) AS n FROM lab_documents WHERE status NOT IN ('SUPERSEDED', 'ARCHIVED') AND review_due_date IS NOT NULL AND date(review_due_date) < date(?)", today);
  const pendingAcknowledgements = count(db, "SELECT COUNT(*) AS n FROM lab_document_acknowledgements WHERE status = 'PENDING'");
  const wiTotal = count(db, "SELECT COUNT(*) AS n FROM lab_documents WHERE type = 'WI'");
  const wiWithContent = count(db, "SELECT COUNT(*) AS n FROM lab_documents WHERE type = 'WI' AND current_version_id IS NOT NULL");

  const failTests = count(db, "SELECT COUNT(*) AS n FROM lab_test_records WHERE status <> 'VOID' AND final_result = 'FAIL'");
  const holdTests = count(db, "SELECT COUNT(*) AS n FROM lab_test_records WHERE status <> 'VOID' AND final_result = 'HOLD'");
  const openRetests = count(db, "SELECT COUNT(*) AS n FROM lab_test_retests WHERE status = 'OPEN'");
  const completedRetests = count(db, "SELECT COUNT(*) AS n FROM lab_test_retests WHERE status IN ('COMPLETED', 'CLOSED')");
  const recentAuditEvents = count(db, "SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type LIKE 'LAB_%' AND created_at >= datetime('now', '-7 day')");

  return {
    attention: { approvalQueue, pendingChangeRequests, waitingOver24h, rejectedChanges },
    risk: { overdueCalibration, dueSoonCalibration, equipmentAttention, documentsInReview, documentsOverdue, pendingAcknowledgements, wiTotal, wiWithContent },
    quality: { failTests, holdTests, openRetests, completedRetests, dataQualityIssues: countLabDataQualityIssues(), failHoldTrend: failHoldTrend(db) },
    assurance: { recentAuditEvents, audit: verifyAllAuditChains(db) },
  };
}
