require('dotenv').config();
var express = require('express');
var cors = require('cors');
var path = require('path');
var fs = require('fs');

var app = express();
var PORT = process.env.PORT || 3000;
var EXCEL_PATH = process.env.EXCEL_FILE_PATH || path.join(__dirname, '..', 'reports', 'ALL_ITEMS_MAIS_with_life_years.xlsx');
var GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
var GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
var DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || '';
var FOCUS_API_URL = process.env.FOCUS_API_URL || '';
var FOCUS_API_TOKEN = process.env.FOCUS_API_TOKEN || '';

var AUDIT_LOG_PATH = path.join(__dirname, 'audit.log');
var GEMINI_CACHE = null;
var GEMINI_CACHE_TIME = 0;
var GEMINI_CACHE_TTL = 5 * 60 * 1000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log('[' + ts + '] ' + msg);
}

function audit(action, ip, details) {
  var ts = new Date().toISOString();
  var line = ts + ' | IP: ' + ip + ' | ' + action + (details ? ' | ' + details : '');
  fs.appendFile(AUDIT_LOG_PATH, line + '\n', function (err) {
    if (err) log('Audit write error: ' + err.message);
  });
  log(line);
}

function success(data, source, warnings) {
  return { success: true, source: source || 'unknown', warnings: warnings || [], data: data };
}

function fail(msg, fallback) {
  return { success: false, message: msg, fallback_used: !!fallback };
}

// ===== AUTH MIDDLEWARE =====
function requireDashboardAccess(req, res, next) {
  if (!DASHBOARD_TOKEN) return next();
  var authHeader = req.headers.authorization || '';
  var token = authHeader.replace('Bearer ', '');
  if (token !== DASHBOARD_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized — invalid or missing dashboard token' });
  }
  next();
}

function generateId() {
  return 'RJT-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100);
}

function randomDate(startDays, endDays) {
  var d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * (endDays - startDays + 1) + startDays));
  return d.toISOString().split('T')[0];
}

// ===== RISK SCORING ENGINE =====
function computeRiskScore(record) {
  var score = 10;
  var reasons = [];
  var cost = Number(record.cost) || 0;
  if (cost > 100000) { score += 30; reasons.push('Cost > SAR 100K'); }
  else if (cost > 50000) { score += 25; reasons.push('Cost > SAR 50K'); }
  else if (cost > 20000) { score += 20; reasons.push('Cost > SAR 20K'); }
  else if (cost > 10000) { score += 15; reasons.push('Cost > SAR 10K'); }
  else if (cost > 5000) { score += 10; reasons.push('Cost > SAR 5K'); }
  else if (cost > 1000) { score += 5; reasons.push('Cost > SAR 1K'); }
  var qty = Number(record.quantity) || 0;
  if (qty > 1000) score += 10;
  else if (qty > 500) score += 7;
  else if (qty > 100) score += 4;
  else if (qty > 10) score += 2;
  var days = Number(record.days_pending) || 0;
  if (days > 25) { score += 20; reasons.push('Pending > 25 days'); }
  else if (days > 20) { score += 15; reasons.push('Pending > 20 days'); }
  else if (days > 15) { score += 10; reasons.push('Pending > 15 days'); }
  else if (days > 10) { score += 5; reasons.push('Pending > 10 days'); }
  else if (days > 5) score += 3;
  if (record.destruction_status === 'Pending' && record.approval_status !== 'Approved') {
    score += 10; reasons.push('Destruction pending');
  }
  if (record.has_life_risk) { score += 15; reasons.push('Expiry/life risk'); }
  if (record.is_repeated_rc) { score += 10; reasons.push('Repeated root cause'); }
  var highRiskDepts = ['Warehouse', 'QC'];
  if (highRiskDepts.indexOf(record.department) !== -1) { score += 5; reasons.push('High-risk department'); }
  if (record.finance_review_required) score += 5;
  score = Math.min(100, Math.max(1, score));
  return { score: score, reasons: reasons };
}

function riskLevel(score) {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

// ===== FOCUS ERP API INTEGRATION =====
async function fetchRejectDataFromFocus() {
  if (FOCUS_API_URL && FOCUS_API_TOKEN) {
    try {
      log('Attempting to fetch data from Focus ERP API: ' + FOCUS_API_URL);
      var response = await fetch(FOCUS_API_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + FOCUS_API_TOKEN, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Focus API error: ' + response.status);
      var data = await response.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.records)) return data.records;
      throw new Error('Focus API response format is not valid');
    } catch (error) {
      log('Focus API failed: ' + error.message + '. Falling back to Excel/demo data.');
    }
  }
  return null;
}

