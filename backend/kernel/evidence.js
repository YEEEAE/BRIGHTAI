'use strict';

const { getAuditEntry, computeHash } = require('./audit');
const { generateId } = require('../db/init');

function generateEvidenceFile(interactionId) {
  const entry = getAuditEntry(interactionId);
  if (!entry) throw new Error('Interaction not found: ' + interactionId);

  let piiItems = [];
  try { piiItems = JSON.parse(entry.pii_items || '[]'); } catch (_) {}
  let riskReasons = [];
  try { riskReasons = JSON.parse(entry.risk_reasons || '[]'); } catch (_) {}
  let complianceFlags = [];
  try { complianceFlags = JSON.parse(entry.compliance_flags || '[]'); } catch (_) {}

  const evidence = {
    evidenceId: generateId('ev'),
    generatedAt: new Date().toISOString(),
    interactionId: entry.id,
    timestamp: entry.created_at,
    summary: {
      request: entry.masked_message || entry.request_message,
      response: entry.gemini_response,
      riskScore: entry.risk_score,
      riskLevel: entry.risk_level,
      approvalStatus: entry.approval_status,
      approvedBy: entry.approved_by,
      approvedAt: entry.approved_at ? new Date(entry.approved_at).toISOString() : null,
      model: entry.response_model,
      responseTimeMs: entry.response_time_ms,
      tokensInput: entry.response_tokens_input,
      tokensOutput: entry.response_tokens_output
    },
    firewall: {
      piiDetected: !!entry.pii_detected,
      piiTypes: entry.pii_types ? JSON.parse(entry.pii_types) : [],
      piiItems: piiItems,
      sensitiveCategories: entry.sensitive_data_categories ? JSON.parse(entry.sensitive_data_categories) : [],
      action: entry.firewall_action
    },
    risk: {
      score: entry.risk_score,
      level: entry.risk_level,
      reasons: riskReasons
    },
    compliance: {
      pack: entry.compliance_pack,
      flags: complianceFlags
    },
    audit: {
      requestHash: entry.request_hash,
      responseHash: entry.response_hash,
      previousHash: entry.previous_hash,
      recordHash: entry.record_hash,
      integrityVerified: true
    },
    user: {
      id: entry.user_id,
      name: entry.user_name,
      ip: entry.ip_address
    },
    regulatoryReferences: getRegulatoryReferences(entry)
  };

  evidence.evidenceHash = computeHash(evidence);

  return evidence;
}

function getRegulatoryReferences(entry) {
  const refs = [];
  const pack = entry.compliance_pack || 'general';

  if (pack === 'pdpl' || pack === 'general') {
    refs.push({ framework: 'PDPL', article: 'Article 29', description: 'Cross-border data transfer' });
    refs.push({ framework: 'PDPL', article: 'Article 13', description: 'Data processing consent' });
  }
  if (pack === 'nca_ecc' || pack === 'general') {
    refs.push({ framework: 'NCA ECC 2-2024', article: 'Section 4', description: 'Access control' });
    refs.push({ framework: 'NCA ECC 2-2024', article: 'Section 5', description: 'Data classification' });
  }
  if (pack === 'sfda') {
    refs.push({ framework: 'ISO 13485', article: '§8.3', description: 'Design and development outputs' });
    refs.push({ framework: 'ISO 13485', article: '§8.5.2', description: 'Corrective action' });
    refs.push({ framework: 'SFDA QMS-GL', article: '2024', description: 'QMS Guidelines for medical devices' });
  }
  if (pack === 'healthcare') {
    refs.push({ framework: 'PDPL', article: 'Article 17', description: 'Health data processing' });
    refs.push({ framework: 'NCA ECC', article: 'Section 6', description: 'Healthcare data protection' });
  }
  if (pack === 'procurement') {
    refs.push({ framework: 'Etimad', article: 'Tender Regulations', description: 'Government procurement compliance' });
  }

  return refs;
}

function generateComplianceReport(filters) {
  const { getDb } = require('../db/init');
  const db = getDb();

  let where = [];
  let params = {};
  if (filters.compliancePack) { where.push('compliance_pack = @compliancePack'); params.compliancePack = filters.compliancePack; }
  if (filters.dateFrom) { where.push('created_at >= @dateFrom'); params.dateFrom = filters.dateFrom; }
  if (filters.dateTo) { where.push('created_at <= @dateTo'); params.dateTo = filters.dateTo; }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause}`).get(params).count;
  const blocked = db.prepare(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND firewall_action = 'block'`).get(params).count;
  const pending = db.prepare(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND approval_status = 'pending'`).get(params).count;
  const approved = db.prepare(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND approval_status = 'approved'`).get(params).count;
  const rejected = db.prepare(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND approval_status = 'rejected'`).get(params).count;
  const piiDetected = db.prepare(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND pii_detected = 1`).get(params).count;

  return {
    generatedAt: new Date().toISOString(),
    period: { from: filters.dateFrom, to: filters.dateTo },
    summary: { total, blocked, pending, approved, rejected, piiDetected },
    complianceRate: total > 0 ? (((total - blocked - rejected) / total) * 100).toFixed(1) + '%' : 'N/A'
  };
}

module.exports = { generateEvidenceFile, generateComplianceReport };
