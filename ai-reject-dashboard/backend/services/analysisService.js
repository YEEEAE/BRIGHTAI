function computeAnalysis(rejects) {
  const total = rejects.length;
  const totalCost = rejects.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);
  const highRisk = rejects.filter((record) => Number(record.risk_score) >= 70).length;
  const pendingApprovals = rejects.filter((record) => record.approval_status === 'Pending');
  const pendingDestruction = rejects.filter((record) => record.destruction_status === 'Pending' && record.approval_status !== 'Approved');

  const rootCauseCounts = countBy(rejects, 'root_cause');
  const departmentCosts = sumBy(rejects, 'department', 'cost');
  const itemCosts = sumBy(rejects, 'item_name', 'cost');

  const repeatedRootCauses = Object.keys(rootCauseCounts)
    .sort((a, b) => rootCauseCounts[b] - rootCauseCounts[a])
    .slice(0, 5)
    .map((cause) => ({
      cause,
      count: rootCauseCounts[cause],
      percentage: percent(rootCauseCounts[cause], total)
    }));

  const costByDepartment = Object.keys(departmentCosts)
    .map((department) => ({
      department,
      cost: departmentCosts[department],
      percentage: percent(departmentCosts[department], totalCost)
    }))
    .sort((a, b) => b.cost - a.cost);

  const avgItemCost = totalCost / Math.max(1, Object.keys(itemCosts).length);
  const anomalies = Object.keys(itemCosts)
    .filter((item) => itemCosts[item] > avgItemCost * 3 && itemCosts[item] >= 10000)
    .map((item) => ({
      item,
      total_cost: itemCosts[item],
      case_count: rejects.filter((record) => record.item_name === item).length,
      percentage_of_total: percent(itemCosts[item], totalCost),
      alert: `${item} represents ${percent(itemCosts[item], totalCost)}% of total reject cost. Immediate investigation recommended.`
    }));

  const avgDelay = pendingApprovals.length
    ? Math.round(pendingApprovals.reduce((sum, record) => sum + (Number(record.days_pending) || 0), 0) / pendingApprovals.length)
    : 0;
  const projectedNextMonth = projectNextMonthCost(rejects, totalCost);
  const topRootCause = repeatedRootCauses[0] ? repeatedRootCauses[0].cause : 'None identified';
  const totalDestructionCost = pendingDestruction.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);

  return {
    executive_summary: `Analysis of ${total} reject cases shows a total estimated cost of SAR ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}. ${highRisk} high or critical risk cases need management attention. The most frequent root cause is "${topRootCause}". Average approval delay is ${avgDelay} days.`,
    overall_risk_level: highRisk >= 4 ? 'High' : (highRisk >= 2 ? 'Medium' : 'Low'),
    total_cases: total,
    total_estimated_cost: Math.round(totalCost * 100) / 100,
    high_risk_cases: highRisk,
    repeated_root_causes: repeatedRootCauses,
    cost_by_department: costByDepartment,
    finance_alerts: rejects
      .filter((record) => record.finance_review_required && Number(record.cost) >= 5000)
      .sort((a, b) => Number(b.cost) - Number(a.cost))
      .slice(0, 7)
      .map((record) => ({
        item: record.item_name,
        cost: Number(record.cost) || 0,
        risk: record.risk_level || 'Medium',
        recommendation: Number(record.cost) >= 20000 ? 'Requires Finance Director review before destruction' : 'Review financial impact before destruction approval'
      })),
    capa_suggestions: rejects
      .filter((record) => record.capa_required)
      .slice(0, 6)
      .map((record) => ({
        title: record.root_cause || 'Investigation required',
        description: `Root cause identified for ${record.item_name} requires corrective and preventive action. ${record.reason || ''}`,
        priority: record.risk_level || 'Medium',
        department: record.department || '-'
      })),
    destruction_backlog_alerts: pendingDestruction
      .slice(0, 5)
      .map((record) => ({
        item: record.item_name,
        days_pending: Number(record.days_pending) || 0,
        quantity: Number(record.quantity) || 0,
        cost: Number(record.cost) || 0
      })),
    approval_delay_alerts: rejects
      .filter((record) => Number(record.days_pending) >= 15)
      .slice(0, 5)
      .map((record) => ({
        item: record.item_name,
        days_pending: Number(record.days_pending) || 0,
        department: record.department || '-'
      })),
    anomalies,
    projected_next_month_cost: projectedNextMonth,
    predictive_confidence: rejects.length >= 20 ? 'Medium' : 'Low',
    management_actions: [
      { action: `Review ${highRisk} high/critical risk cases requiring immediate attention`, priority: 'Critical' },
      { action: `Process ${pendingDestruction.length} pending destruction cases with total cost impact of SAR ${totalDestructionCost.toLocaleString()}`, priority: 'Critical' },
      { action: `Address approval delays averaging ${avgDelay} days`, priority: 'High' },
      { action: `Assign CAPA owner for top root cause: "${topRootCause}"`, priority: 'High' }
    ]
  };
}

function countBy(records, key) {
  return records.reduce((acc, record) => {
    const value = record[key] || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(records, groupKey, valueKey) {
  return records.reduce((acc, record) => {
    const group = record[groupKey] || 'Unknown';
    acc[group] = (acc[group] || 0) + (Number(record[valueKey]) || 0);
    return acc;
  }, {});
}

function percent(value, total) {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
}

function projectNextMonthCost(records, totalCost) {
  const dates = records.map((record) => record.date).filter(Boolean).sort();
  if (dates.length < 2) return Math.round(totalCost);
  const days = Math.max(1, Math.round((new Date(dates[dates.length - 1]) - new Date(dates[0])) / 86400000));
  return Math.round((totalCost / days) * 30);
}

module.exports = { computeAnalysis };
