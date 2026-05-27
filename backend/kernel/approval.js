'use strict';

const { getDb, generateId } = require('../db/init');
const { updateInteraction } = require('./audit');

function getRequiredRole(riskLevel) {
  if (riskLevel === 'critical') return 'admin';
  if (riskLevel === 'high') return 'admin';
  return 'manager';
}

function queueForApproval(interactionId, riskScore, riskLevel) {
  const db = getDb();
  const id = generateId('aq');
  const now = Date.now();
  const expiresAt = now + (24 * 60 * 60 * 1000);

  db.prepare(`
    INSERT INTO kernel_approval_queue (id, interaction_id, risk_score, risk_level, created_at, status, assigned_to, expires_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, interactionId, riskScore, riskLevel, now, getRequiredRole(riskLevel), expiresAt);

  return { id, interactionId, status: 'pending', assignedTo: getRequiredRole(riskLevel) };
}

function approve(interactionId, approvedBy, comment) {
  const db = getDb();
  const now = Date.now();

  const queueEntry = db.prepare('SELECT * FROM kernel_approval_queue WHERE interaction_id = ? AND status = \'pending\'').get(interactionId);
  if (!queueEntry) throw new Error('No pending approval found for this interaction');

  db.prepare('UPDATE kernel_approval_queue SET status = \'approved\', approved_by = ?, approved_at = ?, approval_comment = ? WHERE interaction_id = ?')
    .run(approvedBy, now, comment || '', interactionId);

  updateInteraction(interactionId, {
    approval_status: 'approved',
    approved_by: approvedBy,
    approved_at: now,
    approval_comment: comment || ''
  });

  return { interactionId, status: 'approved', approvedBy, approvedAt: now };
}

function reject(interactionId, rejectedBy, comment) {
  const db = getDb();
  const now = Date.now();

  const queueEntry = db.prepare('SELECT * FROM kernel_approval_queue WHERE interaction_id = ? AND status = \'pending\'').get(interactionId);
  if (!queueEntry) throw new Error('No pending approval found for this interaction');

  db.prepare('UPDATE kernel_approval_queue SET status = \'rejected\', approved_by = ?, approved_at = ?, approval_comment = ? WHERE interaction_id = ?')
    .run(rejectedBy, now, comment || 'Rejected', interactionId);

  updateInteraction(interactionId, {
    approval_status: 'rejected',
    approved_by: rejectedBy,
    approved_at: now,
    approval_comment: comment || 'Rejected'
  });

  return { interactionId, status: 'rejected', rejectedBy, rejectedAt: now };
}

function getPendingApprovals(role, limit, offset) {
  limit = limit || 50;
  offset = offset || 0;
  const db = getDb();

  const rows = db.prepare(`
    SELECT aq.*, ki.request_message, ki.masked_message, ki.user_name, ki.compliance_pack, ki.risk_reasons
    FROM kernel_approval_queue aq
    JOIN kernel_interactions ki ON aq.interaction_id = ki.id
    WHERE aq.status = 'pending'
    ORDER BY aq.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  return rows;
}

module.exports = { queueForApproval, approve, reject, getPendingApprovals, getRequiredRole };
