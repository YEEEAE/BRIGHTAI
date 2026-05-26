const DEPARTMENT_ALIASES = {
  wh: 'Warehouse',
  warehouse: 'Warehouse',
  stores: 'Warehouse',
  store: 'Warehouse',
  qc: 'QC',
  quality: 'QC',
  'quality control': 'QC',
  production: 'Production',
  prod: 'Production',
  operations: 'Production'
};

const CATEGORY_ALIASES = {
  raw: 'Raw Material',
  'raw material': 'Raw Material',
  rm: 'Raw Material',
  finished: 'Finished Goods',
  fg: 'Finished Goods',
  packaging: 'Packaging',
  pack: 'Packaging'
};

function cleanNulls(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ');
  return value;
}

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeDepartment(value) {
  const clean = String(value || '').trim();
  if (!clean) return 'Unknown';
  return DEPARTMENT_ALIASES[clean.toLowerCase()] || clean;
}

function normalizeCategory(value) {
  const clean = String(value || '').trim();
  if (!clean) return 'Uncategorized';
  return CATEGORY_ALIASES[clean.toLowerCase()] || clean;
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value || '').replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    // AR: Excel serial date تقريبية، تكفي للتحليل الزمني.
    // EN: Approximate Excel serial date conversion for trend analytics.
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + value * 86400000);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function findField(record, candidates) {
  const keys = Object.keys(record || {});
  const normalizedCandidates = candidates.map(normalizeKey);
  return keys.find((key) => normalizedCandidates.includes(normalizeKey(key)));
}

function readField(record, candidates, fallback) {
  const key = findField(record, candidates);
  return key ? record[key] : fallback;
}

function cleanRecord(record) {
  const cleaned = {};
  Object.keys(record || {}).forEach((key) => {
    const cleanKey = String(key || '').trim();
    if (!cleanKey) return;
    cleaned[cleanKey] = cleanNulls(record[key]);
  });
  return cleaned;
}

function normalizeRecord(record, index, sheetName) {
  const cleaned = cleanRecord(record);
  const cost = readNumericByCandidates(cleaned, [
    'total_cost', 'cost', 'stock_value', 'value', 'amount', 'estimated_cost', 'reject_cost', 'price'
  ]);
  const quantity = readNumericByCandidates(cleaned, ['quantity', 'qty', 'stock_qty', 'rejected_qty', 'total_qty']);
  const itemName = readField(cleaned, ['item_name', 'item', 'description', 'product', 'material'], '');
  const itemCode = readField(cleaned, ['item_code', 'code', 'sku', 'material_code'], '');
  const dateValue = readField(cleaned, ['date', 'doc_date', 'transaction_date', 'created_at', 'month'], '');
  const parsedDate = toDate(dateValue);
  const department = normalizeDepartment(readField(cleaned, ['department', 'dept', 'section', 'area'], 'Unknown'));
  const category = normalizeCategory(readField(cleaned, ['category', 'item_category', 'type', 'class', 'group'], 'Uncategorized'));
  const approvalStatus = String(readField(cleaned, ['approval_status', 'status', 'approval', 'workflow_status'], '') || '');
  const defectType = String(readField(cleaned, ['defect', 'defect_type', 'machine_defect', 'reason', 'root_cause'], '') || '');
  const machine = String(readField(cleaned, ['machine', 'machine_id', 'line', 'production_line'], '') || '');

  return {
    ...cleaned,
    __sheet: sheetName,
    __row_number: cleaned.__row_number,
    doc_no: String(readField(cleaned, ['doc_no', 'document_no', 'reference', 'reject_no'], '') || `RJT-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`),
    item_code: String(itemCode || '').trim(),
    item_name: String(itemName || itemCode || `Row ${index + 1}`).trim(),
    department,
    category,
    quantity,
    cost,
    total_cost: cost,
    approval_status: approvalStatus || 'Unknown',
    date: parsedDate ? parsedDate.toISOString().split('T')[0] : '',
    machine,
    defect_type: defectType,
    raw: cleaned
  };
}

