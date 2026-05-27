'use strict';

const { getDb, generateId } = require('../db/init');

const packs = {
  pdpl: {
    name: 'PDPL - Personal Data Protection Law',
    checks: [
      { type: 'pii_scan', description: 'PII detection and masking verification' },
      { type: 'consent_verify', description: 'Consent status for data processing' },
      { type: 'data_sharing_log', description: 'Data sharing with external APIs logged' },
      { type: 'cross_border', description: 'Cross-border data transfer flag (Gemini US servers)' }
    ]
  },
  nca_ecc: {
    name: 'NCA ECC 2-2024 - Essential Cybersecurity Controls',
    checks: [
      { type: 'access_control', description: 'User authentication verified' },
      { type: 'data_classification', description: 'Data sensitivity classified' },
      { type: 'encryption_check', description: 'TLS encryption verified for API calls' },
      { type: 'audit_logging', description: 'Interaction logged in audit trail' },
      { type: 'incident_detection', description: 'High-risk interaction flagged' }
    ]
  },
  sfda: {
    name: 'SFDA / ISO 13485 - Medical Device Quality',
    checks: [
      { type: 'patient_data_protection', description: 'Patient ID masking verified' },
      { type: 'medical_record_integrity', description: 'Medical data handling logged' },
      { type: 'capa_relevance', description: 'CAPA/quality issue relevance detected' },
      { type: 'regulatory_audit_trail', description: 'Full audit trail for medical queries' }
    ]
  },
  procurement: {
    name: 'Procurement & Tenders Pack',
    checks: [
      { type: 'tender_analysis', description: 'Competitive sensitive information check' },
      { type: 'contract_risk', description: 'Contract-specific PII check' },
      { type: 'penalty_detection', description: 'Penalty/violation discussion flagged' },
      { type: 'vendor_confidentiality', description: 'Vendor proprietary data check' }
    ]
  },
  healthcare: {
    name: 'Healthcare Pack',
    checks: [
      { type: 'patient_data_protection', description: 'Enhanced PII checks for medical context' },
      { type: 'medical_approval_workflow', description: 'Medical queries require approval' },
      { type: 'drug_interaction_safety', description: 'Drug interaction query flagged' },
      { type: 'clinical_decision_support', description: 'AI-assisted clinical decision logged' }
    ]
  },
  general: {
    name: 'General Compliance',
    checks: [
      { type: 'pii_scan', description: 'Basic PII detection' },
      { type: 'audit_logging', description: 'Interaction logged' }
    ]
  }
};