// ===== EXCEL READING =====
function readExcelData() {
  try {
    if (!fs.existsSync(EXCEL_PATH)) {
      log('Excel file not found at: ' + EXCEL_PATH);
      return null;
    }
    var XLSX = require('xlsx');
    var wb = XLSX.readFile(EXCEL_PATH);
    var sheetName = wb.SheetNames[0];
    var ws = wb.Sheets[sheetName];
    var raw = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });
    var headerRow = -1;
    for (var i = 0; i < raw.length; i++) {
      var row = raw[i];
      if (row && row[0] === 'Item Code' && row[1] === 'Item Name') { headerRow = i; break; }
    }
    if (headerRow === -1) { log('Could not find header row in Excel'); return null; }
    var rows = raw.slice(headerRow + 1).filter(function (r) { return r[0] && String(r[0]).trim() !== ''; });
    log('Excel loaded: ' + rows.length + ' data rows from sheet "' + sheetName + '"');
    var departments = ['Warehouse', 'Production', 'QC'];
    var reasons = [
      'Material expired before use', 'Colour variation outside specification',
      'Injection defect during moulding', 'QC sample failed specification test',
      'Packaging damaged during storage', 'Material degradation due to prolonged storage',
      'Leakage test failure at connection joint', 'Viscosity specification failure',
      'Label misprint \u2013 incorrect lot number', 'Wall thickness below minimum specification',
      'Adhesive strength below specification limit', 'Contamination during sampling procedure',
      'Extrusion thickness outside tolerance range', 'Material contamination during incoming inspection',
      'Shelf life projection below minimum requirement'
    ];
    var rootCauses = [
      { cause: 'Raw material quality deviation', prob: 0.2 },
      { cause: 'Inventory rotation failure', prob: 0.15 },
      { cause: 'Supplier batch inconsistency', prob: 0.15 },
      { cause: 'Production process deviation', prob: 0.15 },
      { cause: 'Storage condition non-compliance', prob: 0.12 },
      { cause: 'Mould temperature deviation', prob: 0.08 },
      { cause: 'Supplier contamination issue', prob: 0.08 },
      { cause: 'Printing/setup error', prob: 0.07 }
    ];
    var approvalStatuses = ['Pending', 'Pending', 'Pending', 'Approved', 'Review'];
    var records = [];
    var validRows = [];
    rows.forEach(function (r) {
      var itemCode = String(r[0] || '').trim();
      var itemName = String(r[1] || '').trim();
      if (itemCode && itemName) validRows.push(r);
    });
    var sampleSize = Math.min(25, validRows.length);
    var shuffled = validRows.sort(function () { return 0.5 - Math.random(); });
    var selected = shuffled.slice(0, sampleSize);
    selected.forEach(function (r) {
      var itemCode = String(r[0] || '').trim();
      var itemName = String(r[1] || '').trim();
      var batchNo = String(r[2] || '').trim();
      var quantity = Number(r[4]) || Math.floor(Math.random() * 500) + 10;
      var rate = Number(r[5]) || 0;
      var stockValue = Number(r[6]) || 0;
      var lifeYears = String(r[8] || '').trim();
      var hasLifeRisk = lifeYears !== '' && Number(lifeYears) < 2;
      var dept = departments[Math.floor(Math.random() * departments.length)];
      var reason = reasons[Math.floor(Math.random() * reasons.length)];
      var daysPending = Math.floor(Math.random() * 30) + 1;
      var cost = stockValue > 0 ? stockValue : (quantity * rate);
      if (cost < 100) cost = Math.floor(Math.random() * 5000) + 500;
      var rcRoll = Math.random();
      var cumulative = 0;
      var chosenRC = 'Production process deviation';
      for (var j = 0; j < rootCauses.length; j++) {
        cumulative += rootCauses[j].prob;
        if (rcRoll <= cumulative) { chosenRC = rootCauses[j].cause; break; }
      }
      if (hasLifeRisk) chosenRC = 'Inventory rotation failure';
      var appStatus = daysPending > 20 ? 'Pending' : approvalStatuses[Math.floor(Math.random() * approvalStatuses.length)];
      var destStatus = appStatus === 'Approved' ? (Math.random() > 0.5 ? 'Scheduled' : 'Destroyed') : 'Pending';
      var record = {
        doc_no: generateId(), date: randomDate(1, 45), department: dept,
        focus_view: itemName.substring(0, 30), item_code: itemCode,
        item_name: itemName, lot_no: batchNo, quantity: Math.round(quantity),
        cost: Math.round(cost * 100) / 100, reason: reason,
        approval_status: appStatus, days_pending: daysPending,
        destruction_status: destStatus, root_cause: chosenRC,
        has_life_risk: hasLifeRisk, capa_required: false,
        finance_review_required: cost >= 5000,
        data_note: 'Generated from Excel item master data'
      };
      var riskResult = computeRiskScore(record);
      record.risk_score = riskResult.score;
      record.risk_level = riskLevel(riskResult.score);
      record.risk_factors = riskResult.reasons;
      record.capa_required = record.risk_score >= 70;
      records.push(record);
    });
    return records;
  } catch (err) {
    log('Excel read error: ' + err.message);
    return null;
  }
}

