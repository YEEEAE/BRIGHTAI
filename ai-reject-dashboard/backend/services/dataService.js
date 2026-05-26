const fs = require('fs');
const config = require('../config/env');
const { logger } = require('../utils/logger');
const { computeRiskScore, riskLevel } = require('./riskService');
const { loadExcelData, clearExcelCache, getDataStatus: getExcelDataStatus } = require('./excelService');

let cachedRejects = null;
let cachedSource = 'demo';
let cachedWarnings = [];
let cachedMetrics = {};
let cachedExcelPayload = null;

function generateId(index) {
  return `RJT-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`;
}

function randomDate(index) {
  const date = new Date();
  date.setDate(date.getDate() - ((index * 3) + 1));
  return date.toISOString().split('T')[0];
}

function enrichRecord(record) {
  const safeRecord = sanitizeRecord(record);
  const risk = computeRiskScore(record);
  return {
    ...safeRecord,
    risk_score: risk.score,
    risk_level: riskLevel(risk.score),
    risk_factors: risk.reasons,
    capa_required: risk.score >= 70
  };
}

function sanitizeRecord(record) {
  return Object.keys(record).reduce((acc, key) => {
    const value = record[key];
    acc[key] = typeof value === 'string' ? value.replace(/[<>]/g, '') : value;
    return acc;
  }, {});
}

function toDashboardRejects(records) {
  const departments = ['Warehouse', 'Production', 'QC'];
  const reasons = [
    'Material expired before use',
    'Colour variation outside specification',
    'Injection defect during moulding',
    'QC sample failed specification test',
    'Packaging damaged during storage',
    'Shelf life projection below minimum requirement'
  ];
  const rootCauses = [
    'Raw material quality deviation',
    'Inventory rotation failure',
    'Supplier batch inconsistency',
    'Production process deviation',
    'Storage condition non-compliance'
  ];

  return records.map((row, index) => {
    const quantity = Number(row.quantity) || ((index + 1) * 25);
    const cost = Math.max(Number(row.total_cost) || Number(row.cost) || 0, 500 + (index * 250));
    const lifeYears = Number(row.raw && (row.raw.Life || row.raw.life || row.raw.life_years)) || 3;
    const daysPending = (index * 2) % 30;
    const approvalStatus = row.approval_status && row.approval_status !== 'Unknown'
      ? row.approval_status
      : (daysPending > 20 ? 'Pending' : ['Pending', 'Approved', 'Review'][index % 3]);
    const record = {
      ...row.raw,
      doc_no: row.doc_no || generateId(index),
      date: row.date || randomDate(index),
      department: row.department || departments[index % departments.length],
      category: row.category,
      focus_view: String(row.item_name || row.item_code || '').substring(0, 30),
      item_code: String(row.item_code || '').trim(),
      item_name: String(row.item_name || row.item_code || '').trim(),
      lot_no: String(row.lot_no || (row.raw && (row.raw['Batch No'] || row.raw.batch || row.raw.lot_no)) || '').trim() || `LOT-${index + 1}`,
      quantity: Math.round(quantity),
      cost: Math.round(cost * 100) / 100,
      reason: row.defect_type || reasons[index % reasons.length],
      approval_status: approvalStatus,
      days_pending: daysPending,
      destruction_status: approvalStatus === 'Approved' ? 'Scheduled' : 'Pending',
      root_cause: row.defect_type || (lifeYears < 2 ? 'Inventory rotation failure' : rootCauses[index % rootCauses.length]),
      has_life_risk: lifeYears < 2,
      finance_review_required: cost >= 5000,
      data_note: 'Generated from dynamic Excel workbook data',
      source_sheet: row.__sheet,
      source_row: row.__row_number,
      raw: row.raw
    };

    return enrichRecord(record);
  });
}

