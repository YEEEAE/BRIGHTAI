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

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ===== DASHBOARD TOKEN AUTH =====
function requireDashboardAccess(req, res, next) {
  if (!DASHBOARD_TOKEN) { next(); return; }
  var authHeader = req.headers.authorization || '';
  var token = authHeader.replace('Bearer ', '');
  if (token !== DASHBOARD_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized access' });
  }
  next();
}

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log('[' + ts + '] ' + msg);
}

function success(data, source, warnings) {
  return { success: true, source: source || 'unknown', warnings: warnings || [], data: data };
}

function fail(msg, fallback) {
  return { success: false, message: msg, fallback_used: !!fallback };
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

  // Cost impact (0-30 points)
  var cost = Number(record.cost) || 0;
  if (cost > 100000) { score += 30; reasons.push('Cost > SAR 100K'); }
  else if (cost > 50000) { score += 25; reasons.push('Cost > SAR 50K'); }
  else if (cost > 20000) { score += 20; reasons.push('Cost > SAR 20K'); }
  else if (cost > 10000) { score += 15; reasons.push('Cost > SAR 10K'); }
  else if (cost > 5000) { score += 10; reasons.push('Cost > SAR 5K'); }
  else if (cost > 1000) { score += 5; reasons.push('Cost > SAR 1K'); }

  // Quantity impact (0-10 points)
  var qty = Number(record.quantity) || 0;
  if (qty > 1000) score += 10;
  else if (qty > 500) score += 7;
  else if (qty > 100) score += 4;
  else if (qty > 10) score += 2;

  // Days pending (0-20 points)
  var days = Number(record.days_pending) || 0;
  if (days > 25) { score += 20; reasons.push('Pending > 25 days'); }
  else if (days > 20) { score += 15; reasons.push('Pending > 20 days'); }
  else if (days > 15) { score += 10; reasons.push('Pending > 15 days'); }
  else if (days > 10) { score += 5; reasons.push('Pending > 10 days'); }
  else if (days > 5) score += 3;

  // Destruction still pending (0-10 points)
  if (record.destruction_status === 'Pending' && record.approval_status !== 'Approved') {
    score += 10;
    reasons.push('Destruction pending');
  }

  // Expiry / life-year risk (0-15 points)
  if (record.has_life_risk) {
    score += 15;
    reasons.push('Expiry/life risk');
  }

  // Repeated root cause penalty (0-10 points)
  if (record.is_repeated_rc) {
    score += 10;
    reasons.push('Repeated root cause');
  }

  // Department risk factor (0-5 points)
  var highRiskDepts = ['Warehouse', 'QC'];
  if (highRiskDepts.indexOf(record.department) !== -1) {
    score += 5;
    reasons.push('High-risk department');
  }

  // Finance review flag (0-5 points)
  if (record.finance_review_required) {
    score += 5;
  }

  score = Math.min(100, Math.max(1, score));
  return { score: score, reasons: reasons };
}

