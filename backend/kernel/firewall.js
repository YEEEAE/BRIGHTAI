'use strict';

const { piiPatterns, sensitiveKeywords } = require('./pii-patterns');

function maskValue(value, detector) {
  const preserve = detector.maskPreserve || 0;
  if (preserve >= value.length) return value;
  const visibleEnd = value.slice(-preserve);
  const masked = detector.maskChar.repeat(value.length - preserve);
  return masked + visibleEnd;
}

async function lookupPolicy(piiType, compliancePack) {
  try {
    const { getDb } = require('../db/init');
    const pool = getDb();
    const { rows } = await pool.query(
      'SELECT action, risk_score_modifier FROM kernel_policy_rules WHERE pii_type = $1 AND compliance_pack = $2 AND is_active = 1',
      [piiType, compliancePack]
    );
    if (rows.length > 0) return { action: rows[0].action, riskModifier: rows[0].risk_score_modifier };
    const { rows: generalRows } = await pool.query(
      'SELECT action, risk_score_modifier FROM kernel_policy_rules WHERE pii_type = $1 AND compliance_pack = \'general\' AND is_active = 1',
      [piiType]
    );
    if (generalRows.length > 0) return { action: generalRows[0].action, riskModifier: generalRows[0].risk_score_modifier };
  } catch (_) { }
  const pattern = piiPatterns.find(p => p.type === piiType);
  return { action: 'mask', riskModifier: pattern ? pattern.riskModifier : 10 };
}

function classifySensitiveData(text) {
  const lower = text.toLowerCase();
  const categories = [];
  for (const [category, keywords] of Object.entries(sensitiveKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        if (!categories.includes(category)) categories.push(category);
        break;
      }
    }
  }
  return categories;
}

async function scan(text, compliancePack) {
  compliancePack = compliancePack || 'general';
  const piiItems = [];
  const piiTypes = [];
  let maxAction = 'allow';
  let totalRiskModifier = 0;
  let maskedText = text;

  for (const detector of piiPatterns) {
    const regex = new RegExp(detector.pattern.source, detector.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      if (!piiTypes.includes(detector.type)) piiTypes.push(detector.type);

      const policy = await lookupPolicy(detector.type, compliancePack);
      totalRiskModifier += policy.riskModifier;

      const action = policy.action;
      if (action === 'block') maxAction = 'block';
      else if (action === 'escalate' && maxAction !== 'block') maxAction = 'escalate';
      else if (action === 'mask' && maxAction === 'allow') maxAction = 'mask';

      const masked = action === 'mask' ? maskValue(original, detector) : original;

      piiItems.push({
        type: detector.type,
        original,
        masked,
        position: match.index,
        action
      });

      if (action === 'mask') {
        maskedText = maskedText.replace(original, masked);
      }
      if (action === 'block') break;
    }
    if (maxAction === 'block') break;
  }

  const sensitiveCategories = classifySensitiveData(text);

  return {
    piiDetected: piiTypes.length > 0,
    piiTypes,
    piiItems,
    sensitiveCategories,
    firewallAction: maxAction,
    maskedText: maxAction === 'mask' ? maskedText : text,
    totalRiskModifier
  };
}

module.exports = { scan, maskValue, lookupPolicy };
