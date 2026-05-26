const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const config = require('../config/env');
const { logger } = require('../utils/logger');
const { processRows } = require('./dataProcessor');

const CACHE_DIR = path.join(config.projectRoot, 'data', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'excel-cache.json');
const CHANGE_LOG_FILE = path.join(CACHE_DIR, 'excel-changes.json');
const inMemoryCache = {
  hash: null,
  payload: null,
  loadedAt: null
};

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getDataHash(filePath = config.excelFilePath) {
  if (!fs.existsSync(filePath)) return null;
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    logger.warn('cache_read_failed', { filePath, message: err.message });
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  ensureCacheDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function normalizeCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  if (value.text) return value.text;
  if (value.result !== undefined) return value.result;
  if (value.richText) return value.richText.map((part) => part.text || '').join('');
  if (value.hyperlink && value.text) return value.text;
  return String(value);
}

function makeHeaderName(value, index) {
  const clean = String(value || '').trim();
  return clean || `column_${index + 1}`;
}

function findHeaderRow(rows) {
  let bestIndex = 0;
  let bestScore = -1;
  rows.forEach((row, index) => {
    const nonEmpty = row.filter((cell) => String(cell || '').trim() !== '').length;
    if (nonEmpty > bestScore) {
      bestScore = nonEmpty;
      bestIndex = index;
    }
  });
  return bestIndex;
}

async function readExcelFile(filePath = config.excelFilePath) {
  if (!fs.existsSync(filePath)) {
    const error = new Error(`Excel file not found: ${filePath}`);
    error.code = 'EXCEL_FILE_NOT_FOUND';
    throw error;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheets = {};

    workbook.worksheets.forEach((worksheet) => {
      const rows = [];
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        rows.push(row.values.slice(1).map(normalizeCell));
      });

      sheets[worksheet.name] = {
        name: worksheet.name,
        row_count: rows.length,
        rows
      };
    });

    return {
      file_path: filePath,
      file_size: fs.statSync(filePath).size,
      sheets,
      sheet_names: Object.keys(sheets),
      read_at: new Date().toISOString()
    };
  } catch (err) {
    const error = new Error(`Excel read failed or file is corrupted: ${err.message}`);
    error.code = 'EXCEL_CORRUPTED_OR_UNREADABLE';
    error.cause = err;
    throw error;
  }
}

function parseRejectData(workbookData) {
  const parsedSheets = {};
  const allRows = [];

  Object.values(workbookData.sheets || {}).forEach((sheet) => {
    const rows = sheet.rows || [];
    if (!rows.length) {
      parsedSheets[sheet.name] = { headers: [], rows: [] };
      return;
    }

    const headerIndex = findHeaderRow(rows);
    const headers = rows[headerIndex].map(makeHeaderName);
    const records = rows.slice(headerIndex + 1).map((row, rowIndex) => {
      const record = {
        __sheet: sheet.name,
        __row_number: headerIndex + rowIndex + 2
      };
      headers.forEach((header, columnIndex) => {
        record[header] = normalizeCell(row[columnIndex]);
      });
      return record;
    }).filter((record) => {
      return Object.keys(record).some((key) => !key.startsWith('__') && String(record[key] || '').trim() !== '');
    });

    parsedSheets[sheet.name] = { headers, rows: records };
    allRows.push(...records);
  });

  const processed = processRows(allRows);
  return {
    sheets: parsedSheets,
    records: processed.records,
    metrics: processed.metrics,
    parsed_at: new Date().toISOString()
  };
}