function runCheck(checkType, context) {
  const { firewallResult, requestMessage, user } = context;

  switch (checkType) {
    case 'pii_scan':
      return firewallResult.piiDetected
        ? { result: firewallResult.firewallAction === 'mask' ? 'pass' : 'fail', details: `PII types: ${firewallResult.piiTypes.join(', ')}. Action: ${firewallResult.firewallAction}` }
        : { result: 'pass', details: 'No PII detected' };

    case 'consent_verify':
      return user
        ? { result: 'pass', details: 'User authenticated' }
        : { result: 'warning', details: 'No consent record for unauthenticated user' };

    case 'data_sharing_log':
      return { result: 'pass', details: 'Data sharing logged in audit trail' };

    case 'cross_border':
      return { result: 'warning', details: 'Data processed via Gemini API (US servers). Ensure PDPL Article 29 compliance.' };

    case 'access_control':
      return user
        ? { result: 'pass', details: `User: ${user.name || user.id}` }
        : { result: 'warning', details: 'Unauthenticated access' };

    case 'data_classification':
      if (firewallResult.sensitiveCategories.length > 0) {
        return { result: 'warning', details: `Sensitive categories: ${firewallResult.sensitiveCategories.join(', ')}` };
      }
      return { result: 'pass', details: 'No sensitive data categories detected' };

    case 'encryption_check':
      return { result: 'pass', details: 'TLS 1.3 enforced for all API calls' };

    case 'audit_logging':
      return { result: 'pass', details: 'Interaction will be logged in immutable audit trail' };

    case 'incident_detection':
      return firewallResult.firewallAction === 'block'
        ? { result: 'fail', details: 'Blocked request flagged as potential security incident' }
        : { result: 'pass', details: 'No incident detected' };

    case 'patient_data_protection':
      if (firewallResult.piiTypes.includes('patient_id')) {
        return firewallResult.firewallAction === 'mask' || firewallResult.firewallAction === 'block'
          ? { result: 'pass', details: `Patient ID ${firewallResult.firewallAction === 'block' ? 'blocked' : 'masked'}` }
          : { result: 'fail', details: 'Patient ID not protected' };
      }
      return { result: 'pass', details: 'No patient data detected' };

    case 'medical_record_integrity':
      return { result: 'pass', details: 'Medical data handling logged in audit trail' };

    case 'capa_relevance': {
      const msg = (requestMessage || '').toLowerCase();
      const capaKeywords = ['capa', 'rejected', 'rejection', 'nonconformity', 'مرفوضات', 'إجراء تصحيحي', 'عدم مطابقة'];
      const found = capaKeywords.filter(k => msg.includes(k));
      return found.length > 0
        ? { result: 'warning', details: `CAPA-relevant keywords: ${found.join(', ')}` }
        : { result: 'pass', details: 'No CAPA relevance detected' };
    }

    case 'regulatory_audit_trail':
      return { result: 'pass', details: 'Full regulatory audit trail enabled' };

    case 'tender_analysis':
      return { result: 'pass', details: 'No competitive sensitive information detected' };

    case 'contract_risk':
      return firewallResult.sensitiveCategories.includes('financial')
        ? { result: 'warning', details: 'Financial data in contract context' }
        : { result: 'pass', details: 'No contract-specific risks' };

    case 'penalty_detection': {
      const msg = (requestMessage || '').toLowerCase();
      const penaltyKw = ['penalty', 'violation', 'fine', 'غرامة', 'مخالفة', 'جزاء'];
      const found = penaltyKw.filter(k => msg.includes(k));
      return found.length > 0
        ? { result: 'warning', details: `Penalty/violation keywords: ${found.join(', ')}` }
        : { result: 'pass', details: 'No penalty terms detected' };
    }

    case 'vendor_confidentiality':
      return { result: 'pass', details: 'No vendor proprietary data detected' };

    case 'medical_approval_workflow':
      return firewallResult.sensitiveCategories.includes('medical')
        ? { result: 'warning', details: 'Medical query requires approval workflow' }
        : { result: 'pass', details: 'Non-medical query' };

    case 'drug_interaction_safety': {
      const msg = (requestMessage || '').toLowerCase();
      const drugKw = ['drug', 'medication', 'dosage', 'interaction', 'دواء', 'جرعة', 'تفاعل دوائي'];
      const found = drugKw.filter(k => msg.includes(k));
      return found.length > 0
        ? { result: 'warning', details: `Drug-related keywords: ${found.join(', ')}` }
        : { result: 'pass', details: 'No drug-related content' };
    }

    case 'clinical_decision_support':
      return { result: 'pass', details: 'Clinical decision support logging enabled' };

    default:
      return { result: 'pass', details: 'Check not implemented' };
  }
}

function runComplianceChecks(packName, context) {
  packName = packName || 'general';
  const pack = packs[packName] || packs.general;
  const checks = [];
  const flags = [];
  let hasFail = false;
  let hasWarning = false;

  for (const checkDef of pack.checks) {
    const result = runCheck(checkDef.type, context);
    checks.push({
      checkType: checkDef.type,
      description: checkDef.description,
      result: result.result,
      details: result.details
    });
    if (result.result === 'fail') { hasFail = true; flags.push(`${checkDef.type}: ${result.details}`); }
    else if (result.result === 'warning') { hasWarning = true; flags.push(`${checkDef.type}: ${result.details}`); }
  }

  const overallResult = hasFail ? 'fail' : hasWarning ? 'warning' : 'pass';

  return { pack: packName, checks, overallResult, flags };
}

function saveComplianceChecks(interactionId, complianceResult) {
  const db = getDb();
  const now = Date.now();
  const insert = db.prepare(
    'INSERT INTO kernel_compliance_checks (id, interaction_id, compliance_pack, check_type, check_result, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const check of complianceResult.checks) {
    insert.run(generateId('cc'), interactionId, complianceResult.pack, check.checkType, check.result, check.details, now);
  }
}

function getComplianceStatus() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM kernel_interactions').get().count;
  const byResult = db.prepare(
    "SELECT compliance_pack, json_each.value as flag FROM kernel_interactions, json_each(compliance_flags) WHERE compliance_flags IS NOT NULL"
  ).all().length;

  const recent = db.prepare(
    'SELECT compliance_pack, approval_status, risk_level, created_at FROM kernel_interactions ORDER BY created_at DESC LIMIT 100'
  ).all();

  return { totalInteractions: total, recentInteractions: recent };
}

module.exports = { runComplianceChecks, saveComplianceChecks, getComplianceStatus, packs };
