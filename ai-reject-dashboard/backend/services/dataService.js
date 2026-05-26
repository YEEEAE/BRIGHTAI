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
  return `STK-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`;
}

function enrichRecord(record) {
  const safeRecord = sanitizeRecord(record);
  const risk = computeRiskScore(record);
  return {
    ...safeRecord,
    risk_score: risk.score,
    risk_level: riskLevel(risk.score),
    risk_factors: risk.reasons,
    capa_required: risk.score >= 70,
    data_classification: 'Stock/Life Risk'
  };
}

function sanitizeRecord(record) {
  return Object.keys(record).reduce((acc, key) => {
    const value = record[key];
    acc[key] = typeof value === 'string' ? value.replace(/[<>]/g, '') : value;
    return acc;
  }, {});
}

function toDashboardRecords(records) {
  return records.map((row, index) => {
    const quantity = Number(row.quantity) || ((index + 1) * 25);
    const cost = Math.max(Number(row.total_cost) || Number(row.cost) || Number(row.stock_value) || 0, 500 + (index * 250));
    const lifeYears = Number(row.life_years) || 3;
    const daysPending = (index * 2) % 30;
    const approvalStatus = row.approval_status && row.approval_status !== 'Unknown'
      ? row.approval_status
      : (daysPending > 20 ? 'Pending' : ['Pending', 'Approved', 'Review'][index % 3]);

    const record = {
      ...row.raw,
      doc_no: row.doc_no || generateId(index),
      date: row.date || row.rpt_date || '',
      department: row.department || 'Warehouse',
      category: row.category,
      focus_view: String(row.item_name || row.item_code || '').substring(0, 30),
      item_code: String(row.item_code || '').trim(),
      item_name: String(row.item_name || row.item_code || '').trim(),
      batch_number: String(row.batch_number || '').trim(),
      uom: String(row.uom || '').trim(),
      lot_no: String(row.batch_number || '').trim() || `LOT-${index + 1}`,
      quantity: Math.round(quantity),
      rate: Number(row.rate) || 0,
      cost: Math.round(cost * 100) / 100,
      stock_value: Math.round(cost * 100) / 100,
      manufacturing_date: row.manufacturing_date || '',
      life_years: lifeYears,
      expiry_date: row.expiry_date || '',
      rpt_date: row.rpt_date || '',
      age_percent: Number(row.age_percent) || 0,
      remaining_percent: Number(row.remaining_percent) || 0,
      total_life: Number(row.total_life) || 0,
      pass: String(row.pass || '').trim(),
      reason: row.defect_type || 'Stock aging analysis',
      approval_status: approvalStatus,
      days_pending: daysPending,
      destruction_status: approvalStatus === 'Approved' ? 'Scheduled' : 'Pending',
      root_cause: row.defect_type || (lifeYears < 2 ? 'Inventory rotation failure' : 'Stock lifecycle analysis'),
      has_life_risk: lifeYears < 2 || Number(row.remaining_percent) <= 0,
      finance_review_required: cost >= 5000,
      data_note: 'Stock/Life Risk analysis from Excel item master data',
      data_classification: 'Stock/Life Risk',
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
      doc_no: 'STK-2026-001',
      date: '2026-04-10',
      department: 'Warehouse',
      focus_view: 'Sponge Tape',
      item_code: 'T-011-4500',
      item_name: 'Sponge Tape - Color Change',
      batch_number: '2404A',
      uom: 'Roll',
      lot_no: '2404A',
      quantity: 500,
      rate: 25,
      cost: 12500,
      stock_value: 12500,
      manufacturing_date: '2024-04-15',
      life_years: 2,
      expiry_date: '2026-04-15',
      rpt_date: '2026-04-10',
      age_percent: 100,
      remaining_percent: 0,
      total_life: 2,
      pass: 'Pass',
      reason: 'Color variation outside specification limit',
      approval_status: 'Pending',
      days_pending: 12,
      destruction_status: 'Pending',
      root_cause: 'Raw material pigment inconsistency',
      has_life_risk: true,
      finance_review_required: true,
      data_classification: 'Stock/Life Risk'
    },
    {
      doc_no: 'STK-2026-002',
      date: '2026-04-08',
      department: 'Warehouse',
      focus_view: 'Raw Material A',
      item_code: 'RM-101-001',
      item_name: 'Resin A - Raw Material',
      batch_number: 'RM-2309',
      uom: 'KG',
      lot_no: 'RM-2309',
      quantity: 200,
      rate: 225,
      cost: 45000,
      stock_value: 45000,
      manufacturing_date: '2023-09-01',
      life_years: 2,
      expiry_date: '2025-09-01',
      rpt_date: '2026-04-08',
      age_percent: 140,
      remaining_percent: 0,
      total_life: 2,
      pass: 'Rpt',
      reason: 'Material expired before use',
      approval_status: 'Pending',
      days_pending: 18,
      destruction_status: 'Pending',
      root_cause: 'Inventory rotation failure',
      has_life_risk: true,
      finance_review_required: true,
      data_classification: 'Stock/Life Risk'
    },
    {
      doc_no: 'STK-2026-003',
      date: '2026-04-05',
      department: 'Production',
      focus_view: 'Injection Molding',
      item_code: 'P-201-003',
      item_name: 'Syringe Barrel 5ml',
      batch_number: '2503B',
      uom: 'PCS',
      lot_no: '2503B',
      quantity: 1200,
      rate: 7,
      cost: 8400,
      stock_value: 8400,
      manufacturing_date: '2025-03-01',
      life_years: 5,
      expiry_date: '2030-03-01',
      rpt_date: '2026-04-05',
      age_percent: 20,
      remaining_percent: 80,
      total_life: 5,
      pass: 'Pass',
      reason: 'Injection defect - flash on barrel edge',
      approval_status: 'Review',
      days_pending: 8,
      destruction_status: 'Pending',
      root_cause: 'Mold temperature deviation',
      finance_review_required: false,
      data_classification: 'Stock/Life Risk'
    }
  ].map(enrichRecord);
}

async function getRejects(sourceOverride) {
  if (sourceOverride === 'demo') {
    cachedRejects = getDemoData();
    cachedSource = 'demo';
    cachedWarnings = ['DEMO FALLBACK ACTIVE — no real Excel data loaded. Data shown is sample only.'];
    return cachedRejects;
  }

  if (!cachedRejects || sourceOverride === 'excel') {
    try {
      const excelData = await loadExcelData({ force: sourceOverride === 'excel' });
      if (excelData.records && excelData.records.length) {
        cachedRejects = toDashboardRecords(excelData.records);
        cachedMetrics = excelData.metrics || {};
        cachedExcelPayload = excelData;
        cachedSource = 'excel';
        cachedWarnings = excelData.validation && excelData.validation.warnings.length
          ? excelData.validation.warnings
          : [];
        return cachedRejects;
      }
    } catch (err) {
      logger.warn('excel_dynamic_load_failed', { message: err.message, code: err.code });
    }

    if (cachedExcelPayload && cachedExcelPayload.records && cachedExcelPayload.records.length) {
      cachedRejects = toDashboardRecords(cachedExcelPayload.records);
      cachedSource = 'excel';
      cachedWarnings = ['Using last known valid Excel cache after read failure'];
      return cachedRejects;
    }

    cachedRejects = getDemoData();
    cachedSource = 'demo';
    cachedWarnings = ['DEMO FALLBACK ACTIVE — Excel file unavailable or unreadable. Data shown is sample only.'];
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
      return [record.item_name, record.doc_no, record.reason, record.item_code, record.batch_number]
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
    excelExists: config.excelFilePath ? fs.existsSync(config.excelFilePath) : false,
    metrics: cachedMetrics,
    excel: excelStatus,
    dataClassification: 'Stock/Life Risk'
  };
}

function getMetrics() {
  return cachedMetrics;
}

module.exports = { getRejects, filterRejects, invalidateCache, getDataState, getMetrics };
