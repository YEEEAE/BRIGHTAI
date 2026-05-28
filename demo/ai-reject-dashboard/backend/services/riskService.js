function computeRiskScore(record) {
  let score = 10;
  const reasons = [];
  const cost = Number(record.cost) || 0;

  if (cost > 100000) { score += 30; reasons.push('Cost > SAR 100K'); }
  else if (cost > 50000) { score += 25; reasons.push('Cost > SAR 50K'); }
  else if (cost > 20000) { score += 20; reasons.push('Cost > SAR 20K'); }
  else if (cost > 10000) { score += 15; reasons.push('Cost > SAR 10K'); }
  else if (cost > 5000) { score += 10; reasons.push('Cost > SAR 5K'); }
  else if (cost > 1000) { score += 5; reasons.push('Cost > SAR 1K'); }

  const quantity = Number(record.quantity) || 0;
  if (quantity > 1000) score += 10;
  else if (quantity > 500) score += 7;
  else if (quantity > 100) score += 4;
  else if (quantity > 10) score += 2;

  const days = Number(record.days_pending) || 0;
  if (days > 25) { score += 20; reasons.push('Pending > 25 days'); }
  else if (days > 20) { score += 15; reasons.push('Pending > 20 days'); }
  else if (days > 15) { score += 10; reasons.push('Pending > 15 days'); }
  else if (days > 10) { score += 5; reasons.push('Pending > 10 days'); }
  else if (days > 5) score += 3;

  if (record.destruction_status === 'Pending' && record.approval_status !== 'Approved') {
    score += 10;
    reasons.push('Destruction pending');
  }
  if (record.has_life_risk) { score += 15; reasons.push('Expiry/life risk'); }
  if (record.is_repeated_rc) { score += 10; reasons.push('Repeated root cause'); }
  if (['Warehouse', 'QC'].includes(record.department)) { score += 5; reasons.push('High-risk department'); }
  if (record.finance_review_required) score += 5;

  return { score: Math.min(100, Math.max(1, score)), reasons };
}

function riskLevel(score) {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

module.exports = { computeRiskScore, riskLevel };
