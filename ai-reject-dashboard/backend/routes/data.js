const express = require('express');
const fs = require('fs');
const config = require('../config/env');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../utils/logger');
const { success } = require('../utils/response');
const { getRejects, getDataState, getMetrics } = require('../services/dataService');
const { loadExcelData, getDataStatus, getRecentChanges } = require('../services/excelService');
const { invalidateAiCache } = require('../services/aiService');

const router = express.Router();

const DOMAIN_MAPPINGS = {
  doc_no: ['doc_no', 'document_no', 'reference', 'reject_no'],
  item_code: ['item_code', 'code', 'sku', 'material_code'],
  item_name: ['item_name', 'item', 'description', 'product', 'material'],
  department: ['department', 'dept', 'section', 'area'],
  category: ['category', 'item_category', 'type', 'class', 'group'],
  quantity: ['quantity', 'qty', 'stock_qty', 'rejected_qty', 'total_qty'],
  cost: ['total_cost', 'cost', 'stock_value', 'value', 'amount', 'estimated_cost', 'reject_cost', 'price'],
  date: ['date', 'doc_date', 'transaction_date', 'created_at', 'month'],
  approval_status: ['approval_status', 'status', 'approval', 'workflow_status'],
  defect_type: ['defect', 'defect_type', 'machine_defect', 'reason', 'root_cause'],
  machine: ['machine', 'machine_id', 'line', 'production_line']
};

function getMappingConfidence(columnName) {
  const norm = String(columnName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!norm) {
    return { field: null, confidence: 0.0 };
  }

  // Exact match with domain field name
  for (const [field, candidates] of Object.entries(DOMAIN_MAPPINGS)) {
    if (norm === field) {
      return { field, confidence: 1.0 };
    }
  }

  // Exact match with any candidate alias
  for (const [field, candidates] of Object.entries(DOMAIN_MAPPINGS)) {
    if (candidates.includes(norm)) {
      return { field, confidence: 0.9 };
    }
  }

  // Partial/substring match
  for (const [field, candidates] of Object.entries(DOMAIN_MAPPINGS)) {
    const isPartial = candidates.some(c => norm.includes(c) || c.includes(norm));
    if (isPartial) {
      return { field, confidence: 0.5 };
    }
  }

  return { field: null, confidence: 0.0 };
}

router.get('/data/refresh', requireAuth, async (req, res, next) => {
  try {
    const excel = await loadExcelData({ force: true });
    invalidateAiCache('manual data refresh');
    const rejects = await getRejects('excel');
    audit('DATA_REFRESH', req, `${rejects.length} records`);
    return res.json(success({
      refreshed: true,
      records_count: rejects.length,
      sheet_names: excel.sheet_names,
      metrics: excel.metrics,
      validation: excel.validation,
      loaded_at: excel.loaded_at
    }, 'excel', excel.validation.warnings));
  } catch (err) {
    return next(err);
  }
});

router.get('/data/status', requireAuth, (req, res) => {
  const state = getDataState();
  res.json(success({
    ...getDataStatus(),
    cached_source: state.cachedSource,
    warnings: state.cachedWarnings,
    metrics: getMetrics()
  }, state.cachedSource, state.cachedWarnings));
});

router.get('/data/live-status', requireAuth, async (req, res, next) => {
  try {
    const fileExists = config.excelFilePath ? fs.existsSync(config.excelFilePath) : false;
    let stat = null;
    if (fileExists) {
      try {
        stat = fs.statSync(config.excelFilePath);
      } catch (err) {
        // Log and ignore
      }
    }

    let recordCount = 0;
    let sheetCount = 0;
    let lastSuccessfulLoadAt = null;
    let hash = null;
    let warnings = [];

    if (fileExists) {
      try {
        // Load excel data (caching will prevent performance hit if unchanged)
        const excel = await loadExcelData({ force: false });
        recordCount = excel.records ? excel.records.length : 0;
        sheetCount = excel.sheet_names ? excel.sheet_names.length : 0;
        lastSuccessfulLoadAt = excel.loaded_at || null;
        hash = excel.hash || null;
        warnings = (excel.validation && excel.validation.warnings) ? excel.validation.warnings : [];
      } catch (err) {
        warnings.push(`Failed to parse excel file: ${err.message}`);
        const state = getDataState();
        if (state.excel && state.excel.record_count) {
          recordCount = state.excel.record_count;
          sheetCount = state.excel.sheet_names ? state.excel.sheet_names.length : 0;
          lastSuccessfulLoadAt = state.excel.cache_loaded_at;
          hash = state.excel.hash;
        }
      }
    } else {
      warnings.push('Excel file not found. Demo fallback active.');
    }

    res.json(success({
      file_exists: fileExists,
      file_modified_at: stat ? stat.mtime.toISOString() : null,
      hash,
      record_count: recordCount,
      sheet_count: sheetCount,
      last_successful_load_at: lastSuccessfulLoadAt,
      warnings
    }, fileExists ? 'excel' : 'demo', warnings));
  } catch (err) {
    next(err);
  }
});

router.get('/data/schema', requireAuth, async (req, res, next) => {
  try {
    const fileExists = config.excelFilePath ? fs.existsSync(config.excelFilePath) : false;
    if (!fileExists) {
      // Fallback schema for demo data
      return res.json(success({
        sheet_names: ['Demo Sheet'],
        sheets: {
          'Demo Sheet': {
            columns: ['doc_no', 'date', 'department', 'item_code', 'item_name', 'quantity', 'cost', 'approval_status', 'defect_type', 'machine'],
            mappings: {
              doc_no: { field: 'doc_no', confidence: 1.0 },
              date: { field: 'date', confidence: 1.0 },
              department: { field: 'department', confidence: 1.0 },
              item_code: { field: 'item_code', confidence: 1.0 },
              item_name: { field: 'item_name', confidence: 1.0 },
              quantity: { field: 'quantity', confidence: 1.0 },
              cost: { field: 'cost', confidence: 1.0 },
              approval_status: { field: 'approval_status', confidence: 1.0 },
              defect_type: { field: 'defect_type', confidence: 1.0 },
              machine: { field: 'machine', confidence: 1.0 }
            }
          }
        },
        fallback_active: true
      }, 'demo', ['Excel file not found. Fallback schema active.']));
    }

    const excel = await loadExcelData({ force: false });
    const sheetsResult = {};

    if (excel.sheets) {
      for (const [sheetName, sheetData] of Object.entries(excel.sheets)) {
        const columns = sheetData.headers || [];
        const mappings = {};
        columns.forEach(col => {
          mappings[col] = getMappingConfidence(col);
        });
        sheetsResult[sheetName] = {
          columns,
          mappings
        };
      }
    }

    res.json(success({
      sheet_names: excel.sheet_names || [],
      sheets: sheetsResult,
      fallback_active: false
    }, 'excel'));
  } catch (err) {
    next(err);
  }
});

router.get('/data/changes', requireAuth, (req, res) => {
  const changes = getRecentChanges();
  res.json(success({
    count: changes.length,
    changes
  }, 'excel'));
});

module.exports = router;