function validateData(parsedData) {
  const errors = [];
  const warnings = [];
  const sheetNames = Object.keys(parsedData.sheets || {});

  if (!sheetNames.length) errors.push('Workbook has no readable sheets.');
  if (!parsedData.records.length) errors.push('Workbook has no data rows after parsing.');

  sheetNames.forEach((sheetName) => {
    const sheet = parsedData.sheets[sheetName];
    if (!sheet.headers.length) warnings.push(`Sheet "${sheetName}" has no header row.`);
    if (!sheet.rows.length) warnings.push(`Sheet "${sheetName}" has no parsed data rows.`);
  });

  const emptyCostRatio = parsedData.records.length
    ? parsedData.records.filter((record) => !record.total_cost).length / parsedData.records.length
    : 1;
  if (emptyCostRatio > 0.8) warnings.push('More than 80% of rows have no detectable cost/value field.');

  // Aggregate record-level validation warnings
  parsedData.records.forEach(r => {
    if (r.validation_warnings && r.validation_warnings.length) {
      r.validation_warnings.forEach(w => {
        const msg = `Record ${r.item_code} (Row ${r.__row_number}): ${w}`;
        if (!warnings.includes(msg)) warnings.push(msg);
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    record_count: parsedData.records.length,
    sheet_count: sheetNames.length
  };
}

function loadFileCache(hash) {
  const cache = readJsonFile(CACHE_FILE, null);
  if (cache && cache.hash === hash && cache.payload) return cache.payload;
  return null;
}

function saveCache(hash, payload) {
  inMemoryCache.hash = hash;
  inMemoryCache.payload = payload;
  inMemoryCache.loadedAt = new Date().toISOString();
  writeJsonFile(CACHE_FILE, { hash, payload, saved_at: inMemoryCache.loadedAt });
}

function recordChange(change) {
  const changes = readJsonFile(CHANGE_LOG_FILE, []);
  const next = [change, ...changes].slice(0, 50);
  writeJsonFile(CHANGE_LOG_FILE, next);
  return next;
}

async function loadExcelData(options = {}) {
  const force = options.force === true;
  const filePath = options.filePath || config.excelFilePath;
  const hash = getDataHash(filePath);

  if (!force && hash && inMemoryCache.hash === hash && inMemoryCache.payload) {
    return { ...inMemoryCache.payload, cache: { type: 'memory', hit: true } };
  }

  if (!force && hash) {
    const fileCached = loadFileCache(hash);
    if (fileCached) {
      inMemoryCache.hash = hash;
      inMemoryCache.payload = fileCached;
      inMemoryCache.loadedAt = new Date().toISOString();
      return { ...fileCached, cache: { type: 'file', hit: true } };
    }
  }

  const previousHash = inMemoryCache.hash || readJsonFile(CACHE_FILE, {})?.hash || null;
  const workbook = await readExcelFile(filePath);
  const parsed = parseRejectData(workbook);
  const validation = validateData(parsed);
  const payload = {
    source: 'excel',
    hash,
    file_path: filePath,
    file_size: workbook.file_size,
    sheet_names: workbook.sheet_names,
    sheets: parsed.sheets,
    records: parsed.records,
    metrics: parsed.metrics,
    validation,
    loaded_at: new Date().toISOString()
  };

  saveCache(hash, payload);

  if (previousHash && previousHash !== hash) {
    recordChange({
      event: 'excel_hash_changed',
      old_hash: previousHash,
      new_hash: hash,
      record_count: parsed.records.length,
      sheet_count: workbook.sheet_names.length,
      timestamp: new Date().toISOString()
    });
  }

  return { ...payload, cache: { type: 'fresh', hit: false } };
}

function getDataStatus() {
  const fileExists = fs.existsSync(config.excelFilePath);
  const stat = fileExists ? fs.statSync(config.excelFilePath) : null;
  const cache = readJsonFile(CACHE_FILE, {});
  return {
    file_path: config.excelFilePath,
    file_exists: fileExists,
    file_size: stat ? stat.size : 0,
    file_modified_at: stat ? stat.mtime.toISOString() : null,
    hash: getDataHash(config.excelFilePath),
    cached_hash: cache.hash || inMemoryCache.hash,
    cache_loaded_at: inMemoryCache.loadedAt || cache.saved_at || null,
    record_count: cache.payload ? cache.payload.records.length : 0,
    sheet_names: cache.payload ? cache.payload.sheet_names : []
  };
}

function getRecentChanges() {
  return readJsonFile(CHANGE_LOG_FILE, []);
}

function clearExcelCache(reason) {
  inMemoryCache.hash = null;
  inMemoryCache.payload = null;
  inMemoryCache.loadedAt = null;
  logger.info('excel_cache_cleared', { reason });
}

module.exports = {
  readExcelFile,
  parseRejectData,
  validateData,
  getDataHash,
  loadExcelData,
  getDataStatus,
  getRecentChanges,
  recordChange,
  clearExcelCache
};
