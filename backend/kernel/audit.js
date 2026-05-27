'use strict';

const crypto = require('crypto');
const { getDb, generateId } = require('../db/init');

function computeHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function logInteraction(interaction) {
  const db = getDb();

  if (!interaction.id) interaction.id = generateId('ki');
  if (!interaction.created_at) interaction.created_at = Date.now();

  interaction.request_hash = computeHash(interaction.request_message || '');
  interaction.response_hash = computeHash(interaction.gemini_response || '');

  const lastRow = db.prepare('SELECT record_hash FROM kernel_interactions ORDER BY created_at DESC LIMIT 1').get();
  interaction.previous_hash = lastRow ? lastRow.record_hash : '0';

  const chainData = {
    id: interaction.id,
    created_at: interaction.created_at,
    request_hash: interaction.request_hash,
    response_hash: interaction.response_hash,
    previous_hash: interaction.previous_hash
  };
  interaction.record_hash = computeHash(chainData);

  db.prepare(`
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
      @id, @created_at, @user_id, @user_name, @ip_address, @user_agent,
      @request_message, @request_hash, @request_metadata,
      @pii_detected, @pii_types, @pii_items, @sensitive_data_categories,
      @firewall_action, @masked_message,
      @risk_score, @risk_level, @risk_reasons,
      @approval_status, @approved_by, @approved_at, @approval_comment,
      @gemini_response, @response_hash, @response_model,
      @response_tokens_input, @response_tokens_output, @response_time_ms, @response_error,
      @compliance_pack, @compliance_flags,
      @previous_hash, @record_hash
    )
  `).run(interaction);

  return interaction;
}

function queryAuditTrail(filters, limit, offset) {
  limit = limit || 50;
  offset = offset || 0;
  const db = getDb();

  let where = [];
  let params = {};

  if (filters.userId) { where.push('user_id = @userId'); params.userId = filters.userId; }
  if (filters.riskLevel) { where.push('risk_level = @riskLevel'); params.riskLevel = filters.riskLevel; }
  if (filters.compliancePack) { where.push('compliance_pack = @compliancePack'); params.compliancePack = filters.compliancePack; }
  if (filters.approvalStatus) { where.push('approval_status = @approvalStatus'); params.approvalStatus = filters.approvalStatus; }
  if (filters.dateFrom) { where.push('created_at >= @dateFrom'); params.dateFrom = filters.dateFrom; }
  if (filters.dateTo) { where.push('created_at <= @dateTo'); params.dateTo = filters.dateTo; }
  if (filters.search) {
    where.push('(request_message LIKE @search OR gemini_response LIKE @search)');
    params.search = '%' + filters.search + '%';
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const rows = db.prepare(
    `SELECT * FROM kernel_interactions ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
  ).all(params);

  const countResult = db.prepare(`SELECT COUNT(*) as total FROM kernel_interactions ${whereClause}`).get(params);

  return { rows, total: countResult.total };
}

function getAuditEntry(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM kernel_interactions WHERE id = ?').get(id);
}

function verifyChainIntegrity() {
  const db = getDb();
  const rows = db.prepare('SELECT id, record_hash, previous_hash FROM kernel_interactions ORDER BY created_at ASC').all();

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

function updateInteraction(id, updates) {
  const db = getDb();
  const fields = [];
  const params = { id };
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = @${key}`);
    params[key] = value;
  }
  if (fields.length === 0) return;
  db.prepare(`UPDATE kernel_interactions SET ${fields.join(', ')} WHERE id = @id`).run(params);
}

module.exports = { logInteraction, queryAuditTrail, getAuditEntry, verifyChainIntegrity, updateInteraction, computeHash };