// ===== DEMO DATA =====
function getDemoData() {
  var demoRejects = [
    { doc_no: 'RJT-2026-001', date: '2026-04-10', department: 'Warehouse', focus_view: 'Sponge Tape', item_code: 'T-011-4500', item_name: 'Sponge Tape \u2013 Color Change', lot_no: '2404A', quantity: 500, cost: 12500, reason: 'Color variation outside specification limit', approval_status: 'Pending', days_pending: 12, destruction_status: 'Pending', root_cause: 'Raw material pigment inconsistency', risk_score: 72, risk_level: 'High', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-002', date: '2026-04-08', department: 'Warehouse', focus_view: 'Raw Material A', item_code: 'RM-101-001', item_name: 'Resin A \u2013 Raw Material', lot_no: 'RM-2309', quantity: 200, cost: 45000, reason: 'Material expired before use', approval_status: 'Pending', days_pending: 18, destruction_status: 'Pending', root_cause: 'Inventory rotation failure', risk_score: 88, risk_level: 'Critical', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-003', date: '2026-04-05', department: 'Production', focus_view: 'Injection Molding', item_code: 'P-201-003', item_name: 'Syringe Barrel 5ml', lot_no: '2503B', quantity: 1200, cost: 8400, reason: 'Injection defect \u2013 flash on barrel edge', approval_status: 'Review', days_pending: 8, destruction_status: 'Pending', root_cause: 'Mold temperature deviation', risk_score: 55, risk_level: 'Medium', capa_required: false, finance_review_required: false },
    { doc_no: 'RJT-2026-004', date: '2026-04-03', department: 'QC', focus_view: 'QC Sample', item_code: 'QC-REF-022', item_name: 'Sterility Test Sample Batch', lot_no: '2503S', quantity: 50, cost: 3200, reason: 'QC sample failed bioburden test', approval_status: 'Pending', days_pending: 15, destruction_status: 'Pending', root_cause: 'Contamination during sampling', risk_score: 82, risk_level: 'High', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-005', date: '2026-04-01', department: 'Warehouse', focus_view: 'Finished Goods', item_code: 'FG-301-010', item_name: 'Surgical Gloves Box 100', lot_no: '2601G', quantity: 300, cost: 18000, reason: 'Packaging damaged during storage', approval_status: 'Approved', days_pending: 0, destruction_status: 'Pending', root_cause: 'Improper stacking in warehouse', risk_score: 60, risk_level: 'Medium', capa_required: false, finance_review_required: true },
    { doc_no: 'RJT-2026-006', date: '2026-03-28', department: 'Warehouse', focus_view: 'Resin B', item_code: 'RM-102-002', item_name: 'Resin B \u2013 Base Polymer', lot_no: 'RM-2401', quantity: 800, cost: 96000, reason: 'Resin degradation due to prolonged storage', approval_status: 'Pending', days_pending: 22, destruction_status: 'Pending', root_cause: 'Storage condition exceeded temperature limit', risk_score: 92, risk_level: 'Critical', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-007', date: '2026-03-25', department: 'Production', focus_view: 'Assembly Line', item_code: 'P-202-004', item_name: 'IV Set Tubing 1.8m', lot_no: '2602T', quantity: 1500, cost: 11250, reason: 'Leakage test failure at connection joint', approval_status: 'Approved', days_pending: 0, destruction_status: 'Scheduled', root_cause: 'Supplier joint ring defect', risk_score: 48, risk_level: 'Medium', capa_required: false, finance_review_required: false },
    { doc_no: 'RJT-2026-008', date: '2026-03-22', department: 'QC', focus_view: 'Raw Material B', item_code: 'RM-201-003', item_name: 'Plasticizer DOP', lot_no: 'DOP-2312', quantity: 100, cost: 7800, reason: 'Material failed viscosity specification', approval_status: 'Pending', days_pending: 25, destruction_status: 'Pending', root_cause: 'Supplier batch deviation', risk_score: 78, risk_level: 'High', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-009', date: '2026-03-20', department: 'Warehouse', focus_view: 'Label Stock', item_code: 'PK-001-005', item_name: 'Printed Label Roll', lot_no: 'LBL-2601', quantity: 2000, cost: 2400, reason: 'Label misprint \u2013 incorrect lot number', approval_status: 'Pending', days_pending: 10, destruction_status: 'Pending', root_cause: 'Printing setup error', risk_score: 35, risk_level: 'Low', capa_required: false, finance_review_required: false },
    { doc_no: 'RJT-2026-010', date: '2026-03-18', department: 'Production', focus_view: 'Blow Molding', item_code: 'P-203-006', item_name: 'Bottle 250ml HDPE', lot_no: '2601H', quantity: 600, cost: 3600, reason: 'Wall thickness below minimum spec', approval_status: 'Review', days_pending: 6, destruction_status: 'Destroyed', root_cause: 'Blow molding pressure fluctuation', risk_score: 42, risk_level: 'Medium', capa_required: false, finance_review_required: false },
    { doc_no: 'RJT-2026-011', date: '2026-03-15', department: 'Warehouse', focus_view: 'Adhesive Tape', item_code: 'T-012-4600', item_name: 'Double-sided Tape 12mm', lot_no: '2412C', quantity: 350, cost: 5250, reason: 'Adhesive strength below spec', approval_status: 'Pending', days_pending: 28, destruction_status: 'Pending', root_cause: 'Raw material formulation error', risk_score: 85, risk_level: 'Critical', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-012', date: '2026-03-12', department: 'QC', focus_view: 'Environmental', item_code: 'QC-ENV-001', item_name: 'Clean Room Air Sample', lot_no: 'CR-2603', quantity: 10, cost: 1800, reason: 'Air particle count exceeded Class B limit', approval_status: 'Pending', days_pending: 20, destruction_status: 'Pending', root_cause: 'HVAC filter replacement overdue', risk_score: 90, risk_level: 'Critical', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-013', date: '2026-03-10', department: 'Production', focus_view: 'Semi-Finished', item_code: 'SF-401-002', item_name: 'Semi-Finished Tubing Roll', lot_no: '2601SF', quantity: 400, cost: 22000, reason: 'Extrusion thickness outside tolerance', approval_status: 'Pending', days_pending: 14, destruction_status: 'Pending', root_cause: 'Extruder calibration drift', risk_score: 76, risk_level: 'High', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-014', date: '2026-03-08', department: 'Warehouse', focus_view: 'Raw Material C', item_code: 'RM-301-004', item_name: 'PVC Compound Granules', lot_no: 'PVC-2406', quantity: 500, cost: 32500, reason: 'Material contamination detected during incoming inspection', approval_status: 'Pending', days_pending: 16, destruction_status: 'Pending', root_cause: 'Supplier contamination issue', risk_score: 80, risk_level: 'High', capa_required: true, finance_review_required: true },
    { doc_no: 'RJT-2026-015', date: '2026-03-05', department: 'QC', focus_view: 'Stability Test', item_code: 'QC-STB-003', item_name: 'Accelerated Stability Sample', lot_no: 'STB-2601', quantity: 30, cost: 4500, reason: 'Shelf life projection below minimum requirement', approval_status: 'Review', days_pending: 5, destruction_status: 'Pending', root_cause: 'Formulation stability concern', risk_score: 65, risk_level: 'Medium', capa_required: false, finance_review_required: false }
  ];
  demoRejects.forEach(function (r) {
    var result = computeRiskScore(r);
    r.risk_score = result.score;
    r.risk_level = riskLevel(result.score);
    r.risk_factors = result.reasons;
    r.capa_required = r.risk_score >= 70;
  });
  return demoRejects;
}

// ===== DATA SOURCE =====
var cachedRejects = null;
var cachedSource = 'demo';
var cachedWarnings = [];

function getRejects(sourceOverride) {
  if (sourceOverride === 'excel') {
    var excelData = readExcelData();
    if (excelData) { cachedRejects = excelData; cachedSource = 'excel'; cachedWarnings = ['Data generated from Excel item master \u2014 reject records are estimated from available item fields']; return excelData; }
    return null;
  }
  if (sourceOverride === 'demo') {
    cachedRejects = getDemoData(); cachedSource = 'demo'; cachedWarnings = []; return cachedRejects;
  }
  if (sourceOverride === 'focus') {
    // Force reload from Focus API
    cachedRejects = null;
  }
  if (cachedRejects) return cachedRejects;

  // Try Focus API first if configured
  if (FOCUS_API_URL && FOCUS_API_TOKEN) {
    // Note: Focus fetch is async but this is called synchronously in many places.
    // The actual async integration happens in the /api/ai-analysis and /api/run-analysis endpoints.
    // For synchronous endpoints, the Focus data is loaded once and cached.
    log('Focus API is configured. Use ?source=focus to trigger refresh.');
  }

  var excelData = readExcelData();
  if (excelData) { cachedRejects = excelData; cachedSource = 'excel'; cachedWarnings = ['Data generated from Excel item master \u2014 reject records are estimated from available item fields']; return excelData; }
  cachedRejects = getDemoData(); cachedSource = 'demo'; cachedWarnings = []; return cachedRejects;
}

function filterRejects(rejects, query) {
  if (!query || Object.keys(query).length === 0) return rejects;
  return rejects.filter(function (r) {
    if (query.department) {
      var depts = query.department.split(',');
      if (depts.indexOf(r.department) === -1) return false;
    }
    if (query.risk_level) {
      var levels = query.risk_level.split(',');
      if (levels.indexOf(r.risk_level) === -1) return false;
    }
    if (query.status) {
      var statuses = query.status.split(',');
      if (statuses.indexOf(r.approval_status) === -1) return false;
    }
    if (query.from_date && r.date < query.from_date) return false;
    if (query.to_date && r.date > query.to_date) return false;
    if (query.search) {
      var s = query.search.toLowerCase();
      var match = (r.item_name && r.item_name.toLowerCase().indexOf(s) !== -1) ||
                  (r.doc_no && r.doc_no.toLowerCase().indexOf(s) !== -1) ||
                  (r.reason && r.reason.toLowerCase().indexOf(s) !== -1);
      if (!match) return false;
    }
    return true;
  });
}

// ===== LOCAL ANALYSIS ENGINE =====
function computeAnalysis(rejects) {
  var total = rejects.length;
  var totalCost = 0;
  var highRisk = 0;
  var rcMap = {};
  var deptCost = {};
  var itemCostMap = {};
  var pendingApprovals = [];
  var pendingDestruction = [];

  rejects.forEach(function (r) {
    var cost = Number(r.cost) || 0;
    totalCost += cost;
    if (Number(r.risk_score) >= 70) highRisk++;
    var rc = r.root_cause || 'Unknown';
    rcMap[rc] = (rcMap[rc] || 0) + 1;
    var dept = r.department || 'Unknown';
    deptCost[dept] = (deptCost[dept] || 0) + cost;
    var itemName = r.item_name || 'Unknown';
    itemCostMap[itemName] = (itemCostMap[itemName] || 0) + cost;
    if (r.approval_status === 'Pending') pendingApprovals.push(r);
    if (r.destruction_status === 'Pending' && r.approval_status !== 'Approved') pendingDestruction.push(r);
  });

  var sortedRC = Object.keys(rcMap).sort(function (a, b) { return rcMap[b] - rcMap[a]; });
  var repeatedRC = sortedRC.slice(0, 5).map(function (c) {
    return { cause: c, count: rcMap[c], percentage: Math.round((rcMap[c] / (total || 1)) * 1000) / 10 };
  });

  var deptArr = Object.keys(deptCost).map(function (d) {
    return { department: d, cost: deptCost[d], percentage: totalCost > 0 ? Math.round((deptCost[d] / totalCost) * 1000) / 10 : 0 };
  }).sort(function (a, b) { return b.cost - a.cost; });

  // Anomaly detection: find items with unusually high cost contribution
  var avgItemCost = totalCost / Math.max(1, Object.keys(itemCostMap).length);
  var anomalies = Object.keys(itemCostMap).filter(function (item) {
    return itemCostMap[item] > avgItemCost * 3 && itemCostMap[item] >= 10000;
  }).map(function (item) {
    var items = rejects.filter(function (r) { return r.item_name === item; });
    var totalQty = items.reduce(function (s, r) { return s + (Number(r.quantity) || 0); }, 0);
    var totalRejCost = items.reduce(function (s, r) { return s + (Number(r.cost) || 0); }, 0);
    var pctOfTotal = totalCost > 0 ? Math.round((totalRejCost / totalCost) * 100) : 0;
    return {
      item: item,
      total_cost: totalRejCost,
      total_quantity: totalQty,
      case_count: items.length,
      percentage_of_total: pctOfTotal,
      alert: item + ' represents ' + pctOfTotal + '% of total reject cost (SAR ' + totalRejCost.toLocaleString() + '). Immediate investigation recommended.'
    };
  }).sort(function (a, b) { return b.total_cost - a.total_cost; });

  // Predictive cost: simple linear projection
  var dateRange = rejects.reduce(function (acc, r) {
    if (r.date) {
      if (!acc.min || r.date < acc.min) acc.min = r.date;
      if (!acc.max || r.date > acc.max) acc.max = r.date;
    }
    return acc;
  }, { min: null, max: null });
  var daysSpan = 30;
  if (dateRange.min && dateRange.max) {
    var d1 = new Date(dateRange.min);
    var d2 = new Date(dateRange.max);
    daysSpan = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  }
  var dailyAvgCost = totalCost / daysSpan;
  var projectedNextMonth = Math.round(dailyAvgCost * 30);

  var financeAlerts = rejects.filter(function (r) {
    return r.finance_review_required && Number(r.cost) >= 5000;
  }).sort(function (a, b) { return Number(b.cost) - Number(a.cost); }).slice(0, 7).map(function (r) {
    return {
      item: r.item_name, cost: Number(r.cost) || 0,
      risk: r.risk_level || 'Medium',
      recommendation: Number(r.cost) >= 20000 ? 'Requires Finance Director review before destruction' : 'Review financial impact before destruction approval'
    };
  });

  var capaSugs = rejects.filter(function (r) { return r.capa_required; }).slice(0, 6).map(function (r) {
    return {
      title: r.root_cause || 'Investigation required',
      description: 'Root cause identified for ' + r.item_name + ' (Lot: ' + (r.lot_no || '\u2014') + ') requires corrective and preventive action. ' + (r.reason || ''),
      priority: r.risk_level || 'Medium',
      department: r.department || '\u2014'
    };
  });

  var destroyBacklog = pendingDestruction.slice(0, 5).map(function (r) {
    return { item: r.item_name, days_pending: Number(r.days_pending) || 0, quantity: Number(r.quantity) || 0, cost: Number(r.cost) || 0 };
  }).sort(function (a, b) { return b.days_pending - a.days_pending; });

  var delayAlerts = rejects.filter(function (r) {
    return Number(r.days_pending) >= 15;
  }).slice(0, 5).map(function (r) {
    return { item: r.item_name, days_pending: Number(r.days_pending) || 0, department: r.department || '\u2014' };
  }).sort(function (a, b) { return b.days_pending - a.days_pending; });

  var topRC = repeatedRC.length > 0 ? repeatedRC[0].cause : 'None identified';
  var topDept = deptArr.length > 0 ? deptArr[0] : null;
  var avgDelay = pendingApprovals.length > 0
    ? Math.round(pendingApprovals.reduce(function (s, r) { return s + (Number(r.days_pending) || 0); }, 0) / pendingApprovals.length)
    : 0;
  var totalDestCost = pendingDestruction.reduce(function (s, r) { return s + (Number(r.cost) || 0); }, 0);

  var execSummary = 'Analysis of ' + total + ' reject cases shows a total estimated cost of SAR ' +
    totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 }) +
    '. There are ' + highRisk + ' high or critical risk cases requiring management attention. ' +
    'The most frequent root cause is "' + topRC + '". ' +
    (topDept ? 'The ' + topDept.department + ' department accounts for the highest cost at SAR ' + topDept.cost.toLocaleString() + ' (' + topDept.percentage + '% of total). ' : '') +
    'Average approval delay is ' + avgDelay + ' days across ' + pendingApprovals.length + ' pending cases. ' +
    (destroyBacklog.length > 0 ? destroyBacklog.length + ' cases are pending destruction with a total cost impact of SAR ' + totalDestCost.toLocaleString() + '. ' : '') +
    'Projected reject cost for next month: SAR ' + projectedNextMonth.toLocaleString() + '. ' +
    (anomalies.length > 0 ? anomalies.length + ' anomaly pattern(s) detected requiring investigation. ' : '') +
    'Focus ERP remains the source of truth. AI analysis is advisory and requires QCM/QAM review.';

  return {
    executive_summary: execSummary,
    overall_risk_level: highRisk >= 4 ? 'High' : (highRisk >= 2 ? 'Medium' : 'Low'),
    total_cases: total,
    total_estimated_cost: Math.round(totalCost * 100) / 100,
    high_risk_cases: highRisk,
    repeated_root_causes: repeatedRC,
    cost_by_department: deptArr,
    finance_alerts: financeAlerts,
    capa_suggestions: capaSugs,
    destruction_backlog_alerts: destroyBacklog,
    approval_delay_alerts: delayAlerts,
    anomalies: anomalies,
    projected_next_month_cost: projectedNextMonth,
    predictive_confidence: daysSpan >= 20 ? 'Medium' : 'Low',
    management_actions: [
      { action: 'Review ' + highRisk + ' high/critical risk cases requiring immediate attention', priority: 'Critical' },
      { action: 'Process ' + pendingDestruction.length + ' pending destruction cases with total cost impact of SAR ' + totalDestCost.toLocaleString(), priority: 'Critical' },
      { action: 'Address approval delays averaging ' + avgDelay + ' days \u2014 ' + pendingApprovals.length + ' cases pending', priority: 'High' },
      { action: 'Assign CAPA owner for top root cause: "' + topRC + '"', priority: 'High' },
      { action: 'Schedule management review of high-value financial impact cases exceeding SAR 20,000', priority: 'Medium' }
    ]
  };
}

// ===== GEMINI API CALL (Structured Outputs with JSON Schema) =====
async function callGemini(rejects) {
  if (!GEMINI_API_KEY) { log('Gemini API key not configured. Using simulated analysis.'); return null; }
  try {
    var minimized = rejects.map(function (r) {
      return { doc: r.doc_no, dept: r.department, item: r.item_name, reason: r.reason, days: r.days_pending, cost: r.cost, status: r.approval_status, destruction: r.destruction_status, root_cause: r.root_cause, risk: r.risk_score };
    });

    var prompt = 'You are an AI quality analytics assistant for a medical products factory in Saudi Arabia.\n' +
      'Analyze the following rejected stock data from Focus ERP.\n\n' +
      'Important rules:\n' +
      '- Focus ERP is the official source of truth.\n' +
      '- AI output is advisory only.\n' +
      '- Do not approve or reject anything.\n' +
      '- Identify risks, repeated root causes, financial exposure, approval delay, destruction backlog, and anomaly patterns.\n' +
      '- Return the result in the exact JSON schema specified.\n\n' +
      'Reject data:\n' + JSON.stringify(minimized, null, 2);

    var schema = {
      type: 'object',
      properties: {
        executive_summary: { type: 'string' },
        overall_risk_level: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
        total_cases: { type: 'integer' },
        total_estimated_cost: { type: 'number' },
        high_risk_cases: { type: 'integer' },
        repeated_root_causes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              count: { type: 'integer' },
              percentage: { type: 'number' }
            },
            required: ['cause', 'count', 'percentage']
          }
        },
        cost_by_department: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              department: { type: 'string' },
              cost: { type: 'number' },
              percentage: { type: 'number' }
            },
            required: ['department', 'cost', 'percentage']
          }
        },
        finance_alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              cost: { type: 'number' },
              risk: { type: 'string' },
              recommendation: { type: 'string' }
            },
            required: ['item', 'cost', 'risk', 'recommendation']
          }
        },
        capa_suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              department: { type: 'string' }
            },
            required: ['title', 'description', 'priority', 'department']
          }
        },
        destruction_backlog_alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              days_pending: { type: 'integer' },
              quantity: { type: 'integer' },
              cost: { type: 'number' }
            },
            required: ['item', 'days_pending', 'quantity', 'cost']
          }
        },
        approval_delay_alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              days_pending: { type: 'integer' },
              department: { type: 'string' }
            },
            required: ['item', 'days_pending', 'department']
          }
        },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              total_cost: { type: 'number' },
              case_count: { type: 'integer' },
              percentage_of_total: { type: 'number' },
              alert: { type: 'string' }
            },
            required: ['item', 'total_cost', 'case_count', 'percentage_of_total', 'alert']
          }
        },
        projected_next_month_cost: { type: 'number' },
        predictive_confidence: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        management_actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] }
            },
            required: ['action', 'priority']
          }
        }
      },
      required: [
        'executive_summary', 'overall_risk_level', 'total_cases',
        'total_estimated_cost', 'high_risk_cases', 'repeated_root_causes',
        'cost_by_department', 'finance_alerts', 'capa_suggestions',
        'destruction_backlog_alerts', 'approval_delay_alerts', 'anomalies',
        'projected_next_month_cost', 'predictive_confidence', 'management_actions'
      ]
    };

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';

    log('Calling Gemini API with model ' + GEMINI_MODEL + ' (Structured Outputs)...');
    var response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      var errorText = await response.text();
      throw new Error('Gemini API error: ' + response.status + ' - ' + errorText);
    }

    var data = await response.json();
    var text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('Gemini response is empty');

    var json = JSON.parse(text);
    log('Gemini analysis completed successfully via Structured Outputs.');
    return json;
  } catch (err) {
    log('Gemini API error: ' + err.message);
    return null;
  }
}

