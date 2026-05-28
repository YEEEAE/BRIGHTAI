'use strict';

const crypto = require('crypto');
const { getDb, generateId } = require('../db/init');

function computeHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

async function logInteraction(interaction) {
  const pool = getDb();

  if (!interaction.id) interaction.id = generateId('ki');
  if (!interaction.created_at) interaction.created_at = Date.now();

  interaction.request_hash = computeHash(interaction.request_message || '');
  interaction.response_hash = computeHash(interaction.gemini_response || '');

  const { rows } = await pool.query('SELECT record_hash FROM kernel_interactions ORDER BY created_at DESC LIMIT 1');
  interaction.previous_hash = rows.length > 0 ? rows[0].record_hash : '0';

  const chainData = {
    id: interaction.id,
    created_at: interaction.created_at,
    request_hash: interaction.request_hash,
    response_hash: interaction.response_hash,
    previous_hash: interaction.previous_hash
  };
  interaction.record_hash = computeHash(chainData);

  await pool.query(`
    INSERT INTO kernel_interactions (
      id, created_at, user_id, user_name, ip_address, user_agent,
      request_message, request_hash, request_metadata,
      pii_detected, pii_types, pii_items, sensitive_data_categories,
      firewall_action, masked_message,
      risk_score, risk_level, risk_reasons,
      approval_status, approved_by, approved_at, approval_comment,
      gemini_response, response_hash, response_model,
      response_tokens_input, response_tokens_output, response_time_ms, response_error,
      compliance_pack, compliance_flags,
      previous_hash, record_hash
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9,
      $10, $11, $12, $13,
      $14, $15,
      $16, $17, $18,
      $19, $20, $21, $22,
      $23, $24, $25,
      $26, $27, $28, $29,
      $30, $31,
      $32, $33
    )
  `, [
    interaction.id, interaction.created_at, interaction.user_id || null, interaction.user_name || null, interaction.ip_address || null, interaction.user_agent || null,
    interaction.request_message, interaction.request_hash, interaction.request_metadata || null,
    interaction.pii_detected || 0, interaction.pii_types || null, interaction.pii_items || null, interaction.sensitive_data_categories || null,
    interaction.firewall_action || 'allow', interaction.masked_message || null,
    interaction.risk_score || 0, interaction.risk_level || 'low', interaction.risk_reasons || null,
    interaction.approval_status || 'auto_approved', interaction.approved_by || null, interaction.approved_at || null, interaction.approval_comment || null,
    interaction.gemini_response || null, interaction.response_hash, interaction.response_model || null,
    interaction.response_tokens_input || 0, interaction.response_tokens_output || 0, interaction.response_time_ms || 0, interaction.response_error || null,
    interaction.compliance_pack || null, interaction.compliance_flags || null,
    interaction.previous_hash, interaction.record_hash
  ]);

  return interaction;
}

async function queryAuditTrail(filters, limit, offset) {
  limit = limit || 50;
  offset = offset || 0;
  const pool = getDb();

  const conditions = [];
  const values = [];
  let paramIdx = 1;

  if (filters.userId) { conditions.push(`user_id = $${paramIdx++}`); values.push(filters.userId); }
  if (filters.riskLevel) { conditions.push(`risk_level = $${paramIdx++}`); values.push(filters.riskLevel); }
  if (filters.compliancePack) { conditions.push(`compliance_pack = $${paramIdx++}`); values.push(filters.compliancePack); }
  if (filters.approvalStatus) { conditions.push(`approval_status = $${paramIdx++}`); values.push(filters.approvalStatus); }
  if (filters.dateFrom) { conditions.push(`created_at >= $${paramIdx++}`); values.push(filters.dateFrom); }
  if (filters.dateTo) { conditions.push(`created_at <= $${paramIdx++}`); values.push(filters.dateTo); }
  if (filters.search) {
    conditions.push(`(request_message ILIKE $${paramIdx} OR gemini_response ILIKE $${paramIdx})`);
    values.push('%' + filters.search + '%');
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const rowsResult = await pool.query(
    `SELECT * FROM kernel_interactions ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...values, limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM kernel_interactions ${whereClause}`,
    values
  );

  return { rows: rowsResult.rows, total: parseInt(countResult.rows[0].total) };
}

async function getAuditEntry(id) {
  const pool = getDb();
  const { rows } = await pool.query('SELECT * FROM kernel_interactions WHERE id = $1', [id]);
  return rows[0] || null;
}

async function verifyChainIntegrity() {
  const pool = getDb();
  const { rows } = await pool.query('SELECT id, record_hash, previous_hash FROM kernel_interactions ORDER BY created_at ASC');

  if (rows.length === 0) return { valid: true, brokenAt: null, totalRecords: 0 };

  let prevHash = '0';
  for (const row of rows) {
    if (row.previous_hash !== prevHash) {
      return { valid: false, brokenAt: row.id, totalRecords: rows.length };
    }
    prevHash = row.record_hash;
  }

  return { valid: true, brokenAt: null, totalRecords: rows.length };
}

async function updateInteraction(id, updates) {
  const pool = getDb();
  const fields = [];
  const values = [id];
  let paramIdx = 2;
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${paramIdx++}`);
    values.push(value);
  }
  if (fields.length === 0) return;
  await pool.query(`UPDATE kernel_interactions SET ${fields.join(', ')} WHERE id = $1`, values);
}

module.exports = { logInteraction, queryAuditTrail, getAuditEntry, verifyChainIntegrity, updateInteraction, computeHash };
