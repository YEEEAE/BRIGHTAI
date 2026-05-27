'use strict';

function computeRiskScore(params) {
  const { firewallResult, compliancePack, requestMetadata, user } = params;
  let score = 0;
  const reasons = [];

  if (firewallResult.piiDetected) {
    score += 15;
    reasons.push('PII detected in request');
  }

  const piiTypeScores = {
    saudi_id: 15, iban: 20, patient_id: 25, credit_card: 20,
    passport: 15, phone: 5, email: 5, ip_address: 3
  };

  for (const type of firewallResult.piiTypes) {
    const extra = piiTypeScores[type] || 5;
    if (type !== 'phone' && type !== 'email' && type !== 'ip_address') {
      score += extra;
      reasons.push(`${type} detected (+${extra})`);
    }
  }

  if (firewallResult.piiTypes.length > 2) {
    score += 10;
    reasons.push('Multiple PII types detected');
  }

  const catScores = { financial: 10, medical: 10, corporate: 15 };
  for (const cat of firewallResult.sensitiveCategories) {
    const s = catScores[cat] || 5;
    score += s;
    reasons.push(`${cat} keywords detected (+${s})`);
  }

  score += firewallResult.totalRiskModifier || 0;

  if (firewallResult.firewallAction === 'block') {
    score += 40;
    reasons.push('Firewall block action triggered');
  } else if (firewallResult.firewallAction === 'escalate') {
    score += 20;
    reasons.push('Firewall escalate action triggered');
  }

  if (compliancePack === 'sfda' || compliancePack === 'healthcare') {
    score += 10;
    reasons.push('Healthcare/SFDA compliance pack active');
  }

  if (!user) {
    score += 10;
    reasons.push('Unauthenticated user');
  }

  const msgLen = (requestMetadata && requestMetadata.messageLength) || 0;
  if (msgLen > 5000) {
    score += 5;
    reasons.push('Very long message');
  }

  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    score += 5;
    reasons.push('After-hours access');
  }

  score = Math.min(100, Math.max(0, score));

  let level = 'low';
  if (score >= 76) level = 'critical';
  else if (score >= 51) level = 'high';
  else if (score >= 26) level = 'medium';

  return {
    score,
    level,
    reasons,
    requiresApproval: level !== 'low'
  };
}

module.exports = { computeRiskScore };