// ===== API ROUTES =====

app.post('/api/login', function (req, res) {
  var token = req.body && req.body.token;
  if (!DASHBOARD_TOKEN) {
    return res.json({ success: true, message: 'Auth disabled (no DASHBOARD_TOKEN configured)' });
  }
  if (token === DASHBOARD_TOKEN) {
    audit('LOGIN_SUCCESS', req.ip);
    return res.json({ success: true, message: 'Login successful' });
  }
  audit('LOGIN_FAILED', req.ip, 'Invalid token');
  return res.status(401).json({ success: false, message: 'Invalid token' });
});

app.get('/api/health', function (req, res) {
  res.json(success({
    status: 'ok',
    source: cachedSource,
    gemini_configured: !!GEMINI_API_KEY,
    gemini_model: GEMINI_MODEL,
    auth_required: !!DASHBOARD_TOKEN,
    excel_path: EXCEL_PATH,
    excel_exists: fs.existsSync(EXCEL_PATH),
    focus_api_configured: !!(FOCUS_API_URL && FOCUS_API_TOKEN),
    timestamp: new Date().toISOString()
  }, cachedSource));
});

app.get('/api/rejects', requireDashboardAccess, function (req, res) {
  try {
    var source = req.query.source || null;
    var data = source ? getRejects(source) : getRejects();
    var filtered = filterRejects(data, req.query);
    audit('FETCH_REJECTS', req.ip, filtered.length + ' records (filtered)');
    res.json(success({
      count: filtered.length,
      total_count: data.length,
      data_note: cachedSource === 'excel' ? 'Reject records generated from Excel item master data' : 'Prepared demo reject records',
      rejects: filtered,
      filters_applied: !!(req.query.department || req.query.risk_level || req.query.status || req.query.from_date || req.query.to_date || req.query.search),
      warnings: cachedWarnings
    }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/summary', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var filtered = filterRejects(data, req.query);
    var analysis = computeAnalysis(filtered);
    audit('FETCH_SUMMARY', req.ip, filtered.length + ' records analyzed');
    res.json(success({ analysis: analysis }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/root-causes', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({ root_causes: analysis.repeated_root_causes }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/capa-suggestions', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({ capa_suggestions: analysis.capa_suggestions }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/finance-alerts', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({ finance_alerts: analysis.finance_alerts }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/anomalies', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var analysis = computeAnalysis(data);
    audit('FETCH_ANOMALIES', req.ip, (analysis.anomalies || []).length + ' anomalies found');
    res.json(success({ anomalies: analysis.anomalies || [] }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/ai-analysis', requireDashboardAccess, async function (req, res) {
  try {
    // Try Focus API first if configured
    var data = null;
    if (FOCUS_API_URL && FOCUS_API_TOKEN) {
      var focusData = await fetchRejectDataFromFocus();
      if (focusData && focusData.length) {
        data = focusData;
        cachedRejects = data;
        cachedSource = 'focus';
        cachedWarnings = [];
      }
    }
    if (!data) data = getRejects();
    var now = Date.now();
    if (GEMINI_CACHE && (now - GEMINI_CACHE_TIME) < GEMINI_CACHE_TTL) {
      audit('FETCH_AI_ANALYSIS_CACHED', req.ip);
      return res.json(success({
        records: data,
        analysis: GEMINI_CACHE,
        cached: true,
        cache_age_seconds: Math.round((now - GEMINI_CACHE_TIME) / 1000)
      }, 'gemini-cached', cachedWarnings));
    }
    var analysis = null;
    var geminiUsed = false;
    if (GEMINI_API_KEY) {
      analysis = await callGemini(data);
      if (analysis) {
        geminiUsed = true;
        GEMINI_CACHE = analysis;
        GEMINI_CACHE_TIME = Date.now();
        var localAnalysis = computeAnalysis(data);
        if (!analysis.management_actions || !analysis.management_actions.length) analysis.management_actions = localAnalysis.management_actions;
        if (!analysis.cost_by_department) analysis.cost_by_department = localAnalysis.cost_by_department;
        if (!analysis.anomalies) analysis.anomalies = localAnalysis.anomalies;
        if (!analysis.projected_next_month_cost) analysis.projected_next_month_cost = localAnalysis.projected_next_month_cost;
      }
    }
    if (!analysis) {
      analysis = computeAnalysis(data);
    }
    audit('FETCH_AI_ANALYSIS', req.ip, (geminiUsed ? 'Gemini' : 'Local') + ' analysis');
    res.json(success({
      records: data,
      analysis: analysis,
      gemini_used: geminiUsed,
      ai_note: 'AI recommendations are advisory only and do not replace formal approvals.'
    }, geminiUsed ? 'gemini' : cachedSource, geminiUsed ? [] : cachedWarnings));
  } catch (err) {
    log('AI analysis error: ' + err.message);
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({
      records: data,
      analysis: analysis,
      gemini_used: false,
      error: err.message
    }, 'local-fallback', ['Analysis error occurred, fallback to local simulation: ' + err.message]));
  }
});

app.post('/api/run-analysis', requireDashboardAccess, async function (req, res) {
  try {
    // Try Focus API first if configured
    var data = null;
    if (FOCUS_API_URL && FOCUS_API_TOKEN) {
      var focusData = await fetchRejectDataFromFocus();
      if (focusData && focusData.length) {
        data = focusData;
        cachedRejects = data;
        cachedSource = 'focus';
        cachedWarnings = [];
      }
    }
    if (!data) data = getRejects();
    var analysis = null;
    var geminiUsed = false;
    if (GEMINI_API_KEY) {
      analysis = await callGemini(data);
      if (analysis) {
        geminiUsed = true;
        GEMINI_CACHE = analysis;
        GEMINI_CACHE_TIME = Date.now();
        var localAnalysis = computeAnalysis(data);
        if (!analysis.management_actions || !analysis.management_actions.length) analysis.management_actions = localAnalysis.management_actions;
        if (!analysis.cost_by_department) analysis.cost_by_department = localAnalysis.cost_by_department;
        if (!analysis.anomalies) analysis.anomalies = localAnalysis.anomalies;
        if (!analysis.projected_next_month_cost) analysis.projected_next_month_cost = localAnalysis.projected_next_month_cost;
      }
    }
    if (!analysis) analysis = computeAnalysis(data);
    audit('RUN_ANALYSIS', req.ip, (geminiUsed ? 'Gemini' : 'Local') + ' analysis');
    res.json(success({
      gemini_used: geminiUsed,
      analysis: analysis
    }, geminiUsed ? 'gemini' : cachedSource, geminiUsed ? [] : cachedWarnings));
    log('Analysis completed. Source: ' + (geminiUsed ? 'Gemini AI' : 'Local simulation'));
  } catch (err) {
    log('Analysis error: ' + err.message);
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({
      gemini_used: false,
      analysis: analysis,
      error: err.message
    }, 'local-fallback', ['Analysis error occurred, fallback to local simulation: ' + err.message]));
  }
});

app.get('/api/audit-log', requireDashboardAccess, function (req, res) {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) return res.json(success({ entries: [] }, 'audit'));
    var content = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
    var lines = content.trim().split('\n').filter(Boolean).reverse().slice(0, 100);
    var entries = lines.map(function (line) {
      var parts = line.split(' | ');
      return { timestamp: parts[0] || '', ip: parts[1] || '', action: parts[2] || '', details: parts[3] || '' };
    });
    res.json(success({ entries: entries }, 'audit'));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

// ===== START SERVER =====
app.listen(PORT, function () {
  log('');
  log('=================================================================');
  log('  AI Reject Analytics & Management Dashboard');
  log('  Backend Server');
  log('=================================================================');
  log('  Port:        ' + PORT);
  log('  Mode:        ' + (GEMINI_API_KEY ? 'Gemini AI ready (' + GEMINI_MODEL + ')' : 'Simulated AI (no Gemini key)'));
  log('  Auth:        ' + (DASHBOARD_TOKEN ? 'Token-based access control enabled' : 'Disabled (no DASHBOARD_TOKEN)'));
  log('  Focus API:   ' + (FOCUS_API_URL ? 'Configured (' + FOCUS_API_URL + ')' : 'Not configured'));
  log('  Excel path:  ' + EXCEL_PATH);
  log('  Excel file:  ' + (fs.existsSync(EXCEL_PATH) ? 'FOUND' : 'NOT FOUND - will use demo data'));
  log('  Audit log:   ' + AUDIT_LOG_PATH);
  log('  Static dir:  ' + __dirname);
  log('=================================================================');
  log('  Open http://localhost:' + PORT + ' in your browser');
  log('=================================================================');
  log('');

  var data = getRejects();
  log('Data source: ' + cachedSource + ' (' + data.length + ' reject records loaded)');
  if (cachedWarnings.length) { cachedWarnings.forEach(function (w) { log('Warning: ' + w); }); }
});
