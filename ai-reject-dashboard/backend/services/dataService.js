const fs = require('fs');
const XLSX = require('xlsx');
const config = require('../config/env');
const { logger } = require('../utils/logger');
const { computeRiskScore, riskLevel } = require('./riskService');

let cachedRejects = null;
let cachedSource = 'demo';
let cachedWarnings = [];

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

function readExcelData() {
  if (!fs.existsSync(config.excelFilePath)) {
    logger.warn('excel_file_missing', { path: config.excelFilePath });
    return null;
  }

  const workbook = XLSX.readFile(config.excelFilePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });
  const headerRow = raw.findIndex((row) => row && row[0] === 'Item Code' && row[1] === 'Item Name');

  if (headerRow === -1) {
    logger.warn('excel_header_missing', { path: config.excelFilePath });
    return null;
  }

  const rows = raw
    .slice(headerRow + 1)
    .filter((row) => String(row[0] || '').trim() && String(row[1] || '').trim())
    .slice(0, 25);

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

  return rows.map((row, index) => {
    const quantity = Number(row[4]) || ((index + 1) * 25);
    const rate = Number(row[5]) || 12;
    const stockValue = Number(row[6]) || quantity * rate;
    const lifeYears = Number(row[8]) || 3;
    const cost = Math.max(stockValue, 500 + (index * 250));
    const daysPending = (index * 2) % 30;
    const approvalStatus = daysPending > 20 ? 'Pending' : ['Pending', 'Approved', 'Review'][index % 3];
    const record = {
      doc_no: generateId(index),
      date: randomDate(index),
      department: departments[index % departments.length],
      focus_view: String(row[1] || '').substring(0, 30),
      item_code: String(row[0] || '').trim(),
      item_name: String(row[1] || '').trim(),
      lot_no: String(row[2] || '').trim() || `LOT-${index + 1}`,
      quantity: Math.round(quantity),
      cost: Math.round(cost * 100) / 100,
      reason: reasons[index % reasons.length],
      approval_status: approvalStatus,
      days_pending: daysPending,
      destruction_status: approvalStatus === 'Approved' ? 'Scheduled' : 'Pending',
      root_cause: lifeYears < 2 ? 'Inventory rotation failure' : rootCauses[index % rootCauses.length],
      has_life_risk: lifeYears < 2,
      finance_review_required: cost >= 5000,
      data_note: 'Generated from Excel item master data'
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

function getRejects(sourceOverride) {
  if (sourceOverride === 'demo') {
    cachedRejects = getDemoData();
    cachedSource = 'demo';
    cachedWarnings = [];
    return cachedRejects;
  }

  if (!cachedRejects || sourceOverride === 'excel') {
    const excelData = readExcelData();
    if (excelData && excelData.length) {
      cachedRejects = excelData;
      cachedSource = 'excel';
      cachedWarnings = ['Data generated from Excel item master - reject records are estimated from available item fields'];
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
  return {
    cachedSource,
    cachedWarnings,
    excelExists: fs.existsSync(config.excelFilePath)
  };
}

module.exports = { getRejects, filterRejects, invalidateCache, getDataState };