function readNumericByCandidates(record, candidates) {
  const key = findField(record, candidates);
  if (key) return toNumber(record[key]);

  const quantity = toNumber(readField(record, ['quantity', 'qty', 'stock_qty'], 0));
  const rate = toNumber(readField(record, ['rate', 'unit_cost', 'price'], 0));
  return quantity && rate ? quantity * rate : 0;
}

function processRows(rows) {
  const records = rows.map((row, index) => normalizeRecord(row, index, row.__sheet)).filter((record) => {
    return Object.keys(record.raw || {}).some((key) => key !== '__row_number' && key !== '__sheet' && cleanNulls(record.raw[key]) !== '');
  });

  return {
    records,
    metrics: calculateMetrics(records),
    generated_at: new Date().toISOString()
  };
}

function calculateMetrics(records) {
  const totalCost = sum(records, (record) => record.total_cost);
  const pendingApprovals = records.filter((record) => /pending|review|waiting/i.test(record.approval_status));
  const criticalItems = records
    .filter((record) => record.total_cost >= 20000 || /critical|high|expired|contamination/i.test(`${record.defect_type} ${record.approval_status}`))
    .slice(0, 50);

  return {
    total_cost: round(totalCost),
    cost_by_department: sumBy(records, 'department'),
    cost_by_category: sumBy(records, 'category'),
    pending_approvals_count: pendingApprovals.length,
    critical_items: criticalItems,
    machine_defect_rates: machineDefectRates(records),
    monthly_trends: monthlyTrends(records),
    year_over_year_comparison: yearOverYear(records)
  };
}

function sum(records, selector) {
  return records.reduce((acc, record) => acc + (Number(selector(record)) || 0), 0);
}

function sumBy(records, key) {
  const grouped = {};
  records.forEach((record) => {
    const label = record[key] || 'Unknown';
    if (!grouped[label]) grouped[label] = { count: 0, total_cost: 0 };
    grouped[label].count += 1;
    grouped[label].total_cost = round(grouped[label].total_cost + (Number(record.total_cost) || 0));
  });
  return grouped;
}

function machineDefectRates(records) {
  const grouped = {};
  records.forEach((record) => {
    const machine = record.machine || 'Unknown';
    if (!grouped[machine]) grouped[machine] = { total_records: 0, defect_records: 0, defect_rate: 0 };
    grouped[machine].total_records += 1;
    if (record.defect_type) grouped[machine].defect_records += 1;
    grouped[machine].defect_rate = round((grouped[machine].defect_records / grouped[machine].total_records) * 100);
  });
  return grouped;
}

function monthlyTrends(records) {
  const grouped = {};
  records.forEach((record) => {
    const date = toDate(record.date);
    const key = date ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}` : 'Unknown';
    if (!grouped[key]) grouped[key] = { count: 0, total_cost: 0 };
    grouped[key].count += 1;
    grouped[key].total_cost = round(grouped[key].total_cost + (Number(record.total_cost) || 0));
  });
  return grouped;
}

function yearOverYear(records) {
  const byYear = {};
  records.forEach((record) => {
    const date = toDate(record.date);
    const year = date ? String(date.getUTCFullYear()) : 'Unknown';
    if (!byYear[year]) byYear[year] = { count: 0, total_cost: 0 };
    byYear[year].count += 1;
    byYear[year].total_cost = round(byYear[year].total_cost + (Number(record.total_cost) || 0));
  });

  const years = Object.keys(byYear).filter((year) => year !== 'Unknown').sort();
  return years.map((year, index) => {
    const previous = byYear[years[index - 1]];
    const current = byYear[year];
    return {
      year,
      count: current.count,
      total_cost: current.total_cost,
      cost_change_percent: previous ? round(((current.total_cost - previous.total_cost) / Math.max(previous.total_cost, 1)) * 100) : null,
      count_change_percent: previous ? round(((current.count - previous.count) / Math.max(previous.count, 1)) * 100) : null
    };
  });
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

module.exports = {
  cleanNulls,
  normalizeDepartment,
  normalizeCategory,
  processRows,
  calculateMetrics,
  toNumber,
  findField
};