function getDemoData() {
  return [
    {
      doc_no: 'RJT-2026-001',
      date: '2026-04-10',
      department: 'Warehouse',
      focus_view: 'Sponge Tape',
      item_code: 'T-011-4500',
      item_name: 'Sponge Tape - Color Change',
      lot_no: '2404A',
      quantity: 500,
      cost: 12500,
      reason: 'Color variation outside specification limit',
      approval_status: 'Pending',
      days_pending: 12,
      destruction_status: 'Pending',
      root_cause: 'Raw material pigment inconsistency',
      finance_review_required: true
    },
    {
      doc_no: 'RJT-2026-002',
      date: '2026-04-08',
      department: 'Warehouse',
      focus_view: 'Raw Material A',
      item_code: 'RM-101-001',
      item_name: 'Resin A - Raw Material',
      lot_no: 'RM-2309',
      quantity: 200,
      cost: 45000,
      reason: 'Material expired before use',
      approval_status: 'Pending',
      days_pending: 18,
      destruction_status: 'Pending',
      root_cause: 'Inventory rotation failure',
      has_life_risk: true,
      finance_review_required: true
    },
    {
      doc_no: 'RJT-2026-003',
      date: '2026-04-05',
      department: 'Production',
      focus_view: 'Injection Molding',
      item_code: 'P-201-003',
      item_name: 'Syringe Barrel 5ml',
      lot_no: '2503B',
      quantity: 1200,
      cost: 8400,
      reason: 'Injection defect - flash on barrel edge',
      approval_status: 'Review',
      days_pending: 8,
      destruction_status: 'Pending',
      root_cause: 'Mold temperature deviation',
      finance_review_required: false
    }
  ].map(enrichRecord);
}

async function getRejects(sourceOverride) {
  if (sourceOverride === 'demo') {
    cachedRejects = getDemoData();
    cachedSource = 'demo';
    cachedWarnings = [];
    return cachedRejects;
  }

  if (!cachedRejects || sourceOverride === 'excel') {
    try {
      const excelData = await loadExcelData({ force: sourceOverride === 'excel' });
      if (excelData.records && excelData.records.length) {
        cachedRejects = toDashboardRejects(excelData.records);
        cachedMetrics = excelData.metrics || {};
        cachedExcelPayload = excelData;
        cachedSource = 'excel';
        cachedWarnings = excelData.validation && excelData.validation.warnings.length
          ? excelData.validation.warnings
          : ['Data generated from dynamic Excel workbook data'];
        return cachedRejects;
      }
    } catch (err) {
      logger.warn('excel_dynamic_load_failed', { message: err.message, code: err.code });
    }

    if (cachedExcelPayload && cachedExcelPayload.records && cachedExcelPayload.records.length) {
      cachedRejects = toDashboardRejects(cachedExcelPayload.records);
      cachedSource = 'excel';
      cachedWarnings = ['Using last known valid Excel cache after read failure'];
      return cachedRejects;
    }

    cachedRejects = getDemoData();
    cachedSource = 'demo';
    cachedWarnings = ['Excel file unavailable or unreadable - demo data is being used'];
  }

  return cachedRejects;
}

function invalidateCache(reason) {
  cachedRejects = null;
  cachedMetrics = {};
  cachedExcelPayload = null;
  clearExcelCache(reason);
  logger.info('data_cache_invalidated', { reason });
}

function filterRejects(rejects, query) {
  return rejects.filter((record) => {
    if (query.department && !String(query.department).split(',').includes(record.department)) return false;
    if (query.risk_level && !String(query.risk_level).split(',').includes(record.risk_level)) return false;
    if (query.status && !String(query.status).split(',').includes(record.approval_status)) return false;
    if (query.from_date && record.date < query.from_date) return false;
    if (query.to_date && record.date > query.to_date) return false;
    if (query.search) {
      const search = String(query.search).toLowerCase();
      return [record.item_name, record.doc_no, record.reason, record.item_code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    }
    return true;
  });
}

function getDataState() {
  const excelStatus = getExcelDataStatus();
  return {
    cachedSource,
    cachedWarnings,
    excelExists: fs.existsSync(config.excelFilePath),
    metrics: cachedMetrics,
    excel: excelStatus
  };
}

function getMetrics() {
  return cachedMetrics;
}

module.exports = { getRejects, filterRejects, invalidateCache, getDataState, getMetrics };
