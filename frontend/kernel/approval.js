'use strict';

const { getDb, generateId } = require('../db/init');
const { updateInteraction } = require('./audit');

function getRequiredRole(riskLevel) {
  if (riskLevel === 'critical') return 'admin';
  if (riskLevel === 'high') return 'admin';
  return 'manager';
}

async function queueForApproval(interactionId, riskScore, riskLevel) {
  const pool = getDb();
  const id = generateId('aq');
  const now = Date.now();
  const expiresAt = now + (24 * 60 * 60 * 1000);

  await pool.query(`
    INSERT INTO kernel_approval_queue (id, interaction_id, risk_score, risk_level, created_at, status, assigned_to, expires_at)
    VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
  `, [id, interactionId, riskScore, riskLevel, now, getRequiredRole(riskLevel), expiresAt]);

  return { id, interactionId, status: 'pending', assignedTo: getRequiredRole(riskLevel) };
}

async function approve(interactionId, approvedBy, comment) {
  const pool = getDb();
  const now = Date.now();

  const { rows } = await pool.query('SELECT * FROM kernel_approval_queue WHERE interaction_id = $1 AND status = \'pending\'', [interactionId]);
  if (rows.length === 0) throw new Error('No pending approval found for this interaction');

  await pool.query(
    'UPDATE kernel_approval_queue SET status = \'approved\', approved_by = $1, approved_at = $2, approval_comment = $3 WHERE interaction_id = $4',
    [approvedBy, now, comment || '', interactionId]
  );

  await updateInteraction(interactionId, {
    approval_status: 'approved',
    approved_by: approvedBy,
    approved_at: now,
    approval_comment: comment || ''
  });

  return { interactionId, status: 'approved', approvedBy, approvedAt: now };
}

async function reject(interactionId, rejectedBy, comment) {
  const pool = getDb();
  const now = Date.now();

  const { rows } = await pool.query('SELECT * FROM kernel_approval_queue WHERE interaction_id = $1 AND status = \'pending\'', [interactionId]);
  if (rows.length === 0) throw new Error('No pending approval found for this interaction');

  await pool.query(
    'UPDATE kernel_approval_queue SET status = \'rejected\', approved_by = $1, approved_at = $2, approval_comment = $3 WHERE interaction_id = $4',
    [rejectedBy, now, comment || 'Rejected', interactionId]
  );

  await updateInteraction(interactionId, {
    approval_status: 'rejected',
    approved_by: rejectedBy,
    approved_at: now,
    approval_comment: comment || 'Rejected'
  });

  return { interactionId, status: 'rejected', rejectedBy, rejectedAt: now };
}

async function getPendingApprovals(role, limit, offset) {
  limit = limit || 50;
  offset = offset || 0;
  const pool = getDb();

  const { rows } = await pool.query(`
    SELECT aq.*, ki.request_message, ki.masked_message, ki.user_name, ki.compliance_pack, ki.risk_reasons
    FROM kernel_approval_queue aq
    JOIN kernel_interactions ki ON aq.interaction_id = ki.id
    WHERE aq.status = 'pending'
    ORDER BY aq.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  return rows;
}

module.exports = { queueForApproval, approve, reject, getPendingApprovals, getRequiredRole };