function riskLevel(score) {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
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
      if (row && row[0] === 'Item Code' && row[1] === 'Item Name') {
        headerRow = i;
        break;
      }
    }

    if (headerRow === -1) {
      log('Could not find header row in Excel');
      return null;
    }

    var rows = raw.slice(headerRow + 1).filter(function (r) {
      return r[0] && String(r[0]).trim() !== '';
    });

    log('Excel loaded: ' + rows.length + ' data rows from sheet "' + sheetName + '"');

    // Build root cause pool based on item characteristics
    var departments = ['Warehouse', 'Production', 'QC'];
    var reasons = [
      'Material expired before use',
      'Colour variation outside specification',
      'Injection defect during moulding',
      'QC sample failed specification test',
      'Packaging damaged during storage',
      'Material degradation due to prolonged storage',
      'Leakage test failure at connection joint',
      'Viscosity specification failure',
      'Label misprint \u2013 incorrect lot number',
      'Wall thickness below minimum specification',
      'Adhesive strength below specification limit',
      'Contamination during sampling procedure',
      'Extrusion thickness outside tolerance range',
      'Material contamination during incoming inspection',
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
    var rowCounter = 0;

    // Collect all valid rows first
    var validRows = [];
    rows.forEach(function (r) {
      var itemCode = String(r[0] || '').trim();
      var itemName = String(r[1] || '').trim();
      if (itemCode && itemName) validRows.push(r);
    });

    // Shuffle and take a representative sample
    var sampleSize = Math.min(25, validRows.length);
    var shuffled = validRows.sort(function () { return 0.5 - Math.random(); });
    var selected = shuffled.slice(0, sampleSize);

    selected.forEach(function (r) {
      var itemCode = String(r[0] || '').trim();
      var itemName = String(r[1] || '').trim();
      var batchNo = String(r[2] || '').trim();
      var uom = String(r[3] || '').trim();
      var quantity = Number(r[4]) || Math.floor(Math.random() * 500) + 10;
      var rate = Number(r[5]) || 0;
      var stockValue = Number(r[6]) || 0;
      var lifeYears = String(r[8] || '').trim();
      var expiryDate = String(r[9] || '').trim();

      var hasLifeRisk = lifeYears !== '' && Number(lifeYears) < 2;
      var dept = departments[Math.floor(Math.random() * departments.length)];
      var reason = reasons[Math.floor(Math.random() * reasons.length)];
      var daysPending = Math.floor(Math.random() * 30) + 1;
      var cost = stockValue > 0 ? stockValue : (quantity * rate);
      if (cost < 100) cost = Math.floor(Math.random() * 5000) + 500;

      // Pick a root cause
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
        doc_no: generateId(),
        date: randomDate(1, 45),
        department: dept,
        focus_view: itemName.substring(0, 30),
        item_code: itemCode,
        item_name: itemName,
        lot_no: batchNo,
        quantity: Math.round(quantity),
        cost: Math.round(cost * 100) / 100,
        reason: reason,
        approval_status: appStatus,
        days_pending: daysPending,
        destruction_status: destStatus,
        root_cause: chosenRC,
        has_life_risk: hasLifeRisk,
        capa_required: false,
        finance_review_required: cost >= 5000,
        data_note: 'Generated from Excel item master data'
      };

      // Compute risk score
      var riskResult = computeRiskScore(record);
      record.risk_score = riskResult.score;
      record.risk_level = riskLevel(riskResult.score);
      record.risk_factors = riskResult.reasons;
      record.capa_required = record.risk_score >= 70;

      records.push(record);
      rowCounter++;
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

  // Apply risk scoring to all demo records
  demoRejects.forEach(function (r) {
    var result = computeRiskScore(r);
    r.risk_score = result.score;
    r.risk_level = riskLevel(result.score);
    r.risk_factors = result.reasons;
    r.capa_required = r.risk_score >= 70;
  });

  return demoRejects;
}

// ===== LOCAL ANALYSIS ENGINE =====
function computeAnalysis(rejects) {
  var total = rejects.length;
  var totalCost = 0;
  var highRisk = 0;
  var rcMap = {};
  var deptCost = {};
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

  var financeAlerts = rejects.filter(function (r) {
    return r.finance_review_required && Number(r.cost) >= 5000;
  }).sort(function (a, b) { return Number(b.cost) - Number(a.cost); }).slice(0, 7).map(function (r) {
    return {
      item: r.item_name,
      cost: Number(r.cost) || 0,
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
    management_actions: [
      { action: 'Review ' + highRisk + ' high/critical risk cases requiring immediate attention', priority: 'Critical' },
      { action: 'Process ' + pendingDestruction.length + ' pending destruction cases with total cost impact of SAR ' + totalDestCost.toLocaleString(), priority: 'Critical' },
      { action: 'Address approval delays averaging ' + avgDelay + ' days \u2014 ' + pendingApprovals.length + ' cases pending', priority: 'High' },
      { action: 'Assign CAPA owner for top root cause: "' + topRC + '"', priority: 'High' },
      { action: 'Schedule management review of high-value financial impact cases exceeding SAR 20,000', priority: 'Medium' }
    ]
  };
}

// ===== GEMINI API CALL =====
async function callGemini(rejects) {
  if (!GEMINI_API_KEY) {
    log('Gemini API key not configured. Using simulated analysis.');
    return null;
  }

  try {
    var genAI = require('@google/generative-ai');
    var GoogleGenerativeAI = genAI.GoogleGenerativeAI;

    var minimized = rejects.map(function (r) {
      return {
        doc: r.doc_no,
        dept: r.department,
        item: r.item_name,
        reason: r.reason,
        days: r.days_pending,
        cost: r.cost,
        status: r.approval_status,
        destruction: r.destruction_status,
        root_cause: r.root_cause,
        risk: r.risk_score
      };
    });

    var promptContent = 'You are an AI quality analyst for a medical products manufacturing factory in Saudi Arabia. ' +
      'Focus ERP is the official source of truth. All AI output is advisory only and requires human review. ' +
      'Analyze the following reject records and return ONLY a valid JSON object (no markdown, no code fences, no explanation) ' +
      'with these exact fields: ' +
      'executive_summary (string, 3-4 sentences), ' +
      'overall_risk_level (Low/Medium/High/Critical), ' +
      'total_cases (number), ' +
      'total_estimated_cost (number), ' +
      'high_risk_cases (number), ' +
      'repeated_root_causes (array of {cause: string, count: number}), ' +
      'finance_alerts (array of {item: string, cost: number, risk: string, recommendation: string}), ' +
      'capa_suggestions (array of {title: string, description: string, priority: string, department: string}), ' +
      'destruction_backlog_alerts (array of {item: string, days_pending: number, quantity: number, cost: number}), ' +
      'approval_delay_alerts (array of {item: string, days_pending: number, department: string}), ' +
      'management_actions (array of {action: string, priority: string}). ' +
      'JSON only. No other text.';

    log('Calling Gemini API with model ' + GEMINI_MODEL + ' (structured output enabled)...');
    var genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
    var model = genAIInstance.getGenerativeModel({ model: GEMINI_MODEL });

    var result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptContent }, { text: JSON.stringify(minimized) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });
    var text = result.response.text();

    var cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```(json)?/gi, '').trim();
    }

    var json = JSON.parse(cleanText);
    log('Gemini analysis completed successfully.');
    return json;
  } catch (err) {
    log('Gemini API error: ' + err.message);
    return null;
  }
}

// ===== DATA SOURCE =====
var cachedRejects = null;
var cachedSource = 'demo';
var cachedWarnings = [];

function getRejects(sourceOverride) {
  if (sourceOverride === 'excel') {
    var excelData = readExcelData();
    if (excelData) {
      cachedRejects = excelData;
      cachedSource = 'excel';
      cachedWarnings = ['Data generated from Excel item master \u2014 reject records are estimated from available item fields'];
      return excelData;
    }
    return null;
  }

  if (sourceOverride === 'demo') {
    cachedRejects = getDemoData();
    cachedSource = 'demo';
    cachedWarnings = [];
    return cachedRejects;
  }

  if (cachedRejects) return cachedRejects;

  var excelData = readExcelData();
  if (excelData) {
    cachedRejects = excelData;
    cachedSource = 'excel';
    cachedWarnings = ['Data generated from Excel item master \u2014 reject records are estimated from available item fields'];
    return excelData;
  }

  cachedRejects = getDemoData();
  cachedSource = 'demo';
  cachedWarnings = [];
  return cachedRejects;
}

// ===== API ROUTES =====

app.get('/api/health', function (req, res) {
  res.json(success({
    status: 'ok',
    source: cachedSource,
    gemini_configured: !!GEMINI_API_KEY,
    gemini_model: GEMINI_MODEL,
    excel_path: EXCEL_PATH,
    excel_exists: fs.existsSync(EXCEL_PATH),
    timestamp: new Date().toISOString()
  }, cachedSource));
});

app.get('/api/rejects', requireDashboardAccess, function (req, res) {
  try {
    var source = req.query.source || null;
    var data = source ? getRejects(source) : getRejects();
    res.json(success({
      count: data.length,
      data_note: cachedSource === 'excel' ? 'Reject records generated from Excel item master data' : 'Prepared demo reject records',
      rejects: data,
      warnings: cachedWarnings
    }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/summary', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({
      analysis: analysis
    }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/root-causes', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({
      root_causes: analysis.repeated_root_causes
    }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/capa-suggestions', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({
      capa_suggestions: analysis.capa_suggestions
    }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.get('/api/finance-alerts', requireDashboardAccess, function (req, res) {
  try {
    var data = getRejects();
    var analysis = computeAnalysis(data);
    res.json(success({
      finance_alerts: analysis.finance_alerts
    }, cachedSource, cachedWarnings));
  } catch (err) {
    res.status(500).json(fail(err.message, true));
  }
});

app.post('/api/run-analysis', requireDashboardAccess, async function (req, res) {
  try {
    var data = getRejects();
    var analysis = null;
    var geminiUsed = false;

    if (GEMINI_API_KEY) {
      analysis = await callGemini(data);
      if (analysis) {
        geminiUsed = true;
        if (!analysis.management_actions || !analysis.management_actions.length) {
          analysis.management_actions = computeAnalysis(data).management_actions;
        }
        if (!analysis.cost_by_department) {
          analysis.cost_by_department = computeAnalysis(data).cost_by_department;
        }
      }
    }

    if (!analysis) {
      analysis = computeAnalysis(data);
    }

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

// ===== START SERVER =====
app.listen(PORT, function () {
  log('');
  log('=================================================================');
  log('  AI Reject Analytics & Management Dashboard');
  log('  Backend Server');
  log('=================================================================');
  log('  Port:        ' + PORT);
  log('  Mode:        ' + (GEMINI_API_KEY ? 'Gemini AI ready (' + GEMINI_MODEL + ')' : 'Simulated AI (no Gemini key)'));
  log('  Excel path:  ' + EXCEL_PATH);
  log('  Excel file:  ' + (fs.existsSync(EXCEL_PATH) ? 'FOUND' : 'NOT FOUND - will use demo data'));
  log('  Static dir:  ' + __dirname);
  log('=================================================================');
  log('  Open http://localhost:' + PORT + ' in your browser');
  log('=================================================================');
  log('');

  var data = getRejects();
  log('Data source: ' + cachedSource + ' (' + data.length + ' reject records loaded)');
  if (cachedWarnings.length) {
    cachedWarnings.forEach(function (w) { log('Warning: ' + w); });
  }
});
