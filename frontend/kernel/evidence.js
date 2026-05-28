'use strict';

const { getAuditEntry, computeHash } = require('./audit');
const { generateId } = require('../db/init');

async function generateEvidenceFile(interactionId) {
  const entry = await getAuditEntry(interactionId);
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

async function generateComplianceReport(filters) {
  const { getDb } = require('../db/init');
  const pool = getDb();

  const conditions = [];
  const values = [];
  let paramIdx = 1;

  if (filters.compliancePack) { conditions.push(`compliance_pack = $${paramIdx++}`); values.push(filters.compliancePack); }
  if (filters.dateFrom) { conditions.push(`created_at >= $${paramIdx++}`); values.push(filters.dateFrom); }
  if (filters.dateTo) { conditions.push(`created_at <= $${paramIdx++}`); values.push(filters.dateTo); }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const { rows: [{ count: total }] } = await pool.query(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause}`, values);
  const { rows: [{ count: blocked }] } = await pool.query(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND firewall_action = 'block'`, values);
  const { rows: [{ count: pending }] } = await pool.query(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND approval_status = 'pending'`, values);
  const { rows: [{ count: approved }] } = await pool.query(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND approval_status = 'approved'`, values);
  const { rows: [{ count: rejected }] } = await pool.query(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND approval_status = 'rejected'`, values);
  const { rows: [{ count: piiDetected }] } = await pool.query(`SELECT COUNT(*) as count FROM kernel_interactions ${whereClause} AND pii_detected = 1`, values);

  return {
    generatedAt: new Date().toISOString(),
    period: { from: filters.dateFrom, to: filters.dateTo },
    summary: { total, blocked, pending, approved, rejected, piiDetected },
    complianceRate: total > 0 ? (((total - blocked - rejected) / total) * 100).toFixed(1) + '%' : 'N/A'
  };
}

module.exports = { generateEvidenceFile, generateComplianceReport };
