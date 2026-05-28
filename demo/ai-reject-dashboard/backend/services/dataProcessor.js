const { computeRiskScore, riskLevel } = require('./riskService');

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

// Official column mapping for ALL_ITEMS_MAIS_with_life_years.xlsx
const EXCEL_COLUMN_MAP = {
  'Item Code': 'item_code',
  'Item Name': 'item_name',
  'Batch Number': 'batch_number',
  'UOM': 'uom',
  'Quantity': 'quantity',
  'Rate': 'rate',
  'Stock Value': 'stock_value',
  'Manufacturing Date': 'manufacturing_date',
  'Life Years': 'life_years',
  'Expiry Date': 'expiry_date',
  'Rpt Date': 'rpt_date',
  'Age %': 'age_percent',
  'Remaining %': 'remaining_percent',
  'Total Life': 'total_life',
  'Pass': 'pass_status',
  'Rpt-Date': 'report_date'
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
  if (!clean) return 'Not Available';
  return DEPARTMENT_ALIASES[clean.toLowerCase()] || clean;
}

function normalizeCategory(value) {
  const clean = String(value || '').trim();
  if (!clean) return 'Not Available';
  return CATEGORY_ALIASES[clean.toLowerCase()] || clean;
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value || '').replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  
  // If it is an Excel serial number
  if (typeof value === 'number' || (!Number.isNaN(Number(value)) && !String(value).includes('-') && !String(value).includes('/'))) {
    const serial = Number(value);
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + serial * 86400000);
  }

  const str = String(value).trim();
  
  // Format dd-mm-yyyy or dd/mm/yyyy
  const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const matchDmy = str.match(dmyRegex);
  if (matchDmy) {
    const day = parseInt(matchDmy[1], 10);
    const month = parseInt(matchDmy[2], 10) - 1; // 0-indexed month
    const year = parseInt(matchDmy[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!Number.isNaN(date.getTime())) return date;
  }

  // Format yyyy-mm-dd or yyyy/mm/dd
  const ymdRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
  const matchYmd = str.match(ymdRegex);
  if (matchYmd) {
    const year = parseInt(matchYmd[1], 10);
    const month = parseInt(matchYmd[2], 10) - 1;
    const day = parseInt(matchYmd[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!Number.isNaN(date.getTime())) return date;
  }

  // Fallback to default parsing
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getShelfLifeStatus(remainingPercent) {
  const pct = Number(remainingPercent) || 0;
  if (pct <= 0) return 'Expired';
  if (pct <= 20) return 'Near Expiry';
  if (pct <= 50) return 'Warning';
  return 'Safe';
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

function isGrandTotalRow(record) {
  const check = String(record.item_name || record.item_code || record.Item_Name || record.Item_Code || '').trim().toLowerCase();
  if (/^grand\s*total$/i.test(check)) return true;
  if (/^إجمالي/i.test(check)) return true;
  if (/المجموع/.test(check)) return true;
  if (/^total$/i.test(check)) return true;
  if (/^sum$/i.test(check)) return true;
  if (/合计/.test(check)) return true;
  if (/^total/i.test(check)) return true;
  if (/^إجمالي\s*العام$/i.test(check)) return true;

  for (const key of Object.keys(record)) {
    const val = String(record[key] || '').trim().toLowerCase();
    if (!val) continue;

    if (/^grand\s*total$/i.test(val)) return true;
    if (/إجمالي/.test(val)) return true;
    if (/المجموع/.test(val)) return true;
    if (/مجموع/.test(val)) return true;
    if (/^(total|sum|totals|subtotal)$/i.test(val)) return true;
  }

  if (/\b(total|sum|subtotal|summary|totals)\b/i.test(check)) return true;

  return false;
}

function mapExcelColumns(record) {
  const mapped = { ...record };
  for (const [excelCol, field] of Object.entries(EXCEL_COLUMN_MAP)) {
    if (record[excelCol] !== undefined) {
      mapped[field] = record[excelCol];
    }
  }
  return mapped;
}

function normalizeRecord(record, index, sheetName) {
  const mapped = mapExcelColumns(record);
  const cleaned = cleanRecord(mapped);

  // --- Core numeric fields ---
  const cost = readNumericByCandidates(cleaned, [
    'stock_value', 'total_cost', 'cost', 'value', 'amount', 'estimated_cost', 'reject_cost', 'price'
  ]);
  const quantity = readNumericByCandidates(cleaned, [
    'quantity', 'qty', 'stock_qty', 'rejected_qty', 'total_qty'
  ]);

  // --- Identity fields ---
  const itemName = readField(cleaned, [
    'item_name', 'item', 'description', 'product', 'material'
  ], '');
  const itemCode = readField(cleaned, [
    'item_code', 'code', 'sku', 'material_code'
  ], '');

  // --- Batch / unit fields ---
  const batchNumber = readField(cleaned, [
    'batch_number', 'batch_no', 'batch', 'lot_no', 'lot'
  ], '');
  const uom = readField(cleaned, [
    'uom', 'unit', 'unit_of_measure'
  ], '');
  const rate = toNumber(readField(cleaned, [
    'rate', 'unit_cost', 'price'
  ], 0));

  // --- Life / expiry fields ---
  const manufacturingDate = parseDate(readField(cleaned, [
    'manufacturing_date', 'mfg_date', 'prod_date'
  ], null));
  const lifeYears = toNumber(readField(cleaned, [
    'life_years', 'life', 'shelf_life_years'
  ], 0));
  const expiryDate = parseDate(readField(cleaned, [
    'expiry_date', 'exp_date', 'expiration'
  ], null));

  // --- Report / age fields ---
  const rptDate = parseDate(readField(cleaned, [
    'rpt_date', 'report_date', 'rpt_date_alt'
  ], null));
  const agePercent = toNumber(readField(cleaned, [
    'age_percent', 'age_%', 'age_pct', 'age'
  ], 0));
  const remainingPercent = toNumber(readField(cleaned, [
    'remaining_percent', 'remaining_%', 'remaining_pct', 'remaining'
  ], 0));
  const totalLife = toNumber(readField(cleaned, [
    'total_life', 'total_life_years'
  ], 0));
  const passStatus = readField(cleaned, [
    'pass_status', 'pass', 'pass_fail', 'status'
  ], '');
  const reportDate = parseDate(readField(cleaned, [
    'report_date', 'rpt_date', 'rpt_date_alt'
  ], null));

  // --- Contextual fields ---
  const dateValue = readField(cleaned, ['date', 'doc_date', 'transaction_date', 'created_at', 'month'], '');
  const parsedDate = parseDate(dateValue);

  // AR: استخدام Unknown أو Not Available بوضوح وعدم توليد قيم وهمية
  const department = normalizeDepartment(readField(cleaned, ['department', 'dept', 'section', 'area'], 'Not Available'));
  const category = normalizeCategory(readField(cleaned, ['category', 'item_category', 'type', 'class', 'group'], 'Not Available'));
  const approvalStatus = String(readField(cleaned, ['approval_status', 'status', 'approval', 'workflow_status'], '') || '').trim() || 'Unknown';
  const defectType = String(readField(cleaned, ['defect', 'defect_type', 'machine_defect', 'reason', 'root_cause'], '') || '').trim() || 'Not Available';
  const machine = String(readField(cleaned, ['machine', 'machine_id', 'line', 'production_line'], '') || '').trim() || 'Not Available';

  // --- Validation Warnings ---
  const validationWarnings = [];
  if (!itemCode) validationWarnings.push('Missing Item Code');
  if (!itemName) validationWarnings.push('Missing Item Name');
  if (!batchNumber) validationWarnings.push('Missing Batch Number');
  if (cost <= 0) validationWarnings.push('Zero or negative stock value');
  if (expiryDate && expiryDate.getTime() < Date.now()) {
    validationWarnings.push('Item is Expired');
  }
  if (manufacturingDate && expiryDate && manufacturingDate.getTime() > expiryDate.getTime()) {
    validationWarnings.push('Manufacturing date after Expiry date');
  }

  // --- Shelf Life Status ---
  const shelfLifeStatus = getShelfLifeStatus(remainingPercent);

  const baseRecord = {
    ...cleaned,
    __sheet: sheetName,
    __row_number: cleaned.__row_number,
    doc_no: String(readField(cleaned, ['doc_no', 'document_no', 'reference', 'reject_no'], '') || '').trim() || `STK-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
    item_code: String(itemCode || '').trim() || 'Not Available',
    item_name: String(itemName || itemCode || '').trim() || 'Not Available',
    batch_number: String(batchNumber).trim() || 'Not Available',
    uom: String(uom).trim() || 'Not Available',
    quantity,
    rate,
    stock_value: cost,
    cost,
    total_cost: cost,
    manufacturing_date: manufacturingDate ? manufacturingDate.toISOString().split('T')[0] : '',
    life_years: lifeYears,
    expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : '',
    rpt_date: rptDate ? rptDate.toISOString().split('T')[0] : '',
    age_percent: agePercent,
    remaining_percent: remainingPercent,
    total_life: totalLife,
    pass_status: String(passStatus).trim() || 'Not Available',
    report_date: reportDate ? reportDate.toISOString().split('T')[0] : '',
    department,
    category,
    approval_status: approvalStatus,
    date: parsedDate ? parsedDate.toISOString().split('T')[0] : (reportDate ? reportDate.toISOString().split('T')[0] : ''),
    machine,
    defect_type: defectType,
    shelf_life_status: shelfLifeStatus,
    validation_warnings: validationWarnings,
    analysis_type: 'stock_life_risk',
    data_classification: 'Stock/Life Risk',
    raw: cleaned
  };

  // --- Risk Score ---
  const riskResult = computeRiskScore({
    ...baseRecord,
    has_life_risk: shelfLifeStatus === 'Expired' || shelfLifeStatus === 'Near Expiry'
  });
  
  return {
    ...baseRecord,
    risk_score: riskResult.score,
    risk_level: riskLevel(riskResult.score),
    risk_factors: riskResult.reasons
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
  const records = rows
    .map((row, index) => normalizeRecord(row, index, row.__sheet))
    .filter((record) => {
      if (isGrandTotalRow(record)) return false;
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
    year_over_year_comparison: yearOverYear(records),
    life_risk_summary: lifeRiskSummary(records)
  };
}

function lifeRiskSummary(records) {
  const withLife = records.filter(r => r.life_years > 0);
  const expired = withLife.filter(r => r.remaining_percent <= 0);
  const nearExpiry = withLife.filter(r => r.remaining_percent > 0 && r.remaining_percent <= 20);
  return {
    total_with_life_data: withLife.length,
    expired_count: expired.length,
    near_expiry_count: nearExpiry.length,
    avg_age_percent: withLife.length ? round(withLife.reduce((s, r) => s + r.age_percent, 0) / withLife.length) : 0,
    avg_remaining_percent: withLife.length ? round(withLife.reduce((s, r) => s + r.remaining_percent, 0) / withLife.length) : 0
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
    if (record.defect_type && record.defect_type !== 'Not Available') grouped[machine].defect_records += 1;
    grouped[machine].defect_rate = round((grouped[machine].defect_records / grouped[machine].total_records) * 100);
  });
  return grouped;
}

function monthlyTrends(records) {
  const grouped = {};
  records.forEach((record) => {
    const date = parseDate(record.date);
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
    const date = parseDate(record.date);
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
  parseDate,
  findField,
  isGrandTotalRow,
  EXCEL_COLUMN_MAP
};
