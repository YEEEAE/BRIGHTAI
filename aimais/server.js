import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(__filename);
const PUBLIC_DIR = join(ROOT, "public");
const SQL_DIR = join(ROOT, "sql");
const DATA_DIR = join(ROOT, "data");
const UPLOADS_DIR = join(DATA_DIR, "uploads");
const DB_PATH = join(DATA_DIR, "aimais.db");
const CACHE_PATH = join(DATA_DIR, "analytics-cache.json");
const IMPORT_SUMMARY_PATH = join(DATA_DIR, "import-summary.json");
const IMPORTER_PATH = join(ROOT, "scripts", "import_rejection_excel.py");
const SCHEMA_PATH = join(SQL_DIR, "schema.sql");
const SEED_PATH = join(SQL_DIR, "seed.sql");
const BUNDLED_REPORT_PATH = join(ROOT, "Rejection_Slip_Report.xlsx");
const EXPECTED_REJECTION_COLUMNS = ["id", "report_date", "item_code", "machine_name", "produced_qty", "rejected_qty", "reject_pct"];
const CLEAR_ALL_CONFIRM_TOKEN = "DELETE_ALL_REJECTION_DATA";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_TIMEOUT_MS = 20000;

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

function resetAnalyticsArtifacts() {
  writeFileSync(CACHE_PATH, JSON.stringify(buildEmptyAnalytics(), null, 2));
  writeFileSync(IMPORT_SUMMARY_PATH, "null");
}

function ensureRejectionRecordsSchema() {
  const tableRows = db.prepare("PRAGMA table_info(rejection_records)").all();
  const existingColumns = tableRows.map((row) => row.name);
  const criticalColumns = new Set(["id", "report_date", "item_code", "produced_qty", "rejected_qty", "reject_pct"]);

  if (existingColumns.length && [...criticalColumns].some((column) => !existingColumns.includes(column))) {
    db.exec("DROP TABLE IF EXISTS rejection_records");
    resetAnalyticsArtifacts();
    db.exec(readFileSync(SCHEMA_PATH, "utf8"));
    return;
  }

  if (!existingColumns.length) {
    db.exec(readFileSync(SCHEMA_PATH, "utf8"));
    return;
  }

  if (!existingColumns.includes("machine_name")) {
    db.exec("ALTER TABLE rejection_records ADD COLUMN machine_name TEXT NOT NULL DEFAULT ''");
  }

  db.exec(readFileSync(SCHEMA_PATH, "utf8"));
}

ensureRejectionRecordsSchema();
db.exec(readFileSync(SEED_PATH, "utf8"));

const ROLE_PERMISSIONS = {
  admin: [
    "tasks:write", "tasks:delete",
    "plans:write", "plans:delete",
    "handover:write", "handover:delete",
    "reports:generate", "reports:view",
    "import:excel",
    "reject:delete-all",
    "roles:assign",
    "audit:view",
    "ai:generate",
  ],
  manager: [
    "tasks:write", "tasks:delete",
    "plans:write", "plans:delete",
    "handover:write", "handover:delete",
    "reports:generate", "reports:view",
    "import:excel",
    "reject:delete-all",
    "roles:assign",
    "audit:view",
    "ai:generate",
  ],
  viewer: [
    "tasks:write", "tasks:delete",
    "plans:write", "plans:delete",
    "handover:write", "handover:delete",
    "reports:generate", "reports:view",
    "import:excel",
    "reject:delete-all",
    "roles:assign",
    "audit:view",
    "ai:generate",
  ],
};

const VALID_SESSION_ROLES = ["admin", "manager", "viewer"];

function getSessionFromRequest(req) {
  const token =
    req.headers["x-session-token"] ||
    req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) return null;

  const session = db.prepare(
    "SELECT * FROM user_sessions WHERE token = ?"
  ).get(token);

  if (!session) return null;

  db.prepare(
    "UPDATE user_sessions SET last_seen = CURRENT_TIMESTAMP WHERE token = ?"
  ).run(token);

  return session;
}

function hasPermission(session, permission) {
  if (!session) return false;
  const perms = ROLE_PERMISSIONS[session.role] || [];
  return perms.includes(permission);
}

function requirePermission(res, session, permission) {
  if (!hasPermission(session, permission)) {
    json(res, 403, {
      error: "Access denied",
      required: permission,
      yourRole: session?.role || "none",
      message: `Your role (${session?.role || "none"}) does not have permission: ${permission}`,
    });
    return false;
  }
  return true;
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)[0];
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function serializeAuditValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function auditLog(entry) {
  db.prepare(
    `INSERT INTO audit_log
      (actor, action, entity, entity_id, field, old_value, new_value, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    entry.actor || "Unknown",
    entry.action || "UNKNOWN",
    entry.entity || "unknown",
    entry.entityId || null,
    entry.field || null,
    serializeAuditValue(entry.oldValue),
    serializeAuditValue(entry.newValue),
    entry.ip || null
  );
}

// ═══════════════════════════════════════════════════
// FILE WATCH & AUTO-IMPORT ENGINE
// ═══════════════════════════════════════════════════

const WATCH_FILE = join(ROOT, "Rejection_Slip_Report.xlsx");
let importInProgress = false;

function getFileMtime() {
  try {
    if (!existsSync(WATCH_FILE)) return 0;
    return statSync(WATCH_FILE).mtimeMs;
  } catch {
    return 0;
  }
}

function getWatchRecord() {
  try {
    return db.prepare(
      "SELECT * FROM file_watch WHERE id = 1"
    ).get();
  } catch {
    return null;
  }
}

function updateWatchRecord(fields) {
  try {
    const keys = Object.keys(fields);
    if (!keys.length) return;
    const setClauses = keys.map((key) => `${key} = ?`).join(", ");
    const values = Object.values(fields);
    db.prepare(`
      UPDATE file_watch
      SET ${setClauses},
          last_check_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(...values);
  } catch (error) {
    console.error("[FileWatch] updateWatchRecord failed:", error.message);
  }
}

function syncWatchAfterImport(filePath) {
  if (filePath !== WATCH_FILE) {
    return;
  }

  const newMtime = getFileMtime();
  const { total } = db.prepare(
    "SELECT COUNT(*) AS total FROM rejection_records"
  ).get();

  updateWatchRecord({
    last_mtime_ms: newMtime,
    last_import_at: new Date().toISOString(),
    row_count: total,
    status: "up_to_date",
  });
}

function buildImportConflict() {
  return {
    ok: false,
    statusCode: 409,
    error: "Import already running",
    detail: "Wait for the current import to finish before starting another one."
  };
}

async function executeImportWorkflow({
  filePath,
  fileName,
  reason,
  logPrefix = "[Import]",
}) {
  if (importInProgress) {
    const conflict = buildImportConflict();
    console.log(`${logPrefix} Already running - skipped`);
    return { ...conflict, skipped: true };
  }

  const watchFileImport = filePath === WATCH_FILE;
  importInProgress = true;

  if (watchFileImport) {
    updateWatchRecord({ status: "importing" });
  }

  if (reason) {
    console.log(`${logPrefix} Starting - ${reason}`);
  }

  try {
    const { stdout, stderr } = await runCommand("python3", [
      IMPORTER_PATH,
      filePath,
    ]);

    if (stdout?.trim()) {
      console.log(logPrefix, stdout.trim());
    }
    if (stderr?.trim()) {
      console.warn(`${logPrefix} stderr:`, stderr.trim());
    }

    const freshAnalytics = getAnalytics();
    writeFileSync(
      CACHE_PATH,
      JSON.stringify(freshAnalytics, null, 2),
      "utf8"
    );

    if (watchFileImport) {
      syncWatchAfterImport(filePath);
    }

    const dashboard = buildDashboardPayload();
    const importSummary = loadImportSummary();
    const payload = {
      ok: true,
      fileName,
      importLog: stdout?.trim() || "",
      latestMonthLabel: dashboard.analytics.latestMonthLabel,
      totalRejectedQty: dashboard.analytics.overview.totalRejectQty,
      rowCount: importSummary?.rowCount || 0,
      dashboard,
      importSummary,
    };

    if (reason) {
      console.log(
        `${logPrefix} Complete - ${payload.rowCount} imported rows in latest summary`
      );
    }

    return payload;
  } catch (error) {
    if (watchFileImport) {
      updateWatchRecord({ status: "error" });
    }

    console.error(`${logPrefix} Failed:`, error.message);
    return {
      ok: false,
      statusCode: 500,
      error: "Import failed",
      detail: error.message || "Unknown error"
    };
  } finally {
    importInProgress = false;
  }
}

async function runAutoImport(reason) {
  const result = await executeImportWorkflow({
    filePath: WATCH_FILE,
    fileName: "Rejection_Slip_Report.xlsx",
    reason,
    logPrefix: "[AutoImport]",
  });

  if (!result.ok) {
    return result;
  }

  const rows = Number(result.importSummary?.rowCount || result.rowCount || 0);
  const { total } = db.prepare(
    "SELECT COUNT(*) AS total FROM rejection_records"
  ).get();

  auditLog({
    actor: "system",
    action: "IMPORT",
    entity: "rejection_records",
    entityId: "Rejection_Slip_Report.xlsx",
    newValue: `Auto-import: ${reason} - ${total} total rows`,
  });

  return {
    ok: true,
    rows,
    totalRows: total,
    reason,
  };
}

async function checkAndImportIfChanged() {
  if (importInProgress) return;

  const currentMtime = getFileMtime();
  if (currentMtime === 0) return;

  const record = getWatchRecord();
  const storedMtime = Number(record?.last_mtime_ms || 0);

  try {
    db.prepare(
      "UPDATE file_watch SET last_check_at = CURRENT_TIMESTAMP WHERE id = 1"
    ).run();
  } catch {
    // Non-critical status update.
  }

  if (currentMtime > storedMtime) {
    const reason = storedMtime === 0
      ? "first run - file never imported"
      : `file modified at ${new Date(currentMtime).toISOString()}`;
    await runAutoImport(reason);
  }
}

function getAuditTrail() {
  return db.prepare(
    `SELECT id, actor, action, entity, entity_id, field, old_value, new_value, ip, created_at
     FROM audit_log
     ORDER BY created_at DESC, id DESC
     LIMIT 200`
  ).all();
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk.toString("utf8");
      if (raw.length > 30_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function readTrimmedEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function getGeminiConfig() {
  return {
    apiKey: readTrimmedEnv("GEMINI_API_KEY"),
    model: readTrimmedEnv("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: ROOT }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function sanitizeFilename(fileName) {
  const safe = String(fileName || "upload.xlsx").replace(/[^a-zA-Z0-9._-]/g, "-");
  return safe.toLowerCase().endsWith(".xlsx") ? safe : `${safe}.xlsx`;
}

async function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured");
    return {
      ok: false,
      error: "RESEND_API_KEY not configured"
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "AIMAIS Reports <reports@yourdomain.com>",
        to: [to],
        subject,
        html
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        error: payload?.message || payload?.error || "Email send failed"
      };
    }

    return {
      ok: true,
      id: payload?.id || null
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Email send failed"
    };
  }
}

function notFound(res) {
  json(res, 404, { error: "Not found" });
}

function buildEmptyAnalytics() {
  return {
    lastUpdated: null,
    latestMonthLabel: "No data",
    previousMonthLabel: "No data",
    recent15DayWindow: null,
    dailySnapshot: null,
    overview: {
      totalRejectQty: 0,
      totalProducedQty: 0,
      latestRejectRate: 0,
      productsAboveThreshold: 0,
      abnormalProduct: "No data",
      abnormalDelta: 0,
    },
    monthlyTrend: [],
    weeklyTrend: [],
    periodInsights: {
      monthCount: 0,
      weekCount: 0,
      latestWeekLabel: "No data",
    },
    productAlerts: [],
    topProductsByLoss: [],
    narrative: "Import rejection data to start.",
  };
}

function getBundledWorkbookInfo() {
  if (!existsSync(BUNDLED_REPORT_PATH)) {
    return {
      available: false,
      fileName: null,
      path: null
    };
  }

  return {
    available: true,
    fileName: "Rejection_Slip_Report.xlsx",
    path: BUNDLED_REPORT_PATH
  };
}

function loadImportSummary() {
  if (!existsSync(IMPORT_SUMMARY_PATH)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(IMPORT_SUMMARY_PATH, "utf8"));
  } catch {
    return null;
  }
}

function loadCacheFallback() {
  if (!existsSync(CACHE_PATH)) {
    return buildEmptyAnalytics();
  }

  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return buildEmptyAnalytics();
  }
}

function toMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function getIsoWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target - firstThursday;
  const week = 1 + Math.round(diff / 604800000);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function formatPct(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

function normalizeMachineName(value) {
  return String(value || "").trim();
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateLabel(dateString) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function computeRateFromRows(rows = []) {
  const totals = rows.reduce((acc, row) => {
    acc.produced += Number(row.produced_qty || 0);
    acc.rejected += Number(row.rejected_qty || 0);
    return acc;
  }, { produced: 0, rejected: 0 });

  return {
    produced: Number(totals.produced.toFixed(2)),
    rejected: Number(totals.rejected.toFixed(2)),
    rejectRate: formatPct(totals.produced ? (totals.rejected / totals.produced) * 100 : 0),
  };
}

function getRecent15DayWindow() {
  const latestRow = db.prepare(`
    SELECT report_date
    FROM rejection_records
    ORDER BY report_date DESC
    LIMIT 1
  `).get();

  if (!latestRow?.report_date) {
    return null;
  }

  const latestDate = new Date(`${latestRow.report_date}T00:00:00Z`);
  const windowStartDate = addUtcDays(latestDate, -14);
  const baselineEndDate = addUtcDays(windowStartDate, -1);
  const baselineStartDate = addUtcDays(windowStartDate, -90);

  const latestIso = toIsoDate(latestDate);
  const windowStartIso = toIsoDate(windowStartDate);
  const baselineStartIso = toIsoDate(baselineStartDate);
  const baselineEndIso = toIsoDate(baselineEndDate);

  const recentRows = db.prepare(`
    SELECT
      report_date,
      item_code,
      COALESCE(machine_name, '') AS machine_name,
      produced_qty,
      rejected_qty,
      reject_pct
    FROM rejection_records
    WHERE report_date BETWEEN ? AND ?
    ORDER BY report_date DESC, reject_pct DESC, rejected_qty DESC, item_code ASC
  `).all(windowStartIso, latestIso);

  if (!recentRows.length) {
    return null;
  }

  const baselineRows = db.prepare(`
    SELECT
      report_date,
      item_code,
      COALESCE(machine_name, '') AS machine_name,
      produced_qty,
      rejected_qty,
      reject_pct
    FROM rejection_records
    WHERE report_date BETWEEN ? AND ?
    ORDER BY report_date ASC
  `).all(baselineStartIso, baselineEndIso);

  const historyRows = db.prepare(`
    SELECT
      report_date,
      item_code,
      COALESCE(machine_name, '') AS machine_name,
      produced_qty,
      rejected_qty,
      reject_pct
    FROM rejection_records
    WHERE report_date BETWEEN ? AND ?
    ORDER BY report_date ASC
  `).all(baselineStartIso, latestIso);

  const recentTotals = computeRateFromRows(recentRows);
  const baselineTotals = computeRateFromRows(baselineRows);
  const machines = new Set(recentRows.map((row) => normalizeMachineName(row.machine_name) || "Unknown"));

  const rows = recentRows.map((row) => {
    const rowDate = new Date(`${row.report_date}T00:00:00Z`);
    const priorStartIso = toIsoDate(addUtcDays(rowDate, -90));
    const priorRows = historyRows.filter((historyRow) =>
      historyRow.report_date >= priorStartIso
      && historyRow.report_date < row.report_date
    );
    const exactRows = priorRows.filter((historyRow) =>
      historyRow.item_code === row.item_code
      && normalizeMachineName(historyRow.machine_name) === normalizeMachineName(row.machine_name)
    );
    const itemRows = priorRows.filter((historyRow) => historyRow.item_code === row.item_code);
    const comparisonRows = exactRows.length
      ? exactRows
      : itemRows.length
        ? itemRows
        : priorRows;
    const comparisonTotals = computeRateFromRows(comparisonRows);
    const deltaRejectRate = formatPct(Number(row.reject_pct || 0) - comparisonTotals.rejectRate);

    return {
      date: row.report_date,
      dateLabel: toDateLabel(row.report_date),
      itemCode: row.item_code,
      machineName: normalizeMachineName(row.machine_name) || "Unknown",
      producedQty: Number(Number(row.produced_qty || 0).toFixed(2)),
      rejectedQty: Number(Number(row.rejected_qty || 0).toFixed(2)),
      rejectPct: formatPct(Number(row.reject_pct || 0)),
      baselineRejectPct: comparisonTotals.rejectRate,
      deltaRejectPct: deltaRejectRate,
      baselineScope: exactRows.length
        ? "item + machine"
        : itemRows.length
          ? "item"
          : "plant",
    };
  });

  const largestDeviation = rows.reduce((best, row) => (
    !best || Math.abs(row.deltaRejectPct) > Math.abs(best.deltaRejectPct) ? row : best
  ), null);

  return {
    latestDate: latestIso,
    latestDateLabel: toDateLabel(latestIso),
    windowStart: windowStartIso,
    windowStartLabel: toDateLabel(windowStartIso),
    baselineStart: baselineStartIso,
    baselineEnd: baselineEndIso,
    baselineStartLabel: toDateLabel(baselineStartIso),
    baselineEndLabel: toDateLabel(baselineEndIso),
    rowCount: rows.length,
    machineCount: machines.size,
    totalProducedQty: recentTotals.produced,
    totalRejectedQty: recentTotals.rejected,
    overallRejectRate: recentTotals.rejectRate,
    baselineRejectRate: baselineTotals.rejectRate,
    deltaRejectRate: formatPct(recentTotals.rejectRate - baselineTotals.rejectRate),
    largestDeviation,
    rows,
  };
}

function getDailySnapshot() {
  const lastDayRow = db.prepare(`
    SELECT report_date
    FROM rejection_records
    ORDER BY report_date DESC
    LIMIT 1
  `).get();

  if (!lastDayRow) return null;

  const lastDay = lastDayRow.report_date;

  const dayTotals = db.prepare(`
    SELECT
      SUM(produced_qty) AS totalProduced,
      SUM(rejected_qty) AS totalRejected,
      COUNT(DISTINCT item_code) AS itemCount
    FROM rejection_records
    WHERE report_date = ?
  `).get(lastDay);

  const dayItems = db.prepare(`
    SELECT
      item_code,
      SUM(produced_qty) AS produced,
      SUM(rejected_qty) AS rejected,
      AVG(reject_pct) AS avgPct,
      MAX(reject_pct) AS maxPct,
      COUNT(*) AS occurrences
    FROM rejection_records
    WHERE report_date = ?
    GROUP BY item_code
    ORDER BY rejected DESC
  `).all(lastDay);

  const totalProduced = Number(dayTotals?.totalProduced || 0);
  const totalRejected = Number(dayTotals?.totalRejected || 0);
  const overallRate = totalProduced
    ? Number(((totalRejected / totalProduced) * 100).toFixed(2))
    : 0;
  const aboveThreshold = dayItems.filter((row) => Number(row.avgPct || 0) >= 5);

  const dateObj = new Date(`${lastDay}T00:00:00`);
  const dayLabel = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return {
    date: lastDay,
    dateLabel: dayLabel,
    totalProduced: Number(totalProduced.toFixed(2)),
    totalRejected: Number(totalRejected.toFixed(2)),
    overallRate,
    itemCount: dayTotals?.itemCount || 0,
    itemsAbove5: aboveThreshold.length,
    topItems: dayItems.slice(0, 10).map((row) => ({
      itemCode: row.item_code,
      produced: Number(Number(row.produced || 0).toFixed(2)),
      rejected: Number(Number(row.rejected || 0).toFixed(2)),
      avgPct: Number(Number(row.avgPct || 0).toFixed(2)),
      maxPct: Number(Number(row.maxPct || 0).toFixed(2)),
      occurrences: Number(row.occurrences || 0),
    })),
    aboveThreshold: aboveThreshold.map((row) => ({
      itemCode: row.item_code,
      produced: Number(Number(row.produced || 0).toFixed(2)),
      rejected: Number(Number(row.rejected || 0).toFixed(2)),
      avgPct: Number(Number(row.avgPct || 0).toFixed(2)),
      maxPct: Number(Number(row.maxPct || 0).toFixed(2)),
    })),
  };
}

function computeAnalytics(records) {
  if (!records.length) return loadCacheFallback();

  const monthly = new Map();
  const weekly = new Map();
  const itemMap = new Map();

  let totalProduced = 0;
  let totalRejected = 0;
  let latestDate = null;

  for (const row of records) {
    const date = row.report_date;
    const code = (row.item_code || "").trim();
    const produced = Number(row.produced_qty || 0);
    const rejected = Number(row.rejected_qty || 0);
    const pct = Number(row.reject_pct || 0);
    const monthKey = date.slice(0, 7);
    const weekKey = getIsoWeek(date);

    totalProduced += produced;
    totalRejected += rejected;
    if (!latestDate || date > latestDate) latestDate = date;

    if (!monthly.has(monthKey)) {
      monthly.set(monthKey, { produced: 0, rejected: 0 });
    }
    monthly.get(monthKey).produced += produced;
    monthly.get(monthKey).rejected += rejected;

    if (!weekly.has(weekKey)) {
      weekly.set(weekKey, { produced: 0, rejected: 0 });
    }
    weekly.get(weekKey).produced += produced;
    weekly.get(weekKey).rejected += rejected;

    if (code) {
      if (!itemMap.has(code)) {
        itemMap.set(code, {
          produced: 0,
          rejected: 0,
          pcts: [],
          monthly: new Map(),
        });
      }
      const item = itemMap.get(code);
      item.produced += produced;
      item.rejected += rejected;
      item.pcts.push(pct);

      if (!item.monthly.has(monthKey)) {
        item.monthly.set(monthKey, { produced: 0, rejected: 0, pcts: [] });
      }
      const im = item.monthly.get(monthKey);
      im.produced += produced;
      im.rejected += rejected;
      im.pcts.push(pct);
    }
  }

  const allMonths = [...monthly.keys()].sort();
  const latestMonth = allMonths.at(-1);
  const prevMonth = allMonths.at(-2) || latestMonth;
  const allWeeks = [...weekly.keys()].sort().slice(-8);

  const pct = (prod, rej) => formatPct(prod ? (rej / prod) * 100 : 0);

  const monthlyTrend = allMonths.map((mk) => ({
    label: toMonthLabel(mk),
    monthKey: mk,
    rejectRate: pct(
      monthly.get(mk).produced,
      monthly.get(mk).rejected
    ),
  }));

  const weeklyTrend = allWeeks.map((wk) => ({
    label: wk,
    rejectRate: pct(
      weekly.get(wk).produced,
      weekly.get(wk).rejected
    ),
  }));

  const productAlerts = [];
  const topProductsByLoss = [];
  let allTimeItemsAboveThreshold = 0;

  for (const [code, info] of itemMap.entries()) {
    const itemMonths = [...info.monthly.keys()].sort();
    const latestItemMonth = itemMonths.at(-1);
    const latestData = latestItemMonth ? info.monthly.get(latestItemMonth) : null;
    const latestRate = latestData
      ? pct(latestData.produced, latestData.rejected)
      : 0;
    const allTimeRate = pct(info.produced, info.rejected);

    const baselines = [];
    for (const [mk, md] of info.monthly.entries()) {
      if (mk === latestItemMonth) continue;
      baselines.push(pct(md.produced, md.rejected));
    }
    const baselineRate = baselines.length
      ? baselines.reduce((a, b) => a + b, 0) / baselines.length
      : latestRate;
    const delta = latestRate - baselineRate;

    if (allTimeRate >= 5) {
      allTimeItemsAboveThreshold += 1;
    }

    if (latestRate >= 5 || delta >= 1) {
      productAlerts.push({
        productName: code,
        code,
        latestRate: formatPct(latestRate),
        baselineRate: formatPct(baselineRate),
        delta: formatPct(delta),
        rejectQty: Number((latestData?.rejected ?? info.rejected).toFixed(2)),
        producedQty: Number((latestData?.produced ?? info.produced).toFixed(2)),
      });
    }

    const avgPct = info.pcts.length
      ? info.pcts.reduce((a, b) => a + b, 0) / info.pcts.length : 0;
    topProductsByLoss.push({
      productName: code,
      code,
      rejectQty: Number(info.rejected.toFixed(2)),
      producedQty: Number(info.produced.toFixed(2)),
      totalRate: formatPct(avgPct),
    });
  }

  productAlerts.sort(
    (a, b) => (b.latestRate - a.latestRate) || (b.delta - a.delta)
  );
  topProductsByLoss.sort((a, b) => b.rejectQty - a.rejectQty);

  const abnormal = productAlerts[0];
  const overallRate = pct(totalProduced, totalRejected);

  return {
    lastUpdated: latestDate,
    latestMonthLabel: toMonthLabel(latestMonth),
    previousMonthLabel: toMonthLabel(prevMonth),
    recent15DayWindow: null,
    dailySnapshot: null,
    overview: {
      totalRejectQty: Number(totalRejected.toFixed(2)),
      totalProducedQty: Number(totalProduced.toFixed(2)),
      latestRejectRate: overallRate,
      productsAboveThreshold: allTimeItemsAboveThreshold,
      abnormalProduct: abnormal?.productName || "No data",
      abnormalDelta: abnormal?.delta || 0,
    },
    monthlyTrend,
    weeklyTrend,
    periodInsights: {
      monthCount: monthlyTrend.length,
      weekCount: weeklyTrend.length,
      latestWeekLabel: allWeeks.at(-1) || "No data",
    },
    productAlerts: productAlerts.slice(0, 20),
    topProductsByLoss: topProductsByLoss.slice(0, 10),
    narrative: `Overall reject rate is ${overallRate}% in `
      + `${toMonthLabel(latestMonth)}. `
      + (abnormal
        ? `Highest risk: ${abnormal.productName} `
          + `at ${abnormal.latestRate}%.`
        : "No item above threshold."),
  };
}

function getAnalytics() {
  const { total } = db.prepare(
    "SELECT COUNT(*) AS total FROM rejection_records"
  ).get();
  if (!total) return loadCacheFallback();

  const rows = db.prepare(`
      SELECT report_date, item_code, machine_name,
             produced_qty, rejected_qty, reject_pct
      FROM rejection_records
      ORDER BY report_date ASC
    `).all();

  const analytics = computeAnalytics(rows);
  analytics.recent15DayWindow = getRecent15DayWindow();
  analytics.dailySnapshot = getDailySnapshot();
  return analytics;
}

function getTasks() {
  return db.prepare("SELECT * FROM daily_tasks ORDER BY priority = 'high' DESC, due_date ASC, id DESC").all();
}

function getPlans() {
  return db.prepare("SELECT * FROM future_plans ORDER BY impact_score DESC, id DESC").all();
}

function getReports() {
  return db.prepare("SELECT * FROM executive_reports ORDER BY created_at DESC, id DESC LIMIT 12").all();
}

function getHandovers() {
  return db.prepare("SELECT * FROM handover_notes ORDER BY created_at DESC, id DESC LIMIT 10").all();
}

function getImportHistory() {
  return db.prepare("SELECT * FROM import_history ORDER BY imported_at DESC LIMIT 10").all();
}

function getTargets() {
  const targetsDb = new DatabaseSync(DB_PATH);
  try {
    return targetsDb.prepare("SELECT * FROM kpi_targets ORDER BY metric ASC").all();
  } finally {
    targetsDb.close();
  }
}

function getRejectPareto() {
  const rows = db.prepare(`
      SELECT item_code              AS code,
             SUM(rejected_qty)      AS totalRejected,
             AVG(reject_pct)        AS avgPct
      FROM rejection_records
      WHERE item_code IS NOT NULL AND TRIM(item_code) != ''
      GROUP BY item_code
      ORDER BY totalRejected DESC
      LIMIT 20
    `).all();

  const total = rows.reduce(
    (s, r) => s + Number(r.totalRejected || 0), 0
  );
  let running = 0;

  return rows.map((r) => {
    const totalRejected = Number(Number(r.totalRejected || 0).toFixed(2));
    running += totalRejected;
    return {
      productName: r.code,
      code: r.code,
      avgPct: formatPct(r.avgPct || 0),
      totalRejected,
      cumulativePct: total
        ? formatPct((totalRejected / total) * 100) : 0,
      runningPct: total
        ? formatPct((running / total) * 100) : 0,
    };
  });
}

function getTopItemsByPct() {
  return db.prepare(`
      SELECT item_code            AS code,
             COUNT(*)             AS occurrences,
             SUM(rejected_qty)    AS total_rejected,
             AVG(reject_pct)      AS avg_pct,
             MAX(reject_pct)      AS max_pct,
             SUM(produced_qty)    AS total_produced
      FROM rejection_records
      WHERE item_code IS NOT NULL AND TRIM(item_code) != ''
      GROUP BY item_code
      HAVING avg_pct >= 3
      ORDER BY avg_pct DESC
      LIMIT 20
    `).all().map((r) => ({
      code: r.code,
      occurrences: Number(r.occurrences || 0),
      total_rejected: Number(Number(r.total_rejected || 0).toFixed(2)),
      total_produced: Number(Number(r.total_produced || 0).toFixed(2)),
      avg_pct: formatPct(r.avg_pct || 0),
      max_pct: formatPct(r.max_pct || 0),
    }));
}

function buildHumanLayer(analytics, tasks, plans, reports, handovers) {
  const topAlert = analytics.productAlerts[0];
  const topLoss = analytics.topProductsByLoss[0];
  const recentHandover = handovers[0];
  const recentTask = tasks[0];
  const recentReport = reports[0];

  return {
    humanHeadline: topAlert
      ? `${topAlert.productName} at ${topAlert.latestRate}% — needs attention.`
      : `Overall reject rate is ${analytics.overview.latestRejectRate}%.`,
    morningBrief: {
      title: "Morning Brief",
      summary: topAlert
        ? `${topAlert.productName} is the highest-risk item at ${topAlert.latestRate}% reject rate.`
        : `No item above 5% threshold. Overall rate: ${analytics.overview.latestRejectRate}%.`,
      owner: recentTask?.owner_name || "Operations Team",
      due: recentTask?.due_date || "Today"
    },
    teamPulse: [
      {
        title: "Highest risk item",
        detail: topAlert
          ? `${topAlert.productName}: ${topAlert.latestRate}% (+${topAlert.delta}% vs baseline)`
          : "No item above 5% threshold.",
        tone: topAlert ? "danger" : "accent",
      },
      {
        title: "Top by rejected volume",
        detail: topLoss
          ? `${topLoss.productName}: ${Number(topLoss.rejectQty || 0).toLocaleString("en-US")} units rejected, avg ${topLoss.totalRate}%`
          : "No volume data yet.",
        tone: "warning",
      },
      {
        title: "Overall this month",
        detail: `Reject rate is ${analytics.overview.latestRejectRate}% across ${Number(analytics.overview.totalProducedQty || 0).toLocaleString("en-US")} produced units.`,
        tone: "accent"
      }
    ],
    collaborationMoments: handovers.slice(0, 4).map((note) => ({
      title: note.shift_label,
      speaker: note.speaker_name,
      summary: note.summary,
      blockers: note.blockers,
      nextStep: note.next_step,
      mood: note.mood
    })),
    aiRecipes: [
      {
        title: "Morning Briefing",
        type: "daily-briefing",
        prompt: "Give me a morning briefing — what is the plant status, what needs attention first, and what will leadership ask about.",
        description: "Starts the day with a clear plant status in under 30 seconds."
      },
      {
        title: "Shift Handover Draft",
        type: "handover-brief",
        prompt: "Draft a shift handover note the next supervisor can understand in under one minute.",
        description: "Turns the live operating state into a short handover that sounds human and practical."
      },
      {
        title: "Root Cause Coach",
        type: "root-cause-coach",
        prompt: "Coach me through the most likely root causes and the first three checks my team should run today.",
        description: "Helps production and quality talk through causes instead of just staring at charts."
      },
      {
        title: "Leadership Update",
        type: "executive-brief",
        prompt: "Write a short leadership-ready brief with the change, owner, risk, and recovery path.",
        description: "Generates a tight executive narrative without robotic language."
      },
      {
        title: "Monthly Compare",
        type: "monthly-compare",
        prompt: "Compare the current month against the previous month and explain the operational difference in plain English.",
        description: "Translates month-on-month movement into a manager-readable narrative."
      },
      {
        title: "Weekly Forecast",
        type: "weekly-forecast",
        prompt: "Based on the current weekly pattern, tell me what is most likely to pressure the next shift or next week.",
        description: "Useful when you need a practical forecast, not a statistical lecture."
      },
      {
        title: "Quality Brief",
        type: "quality-brief",
        prompt: "Write a short quality meeting brief with top concern, containment, owner, and next check.",
        description: "Creates a focused note for daily quality review."
      },
      {
        title: "CAPA Draft",
        type: "capa-draft",
        prompt: "Draft a CAPA-style response with issue, suspected cause, containment, corrective action, and owner.",
        description: "Gets the team moving faster when a rejection spike needs structure."
      },
      {
        title: "Item Drilldown",
        type: "item-drilldown",
        prompt: `Break down the latest pressure around ${topAlert?.productName || "the highest-risk item"} and tell me what an operations manager should verify first.`,
        description: "Focuses one item deeply instead of giving a broad generic summary."
      },
      {
        title: "Anomaly Summary",
        type: "anomaly-summary",
        prompt: "Summarize the top anomalies by product, explain why each matters, and what should be checked next.",
        description: "Pulls the clearest abnormal product story into one readable brief."
      },
      {
        title: "Supervisor Talk Track",
        type: "supervisor-talk-track",
        prompt: "Write a short talk track a supervisor can use in a morning huddle with the team.",
        description: "Makes the AI output sound like a real floor conversation, not a report."
      },
      {
        title: "People Update",
        type: "people-update",
        prompt: "Write a team-facing update that is clear, calm, and specific about what matters today.",
        description: "Useful for morning standup or a WhatsApp-style internal update."
      },
      {
        title: "Escalation Email",
        type: "email-draft",
        prompt: "Draft an escalation email to plant leadership with the issue, impact, next action, and when we will update again.",
        description: "Creates a professional escalation note from the live plant context."
      },
      {
        title: "Executive WhatsApp",
        type: "executive-whatsapp",
        prompt: "Draft a very short executive WhatsApp-style update with issue, owner, and next check time.",
        description: "Useful when leadership wants a fast, human update on mobile."
      }
    ],
    nextThreeMoves: [
      {
        title: "Explain the deviation",
        detail: topAlert
          ? `${topAlert.code || topAlert.productName}: ${topAlert.latestRate}% — ${topAlert.delta}% above baseline.`
          : "No threshold breach — review the reject trend."
      },
      {
        title: "Confirm ownership",
        detail: plans[0]
          ? `"${plans[0].title}" — ${plans[0].owner_name}.`
          : "Assign an owner to the top open item."
      },
      {
        title: "Send one update upward",
        detail: "What changed. Who owns it. Next checkpoint."
      }
    ]
  };
}

function buildDashboardPayload() {
  const gemini = getGeminiConfig();

  const analytics = getAnalytics();
  const tasks = getTasks();
  const plans = getPlans();
  const reports = getReports();
  const handovers = getHandovers();
  const bundledWorkbook = getBundledWorkbookInfo();
  const latestImport = loadImportSummary();

  return {
    config: {
      aiEnabled: Boolean(gemini.apiKey),
      aiModel: gemini.apiKey ? gemini.model : "fallback-summary-engine",
      bundledWorkbook,
      latestImport
    },
    analytics,
    tasks,
    plans,
    reports,
    handovers,
    human: buildHumanLayer(analytics, tasks, plans, reports, handovers)
  };
}

function buildAiFactBase(dashboard) {
  const analytics = dashboard.analytics || {};
  const alerts = analytics.productAlerts || [];
  const topLoss = analytics.topProductsByLoss || [];
  const monthly = analytics.monthlyTrend || [];
  const weekly = analytics.weeklyTrend || [];
  const daily = analytics.dailySnapshot;

  const topAlert = alerts[0] || null;
  const secondAlert = alerts[1] || null;
  const topLossItem = topLoss[0] || null;
  const peakMonth = monthly.length
    ? [...monthly].sort((a, b) => b.rejectRate - a.rejectRate)[0]
    : null;
  const peakWeek = weekly.length
    ? [...weekly].sort((a, b) => b.rejectRate - a.rejectRate)[0]
    : null;
  const lastAlertRow = db
    .prepare(
      `SELECT report_date
       FROM rejection_records
       WHERE reject_pct >= 5
       ORDER BY report_date DESC
       LIMIT 1`
    )
    .get();
  const daysSinceLastAlert = lastAlertRow?.report_date
    ? Math.floor(
        (Date.now() - new Date(lastAlertRow.report_date).getTime()) / 86400000
      )
    : null;

  return {
    topAlert,
    secondAlert,
    topLossItem,
    peakMonth,
    peakWeek,
    latestMonthLabel: analytics.latestMonthLabel || "No data",
    previousMonthLabel: analytics.previousMonthLabel || "No data",
    latestWeekLabel: analytics.periodInsights?.latestWeekLabel || "No data",
    monthCount: analytics.periodInsights?.monthCount || 0,
    weekCount: analytics.periodInsights?.weekCount || 0,
    overallRate: analytics.overview?.latestRejectRate || 0,
    totalRejected: analytics.overview?.totalRejectQty || 0,
    itemsAbove5: analytics.overview?.productsAboveThreshold || 0,
    daysSinceLastAlert,
    lastDay: daily?.dateLabel || "No daily data",
    lastDayDate: daily?.date || null,
    lastDayProduced: daily?.totalProduced || 0,
    lastDayRejected: daily?.totalRejected || 0,
    lastDayRate: daily?.overallRate || 0,
    lastDayAbove5: daily?.itemsAbove5 || 0,
    lastDayTopItems: daily?.topItems || [],
    lastDayAlerts: daily?.aboveThreshold || [],
  };
}

function buildAiPrompt(type, payload, context, facts) {
  if (type === "daily-briefing") {
    return `You are a Quality Intelligence system for a medical
device manufacturing plant.

Write a concise morning briefing for the Quality Manager.
Use only the data provided — no assumptions, no generic advice.

═══ LAST RECORDED DAY: ${facts.lastDay} ═══

Total produced:  ${facts.lastDayProduced?.toLocaleString?.() || facts.lastDayProduced}
Total rejected:  ${facts.lastDayRejected?.toLocaleString?.() || facts.lastDayRejected}
Overall rate:    ${facts.lastDayRate}%
Items above 5%:  ${facts.lastDayAbove5}

Items recorded on this day (top 10 by rejected quantity):
${facts.lastDayTopItems?.map((item) =>
  `- ${item.itemCode}: produced=${item.produced}, rejected=${item.rejected}, avgPct=${item.avgPct}%`
).join("\n") || "No items recorded"}

Items that exceeded 5% on this day:
${facts.lastDayAlerts?.length
  ? facts.lastDayAlerts.map((item) =>
      `- ${item.itemCode}: ${item.avgPct}% (rejected ${item.rejected} of ${item.produced})`
    ).join("\n")
  : "None — all items within acceptable range"}

═══ MONTHLY CONTEXT ═══
Latest month: ${facts.latestMonthLabel}
Overall monthly rate: ${facts.overallRate}%
Highest risk item (all time): ${facts.topAlert?.productName || "None"} at ${facts.topAlert?.latestRate || 0}%

═══ INSTRUCTIONS ═══
Write the briefing in 3 sections:
1. SITUATION (2-3 sentences): What the numbers say about ${facts.lastDay}
2. PRIORITY TODAY (2-3 bullets): What needs action today specifically
3. WATCH LIST (1-2 items): What to monitor during the shift

Keep it under 200 words. Be specific — use item codes and numbers.
Do not use generic quality management language.`;
  }

  if (type === "handover-brief") {
    return `You are a Quality Intelligence system for a medical
device manufacturing plant.

Write a shift handover note that the outgoing shift
supervisor can use to brief the incoming team.
Use only the data provided.

═══ LAST RECORDED DAY: ${facts.lastDay} ═══

Production summary:
- Total produced: ${facts.lastDayProduced?.toLocaleString?.() || facts.lastDayProduced}
- Total rejected: ${facts.lastDayRejected?.toLocaleString?.() || facts.lastDayRejected}
- Overall reject rate: ${facts.lastDayRate}%

All items recorded on this day:
${facts.lastDayTopItems?.map((item) =>
  `- ${item.itemCode}: produced=${item.produced}, rejected=${item.rejected}, rate=${item.avgPct}%`
).join("\n") || "No items recorded"}

Items that exceeded 5% threshold on this day:
${facts.lastDayAlerts?.length
  ? facts.lastDayAlerts.map((item) =>
      `⚠ ${item.itemCode}: ${item.avgPct}% — rejected ${item.rejected} units`
    ).join("\n")
  : "None — clean shift"}

Monthly context:
- Month: ${facts.latestMonthLabel}
- Monthly overall rate: ${facts.overallRate}%
- Top risk item this month: ${facts.topAlert?.productName || "None"} at ${facts.topAlert?.latestRate || 0}%

═══ INSTRUCTIONS ═══
Write the handover note in this exact structure:

WHAT HAPPENED:
[2-3 sentences about the numbers on ${facts.lastDay}]

ITEMS THAT NEED FOLLOW-UP:
[bullet list of items that showed elevated reject rates]

WHAT THE NEXT SHIFT MUST DO:
[1-2 specific, actionable steps — use item codes]

STATUS:
[One word + one sentence: Focused / Steady / Watchful / Urgent + reason]

Be direct and specific. No generic quality management phrases.
The next supervisor should be able to read this in 60 seconds.`;
  }

  if (type === "root-cause-coach") {
    return `You are a Quality Intelligence system and root cause
analysis coach for a medical device manufacturing plant.

Guide the Quality Manager through a structured root cause
analysis for the rejection data from the last recorded day.
Use only the data provided — be specific, not generic.

═══ LAST RECORDED DAY: ${facts.lastDay} ═══

All items and their rejection data on this day:
${facts.lastDayTopItems?.map((item, idx) =>
  `${idx + 1}. ${item.itemCode}:
   Produced: ${item.produced} | Rejected: ${item.rejected}
   Rate: ${item.avgPct}% | Peak rate: ${item.maxPct}%
   Appeared ${item.occurrences} time(s) in records`
).join("\n\n") || "No items recorded"}

Items above 5% threshold:
${facts.lastDayAlerts?.length
  ? facts.lastDayAlerts.map((item) =>
      `🔴 ${item.itemCode}: ${item.avgPct}% avg, ${item.maxPct}% peak`
    ).join("\n")
  : "No items exceeded 5% — analysis applies to nearest elevated item"}

Monthly baseline for comparison:
- Month: ${facts.latestMonthLabel}
- Monthly overall rate: ${facts.overallRate}%
- Historically highest risk: ${facts.topAlert?.productName || "N/A"} at ${facts.topAlert?.latestRate || 0}%
- Second highest: ${facts.secondAlert?.productName || "N/A"} at ${facts.secondAlert?.latestRate || 0}%

═══ INSTRUCTIONS ═══
Structure your response in 4 sections:

FOCUS ITEM:
[Identify which item to investigate first and why — use the data]

POSSIBLE CAUSES (5-Why starter):
[List 4-5 specific possible causes based on what you know about
 this item's pattern. Start each with "Could be:"]

WHAT TO CHECK NOW:
[3-4 specific verification steps the supervisor can do
 in the next 30 minutes — name the item code]

DATA SIGNAL:
[What the numbers tell you: is this a spike or a pattern?
 Compare ${facts.lastDay} rate to the monthly baseline]

Be specific. Use item codes. No generic quality buzzwords.`;
  }

  return [
    "You are a highly practical operations copilot for a medical manufacturing plant.",
    "Write in natural, human English that a real operations leader would actually send to people.",
    "Avoid robotic filler, empty hype, or generic consulting language.",
    "Use only the numbers, products, months, and weeks present in the provided data context.",
    "Do not invent metrics. If data is missing, say it is unavailable.",
    "Mention exact live figures when they matter, especially rates, periods, anomaly deltas, and product names.",
    `Request type: ${type}`,
    `Data context: ${JSON.stringify(context)}`,
    `User request: ${payload.prompt || "Provide the strongest possible analysis from the current data."}`,
    "Use exactly three sections: Diagnosis, Actions, Executive Alert.",
    "If the request is people-facing, make the tone calm, direct, and human."
  ].join("\n");
}

function buildFallbackAiResponse(type, payload, dashboard) {
  const facts = buildAiFactBase(dashboard);
  const topAlert = facts.topAlert;
  const secondAlert = facts.secondAlert;
  const topLoss = facts.topLossItem;
  const peakMonth = facts.peakMonth;
  const peakWeek = facts.peakWeek;
  const overallRate = facts.overallRate;
  const baseHeader = `Priority signal: overall reject rate is ${overallRate}% in ${facts.latestMonthLabel}. ${topAlert ? `${topAlert.productName} is the clearest anomaly at ${topAlert.latestRate}% versus a ${topAlert.baselineRate}% baseline.` : "No product crossed the hard anomaly threshold in the latest cut."}`;

  if (type === "daily-briefing") {
    const day = facts.lastDay || "last recorded day";
    const rate = facts.lastDayRate || 0;
    const topDaily = facts.lastDayTopItems?.[0];
    const alerts = facts.lastDayAlerts || [];

    return `
## SITUATION

On ${day}, the plant recorded an overall reject rate
of ${rate}%.
${alerts.length > 0
  ? `${alerts.length} item(s) exceeded the 5% threshold.`
  : "No items exceeded the 5% threshold."}
${topDaily
  ? `Highest volume of rejection: ${topDaily.itemCode} with ${topDaily.rejected} units rejected (${topDaily.avgPct}%).`
  : ""}

## PRIORITY TODAY

${alerts.length > 0
  ? alerts.slice(0, 3).map((alert) =>
      `- ${alert.itemCode}: ${alert.avgPct}% — investigate root cause and assign owner`
    ).join("\n")
  : `- ${topDaily?.itemCode || "Monitor all items"} — verify production quality`}
- Review reject logs for ${day} with production supervisor
- Update task board with any new findings

## WATCH LIST

${facts.topAlert?.productName || topDaily?.itemCode || "Top item by volume"} — track this shift carefully.
${facts.overallRate > 2
  ? `Monthly rate (${facts.overallRate}%) remains elevated — daily vigilance required.`
  : `Monthly rate (${facts.overallRate}%) is within range — maintain current controls.`}
  `;
  }

  if (type === "daily-tasks") {
    return `${baseHeader}

Diagnosis:
- Today should start with a focused look at ${topAlert ? topAlert.productName : "the latest reject pattern"} in ${facts.latestMonthLabel}.

Actions:
- Review ${topAlert ? topAlert.productName : "the top anomaly"} first${secondAlert ? `, then confirm whether ${secondAlert.productName} is part of the same pattern` : ""}.
- Keep containment visible on the floor and decide whether ${topLoss ? `${topLoss.productName}` : "the highest-loss product"} needs a same-day corrective action or only an explanation upward.

Executive Alert:
- Leadership should get one short update by end of day with action owner, risk level, and next checkpoint for ${topAlert ? topAlert.productName : "the leading reject item"}.`;
  }

  if (type === "handover-brief") {
    const day = facts.lastDay || "last recorded day";
    const alerts = facts.lastDayAlerts || [];
    const allItems = facts.lastDayTopItems || [];

    return `
## WHAT HAPPENED

On ${day}, total production was
${facts.lastDayProduced?.toLocaleString?.() || facts.lastDayProduced} units
with ${facts.lastDayRejected?.toLocaleString?.() || facts.lastDayRejected} units
rejected (${facts.lastDayRate}% overall rate).
${alerts.length > 0
  ? `${alerts.length} item(s) exceeded the 5% reject threshold.`
  : "All items stayed within the 5% threshold."}

## ITEMS THAT NEED FOLLOW-UP

${allItems.length > 0
  ? allItems.slice(0, 5).map((item) =>
      `- ${item.itemCode}: ${item.avgPct}% reject rate (${item.rejected} rejected of ${item.produced} produced)`
    ).join("\n")
  : "- No items flagged for follow-up"}

## WHAT THE NEXT SHIFT MUST DO

${alerts.length > 0
  ? `- Priority check on ${alerts[0].itemCode} — was at ${alerts[0].avgPct}%, above threshold`
  : "- Routine quality check — no items above threshold on this shift"}
- Log any new observations in the task board

## STATUS

${alerts.length >= 3
  ? "Urgent — multiple items above threshold, requires immediate attention"
  : alerts.length >= 1
  ? "Watchful — one or more items above threshold, monitor closely"
  : "Steady — shift ended within normal rejection parameters"}
  `;
  }

  if (type === "root-cause-coach") {
    const focus = facts.lastDayAlerts?.[0] || facts.lastDayTopItems?.[0];
    const day = facts.lastDay || "last recorded day";

    return `
## FOCUS ITEM

${focus
  ? `${focus.itemCode} recorded a ${focus.avgPct}% reject rate on ${day} (${focus.rejected} units rejected of ${focus.produced} produced).`
  : `No single item stands out — investigate the highest-volume item from ${day}.`}
${focus && focus.avgPct > facts.overallRate
  ? `This is above the monthly average of ${facts.overallRate}% — a pattern worth investigating.`
  : ""}

## POSSIBLE CAUSES (5-Why starter)

- Could be: raw material batch variation for ${focus?.itemCode || "this item"}
- Could be: machine calibration drift during this production run
- Could be: operator process deviation (check shift log)
- Could be: tooling wear — when was the last maintenance?
- Could be: environmental factor (temperature, humidity) during this run

## WHAT TO CHECK NOW

- Pull the production batch log for ${focus?.itemCode || "the flagged item"} on ${day}
- Check machine settings vs standard specifications
- Interview the operator who ran this batch
- Compare with previous runs of the same item — was this rate unusual?

## DATA SIGNAL

${focus
  ? `${focus.itemCode} shows ${focus.avgPct}% on ${day} vs monthly overall of ${facts.overallRate}%.`
  : ""}
${(focus?.avgPct || 0) > 10
  ? "This is a significant spike — likely an acute event, not a chronic issue."
  : (focus?.avgPct || 0) > 5
  ? "This is an elevated rate — could be trending upward, needs comparison with prior days."
  : "Rate is borderline — watch trend over next 2-3 shifts."}
  `;
  }

  if (type === "monthly-compare") {
    return `${baseHeader}

Diagnosis:
- The first useful comparison is not just the rate itself, but what meaningfully changed between ${facts.previousMonthLabel} and ${facts.latestMonthLabel}. ${peakMonth ? `${peakMonth.label} remains the strongest monthly pressure point at ${peakMonth.rejectRate}%.` : ""}

Actions:
- Call out the highest-risk item first, then the top-loss item, and keep the language plain enough for both operations and leadership.
- Keep the language plain enough for both operations and leadership.

Executive Alert:
- If one item moved sharply while overall rate stayed stable, leadership will expect a direct explanation, not a generic trend summary.`;
  }

  if (type === "weekly-forecast") {
    return `${baseHeader}

Diagnosis:
- Weekly movement suggests where the next pressure point is likely to appear if no action changes. ${peakWeek ? `${peakWeek.label} was the strongest recent weekly signal at ${peakWeek.rejectRate}%.` : ""}

Actions:
- Watch ${topAlert ? topAlert.productName : "the highest-risk item"}, confirm containment ownership, and prepare one update checkpoint before the next shift transition.
- Treat forecast as directional guidance, not certainty.

Executive Alert:
- If the next weekly cycle confirms the same rise, escalate immediately with a recovery plan.`;
  }

  if (type === "quality-brief") {
    return `${baseHeader}

Diagnosis:
- Quality leadership needs the shortest possible view of what changed and why it matters. Right now that means ${topAlert ? `${topAlert.productName} at ${topAlert.latestRate}%` : "no single product crossing the hard line"}.

Actions:
- State the issue, containment already in place, who owns the next action, and when the next check happens for ${facts.latestWeekLabel}.
- Keep the brief tight enough to read aloud in a daily meeting.

Executive Alert:
- The brief should reduce debate, not create more of it.`;
  }

  if (type === "capa-draft") {
    return `${baseHeader}

Diagnosis:
- Start the CAPA draft with the problem statement in measurable terms: overall reject rate is ${overallRate}% in ${facts.latestMonthLabel}${topAlert ? `, and ${topAlert.productName} is ${topAlert.delta}% above baseline` : ""}.

Actions:
- Capture suspected cause, immediate containment, corrective action, and owner.
- Make it explicit what evidence still needs to be confirmed.

Executive Alert:
- A weak CAPA draft wastes time later, so keep accountability and verification visible from the start.`;
  }

  if (type === "item-drilldown") {
    return `${baseHeader}

Diagnosis:
- The right drilldown is narrow: focus on ${topAlert ? topAlert.productName : "the leading item"}, isolate what changed, and avoid drowning the team in unrelated noise.

Actions:
- Check the latest machine behavior, material shift, handover quality, and whether ${topLoss ? topLoss.productName : "one product family"} is carrying most of the loss.
- Confirm whether the rise is concentrated in one item family or spreading.

Executive Alert:
- If the same item stays elevated for another cycle, leadership will expect a named owner and dated recovery path.`;
  }

  if (type === "anomaly-summary") {
    return `${baseHeader}

Diagnosis:
- The anomaly story should rank the top abnormal products by business relevance, not by technical detail alone. ${topAlert ? `${topAlert.productName} is first` : "No dominant anomaly is visible"}${secondAlert ? ` and ${secondAlert.productName} is second.` : "."}

Actions:
- Pull the top anomalies, state the current rate versus normal baseline, and identify why ${topAlert ? topAlert.productName : "the latest anomaly"} needs immediate containment first.
- Keep one paragraph per anomaly at most.

Executive Alert:
- If more than one product is rising together, call that out as a broader system signal, not an isolated issue.`;
  }

  if (type === "supervisor-talk-track") {
    return `${baseHeader}

Diagnosis:
- Supervisors need a script they can say out loud in under two minutes, anchored on ${topAlert ? topAlert.productName : "the current leading item"} and the latest weekly checkpoint ${facts.latestWeekLabel}.

Actions:
- Keep the talk track direct: what changed, why ${topAlert ? topAlert.productName : "the current anomaly"} matters, who owns the first check, and when the team will hear the next update.
- Use floor language, not report language.

Executive Alert:
- If the team leaves the huddle unclear on priorities, the message failed even if the wording sounded good.`;
  }

  if (type === "people-update") {
    return `${baseHeader}

Diagnosis:
- The team needs a calm and clear message, not alarm language, especially with ${topAlert ? topAlert.productName : "the current reject pattern"} still leading the pressure picture.

Actions:
- Tell people where to focus first, what is already under control, and whether ${topAlert ? topAlert.productName : "the current product mix"} changes that focus.

Executive Alert:
- Keep the message practical so the floor can act on it immediately.`;
  }

  if (type === "email-draft") {
    return `${baseHeader}

Diagnosis:
- A short escalation email is enough if it includes the operational change and business impact. The cleanest signal is overall reject rate at ${overallRate}%${topAlert ? ` and ${topAlert.productName} at ${topAlert.latestRate}%` : ""}.

Actions:
- State the issue, the current owner, containment in motion, and that the next update will be sent after the ${facts.latestWeekLabel} checkpoint.

Executive Alert:
- Avoid long technical paragraphs. Leadership needs the decision-ready version.`;
  }

  if (type === "executive-whatsapp") {
    return `${baseHeader}

Diagnosis:
- Leadership on mobile needs the sharpest possible summary with no extra explanation.

Actions:
- Write one short update with issue, owner, current containment, and the next check time linked to ${facts.latestWeekLabel}.
- Keep it crisp enough to send as a single message.

Executive Alert:
- Short does not mean vague. The owner and next checkpoint must stay visible.`;
  }

  if (type === "executive-brief") {
    return `${baseHeader}

Diagnosis:
- The rejection trend requires a fast operational response before it turns into sustained loss. ${peakMonth ? `${peakMonth.label} is still the peak month at ${peakMonth.rejectRate}% reject rate.` : ""}

Actions:
- Keep daily eyes on anomalies and threshold breaches, and make the owner visible in every update for ${topAlert ? topAlert.productName : "the leading reject items"}.

Executive Alert:
- This week's priority is to lock a reliable baseline and maintain accountability around the highest-risk item.`;
  }

  return `${baseHeader}

Diagnosis:
- Compare ${facts.latestMonthLabel} against ${facts.previousMonthLabel} before taking action, then use the latest weekly window ${facts.latestWeekLabel} to check whether the signal is repeating.

Actions:
- Separate run-level movement from item-level movement so the decision stays precise, especially around ${topAlert ? topAlert.productName : "the highest-risk item"} and ${topLoss ? topLoss.productName : "the highest-loss product"}.
- Use the human workspace to document the situation in plain language, not just percentages.

Executive Alert:
- The team should always know what changed, who owns it, and when the next update is due.`;
}

async function generateAiResponse(type, payload, dashboard) {
  const gemini = getGeminiConfig();

  if (!gemini.apiKey) {
    return {
      provider: "fallback",
      content: buildFallbackAiResponse(type, payload, dashboard)
    };
  }

  const facts = buildAiFactBase(dashboard);
  const context = {
    overview: dashboard.analytics.overview,
    periodInsights: dashboard.analytics.periodInsights,
    productAlerts: dashboard.analytics.productAlerts.slice(0, 6),
    plans: dashboard.plans.slice(0, 4),
    tasks: dashboard.tasks.slice(0, 5),
    handovers: dashboard.handovers.slice(0, 3),
    humanHeadline: dashboard.human.humanHeadline,
    topAlert: facts.topAlert,
    secondAlert: facts.secondAlert,
    topLossItem: facts.topLossItem,
    peakMonth: facts.peakMonth,
    peakWeek: facts.peakWeek,
    latestMonthLabel: facts.latestMonthLabel,
    previousMonthLabel: facts.previousMonthLabel,
    latestWeekLabel: facts.latestWeekLabel,
    monthCount: facts.monthCount,
    weekCount: facts.weekCount,
    overallRate: facts.overallRate,
    totalRejected: facts.totalRejected,
    itemsAbove5: facts.itemsAbove5,
    daysSinceLastAlert: facts.daysSinceLastAlert,
  };

  const prompt = buildAiPrompt(type, payload, context, facts);

  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}/${gemini.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": gemini.apiKey
      },
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Gemini request failed with ${response.status}: ${errorText.slice(0, 300)}`);
      return {
        provider: "fallback",
        content: buildFallbackAiResponse(type, payload, dashboard)
      };
    }

    const jsonResponse = await response.json();
    const content =
      jsonResponse?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim() ||
      buildFallbackAiResponse(type, payload, dashboard);

    return {
      provider: gemini.model,
      content
    };
  } catch (error) {
    console.warn(`Gemini request failed: ${error.message || "Unknown error"}`);
    return {
      provider: "fallback",
      content: buildFallbackAiResponse(type, payload, dashboard)
    };
  }
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/session" && req.method === "GET") {
    const session = getSessionFromRequest(req);
    if (!session) {
      json(res, 401, {
        error: "No valid session token",
        hint: "Send x-session-token header",
      });
      return true;
    }
    json(res, 200, {
      actor: session.actor,
      role: session.role,
      lastSeen: session.last_seen,
      permissions: ROLE_PERMISSIONS[session.role] || [],
    });
    return true;
  }

  if (pathname === "/api/session" && req.method === "PATCH") {
    const session = getSessionFromRequest(req);
    if (!session) {
      json(res, 401, { error: "No valid session token" });
      return true;
    }
    const body = await readBody(req);
    const actor = String(body.actor || "").trim();
    if (!actor) {
      json(res, 400, { error: "actor name required" });
      return true;
    }

    db.prepare(
      "UPDATE user_sessions SET actor = ?, last_seen = CURRENT_TIMESTAMP WHERE token = ?"
    ).run(actor, session.token);

    auditLog({
      actor: session.actor,
      action: "UPDATE",
      entity: "user_sessions",
      entityId: String(session.id),
      field: "actor",
      oldValue: session.actor,
      newValue: actor,
      ip: getClientIp(req),
    });

    json(res, 200, {
      ok: true,
      actor,
      role: session.role,
      lastSeen: new Date().toISOString(),
      permissions: ROLE_PERMISSIONS[session.role] || [],
    });
    return true;
  }

  if (pathname === "/api/sessions" && req.method === "GET") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "roles:assign")) {
      return true;
    }
    const rows = db.prepare(
      "SELECT id, actor, role, created_at, last_seen FROM user_sessions ORDER BY actor ASC"
    ).all();
    json(res, 200, rows);
    return true;
  }

  if (pathname.startsWith("/api/sessions/") && req.method === "PATCH") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "roles:assign")) {
      return true;
    }
    const sessionId = Number(pathname.split("/").at(-1));
    if (!sessionId) {
      json(res, 400, { error: "Invalid session id" });
      return true;
    }
    const body = await readBody(req);
    if (!VALID_SESSION_ROLES.includes(body.role)) {
      json(res, 400, { error: "Invalid role" });
      return true;
    }
    const current = db.prepare(
      "SELECT id, actor, role FROM user_sessions WHERE id = ?"
    ).get(sessionId);
    if (!current) {
      json(res, 404, { error: "Session not found" });
      return true;
    }

    db.prepare(
      "UPDATE user_sessions SET role = ? WHERE id = ?"
    ).run(body.role, sessionId);

    auditLog({
      actor: session.actor,
      action: "UPDATE",
      entity: "user_sessions",
      entityId: String(sessionId),
      field: "role",
      oldValue: current.role,
      newValue: body.role,
      ip: getClientIp(req),
    });
    json(res, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/sessions" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "roles:assign")) {
      return true;
    }
    const body = await readBody(req);
    const actor = (body.actor || "").trim();
    const role = VALID_SESSION_ROLES.includes(body.role) ? body.role : "viewer";
    if (!actor) {
      json(res, 400, { error: "actor name required" });
      return true;
    }
    const token = `aimais-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const result = db.prepare(
      "INSERT INTO user_sessions (actor, role, token) VALUES (?,?,?)"
    ).run(actor, role, token);
    auditLog({
      actor: session.actor,
      action: "CREATE",
      entity: "user_sessions",
      entityId: String(result.lastInsertRowid),
      newValue: { actor, role },
      ip: getClientIp(req),
    });
    json(res, 201, { id: Number(result.lastInsertRowid), actor, role, token });
    return true;
  }

  if (pathname === "/api/audit" && req.method === "GET") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "audit:view")) {
      return true;
    }
    json(res, 200, getAuditTrail());
    return true;
  }

  if (pathname === "/api/dashboard" && req.method === "GET") {
    checkAndImportIfChanged().catch((error) =>
      console.error("[AutoImport] Dashboard trigger failed:", error.message)
    );

    json(res, 200, buildDashboardPayload());
    return true;
  }

  if (pathname === "/api/file-status" && req.method === "GET") {
    const record = getWatchRecord();
    const currentMtime = getFileMtime();
    const fileExists = currentMtime > 0;
    const storedMtime = Number(record?.last_mtime_ms || 0);
    const hasNewData = fileExists && currentMtime > storedMtime;

    json(res, 200, {
      fileExists,
      hasNewData,
      isImporting: importInProgress,
      status: record?.status || "unknown",
      lastImportAt: record?.last_import_at || null,
      lastCheckAt: record?.last_check_at || null,
      rowCount: record?.row_count || 0,
      fileMtime: fileExists
        ? new Date(currentMtime).toISOString()
        : null,
      lastImportMtime: storedMtime > 0
        ? new Date(storedMtime).toISOString()
        : null,
    });
    return true;
  }

  if (pathname === "/api/reject/pareto" && req.method === "GET") {
    json(res, 200, getRejectPareto());
    return true;
  }

  if (pathname === "/api/reject/items-by-pct" && req.method === "GET") {
    json(res, 200, getTopItemsByPct());
    return true;
  }

  if (pathname === "/api/reject/product" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const code = url.searchParams.get("code") || "";
    if (!code) {
      json(res, 400, { error: "code param required" });
      return true;
    }

    const rows = db.prepare(`
      SELECT report_date,
             produced_qty,
             rejected_qty,
             reject_pct
      FROM rejection_records
      WHERE item_code = ?
      ORDER BY report_date ASC
    `).all(code);

    const byMonth = new Map();
    for (const r of rows) {
      const mk = r.report_date.slice(0, 7);
      if (!byMonth.has(mk)) {
        byMonth.set(mk, { produced: 0, rejected: 0, pcts: [] });
      }
      byMonth.get(mk).produced += r.produced_qty || 0;
      byMonth.get(mk).rejected += r.rejected_qty || 0;
      byMonth.get(mk).pcts.push(r.reject_pct || 0);
    }

    const totalProduced = rows.reduce(
      (s, r) => s + (r.produced_qty || 0), 0
    );
    const totalRejected = rows.reduce(
      (s, r) => s + (r.rejected_qty || 0), 0
    );
    const allPcts = rows.map((r) => r.reject_pct || 0);
    const avgPct = allPcts.length
      ? allPcts.reduce((a, b) => a + b, 0) / allPcts.length : 0;
    const maxPct = allPcts.length ? Math.max(...allPcts) : 0;

    json(res, 200, {
      code,
      totalProduced: Number(totalProduced.toFixed(2)),
      totalRejected: Number(totalRejected.toFixed(2)),
      avgRejectPct: formatPct(avgPct),
      maxRejectPct: formatPct(maxPct),
      occurrences: rows.length,
      byMonth: [...byMonth.entries()].map(([mk, d]) => ({
        monthKey: mk,
        label: toMonthLabel(mk),
        produced: Number(d.produced.toFixed(2)),
        rejected: Number(d.rejected.toFixed(2)),
        avgPct: formatPct(
          d.pcts.length
            ? d.pcts.reduce((a, b) => a + b, 0) / d.pcts.length : 0
        ),
      })),
    });
    return true;
  }

  if (pathname === "/api/import/history" && req.method === "GET") {
    json(res, 200, getImportHistory());
    return true;
  }

  if (pathname === "/api/reject/all" && req.method === "DELETE") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "reject:delete-all")) {
      return true;
    }
    const body = await readBody(req);
    if ((body.confirmToken || "").trim() !== CLEAR_ALL_CONFIRM_TOKEN) {
      json(res, 403, { error: "Confirmation token is required to delete all rejection records." });
      return true;
    }

    db.prepare("DELETE FROM rejection_records").run();
    db.prepare("DELETE FROM import_history").run();
    writeFileSync(CACHE_PATH, JSON.stringify(buildEmptyAnalytics(), null, 2));
    writeFileSync(IMPORT_SUMMARY_PATH, "null");
    updateWatchRecord({
      last_mtime_ms: 0,
      last_import_at: null,
      row_count: 0,
      status: "never_imported",
    });
    auditLog({
      actor: session.actor,
      action: "DELETE_ALL",
      entity: "rejection_records",
      field: "all",
      newValue: "All rejection and import history cleared",
      ip: getClientIp(req),
    });
    json(res, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/tasks" && req.method === "GET") {
    const rows = db.prepare(
      `SELECT * FROM daily_tasks
       ORDER BY
         CASE priority WHEN 'high' THEN 0
                       WHEN 'medium' THEN 1
                       ELSE 2 END,
         due_date ASC NULLS LAST,
         id DESC`
    ).all();
    json(res, 200, rows);
    return true;
  }

  if (pathname === "/api/tasks" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "tasks:write")) {
      return true;
    }
    const body = await readBody(req);
    const title = (body.title || "").trim();
    if (!title) {
      json(res, 400, { error: "Task title is required" });
      return true;
    }

    const result = db
      .prepare(
        `INSERT INTO daily_tasks (title, owner_name, due_date, status, priority, progress_note, progress_percent, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .run(
        title,
        (body.ownerName || "Quality Manager").trim(),
        body.dueDate || null,
        body.status || "new",
        body.priority || "medium",
        body.progressNote || "",
        Number(body.progressPercent || 0)
      );

    auditLog({
      actor: session.actor,
      action: "CREATE",
      entity: "daily_tasks",
      entityId: String(result.lastInsertRowid),
      newValue: { title, ownerName: body.ownerName || "Quality Manager" },
      ip: getClientIp(req),
    });
    json(res, 201, { id: Number(result.lastInsertRowid) });
    return true;
  }

  if (pathname.startsWith("/api/tasks/") && req.method === "PATCH") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "tasks:write")) {
      return true;
    }
    const taskId = Number(pathname.split("/").at(-1));
    if (!taskId) {
      json(res, 400, { error: "Invalid task id" });
      return true;
    }

    const body = await readBody(req);
    const current = db.prepare("SELECT * FROM daily_tasks WHERE id = ?").get(taskId);
    if (!current) {
      json(res, 404, { error: "Task not found" });
      return true;
    }

    db.prepare(
      `UPDATE daily_tasks
       SET status = ?,
           progress_note = ?,
           progress_percent = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      body.status !== undefined ? body.status : current.status,
      body.progressNote !== undefined ? body.progressNote : current.progress_note,
      body.progressPercent !== undefined ? Number(body.progressPercent) : current.progress_percent,
      taskId
    );
    auditLog({
      actor: session.actor,
      action: "UPDATE",
      entity: "daily_tasks",
      entityId: String(taskId),
      newValue: {
        status: body.status !== undefined ? body.status : current.status,
        progressNote: body.progressNote !== undefined ? body.progressNote : current.progress_note,
        progressPercent: body.progressPercent !== undefined ? Number(body.progressPercent) : current.progress_percent,
      },
      ip: getClientIp(req),
    });
    json(res, 200, { ok: true });
    return true;
  }

  if (pathname.startsWith("/api/tasks/") && req.method === "DELETE") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "tasks:delete")) {
      return true;
    }
    const taskId = Number(pathname.split("/").at(-1));
    if (!taskId) {
      json(res, 400, { error: "Invalid task id" });
      return true;
    }

    const result = db.prepare("DELETE FROM daily_tasks WHERE id = ?").run(taskId);
    if (!result.changes) {
      json(res, 404, { error: "Task not found" });
      return true;
    }

    auditLog({
      actor: session.actor,
      action: "DELETE",
      entity: "daily_tasks",
      entityId: String(taskId),
      ip: getClientIp(req),
    });
    json(res, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/targets" && req.method === "GET") {
    json(res, 200, getTargets());
    return true;
  }

  if (pathname === "/api/targets" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "reports:generate")) {
      return true;
    }
    const body = await readBody(req);
    const metric = String(body.metric || "").trim();
    const targetPct = Number(body.target_pct);
    if (!metric || !/^[a-z0-9_-]+$/i.test(metric) || !Number.isFinite(targetPct)) {
      json(res, 400, { error: "metric and target_pct are required" });
      return true;
    }

    await runCommand("sqlite3", [
      DB_PATH,
      `INSERT INTO kpi_targets (metric, target_pct, updated_at)
       VALUES ('${metric}', ${targetPct}, CURRENT_TIMESTAMP)
       ON CONFLICT(metric) DO UPDATE SET
         target_pct = excluded.target_pct,
         updated_at = CURRENT_TIMESTAMP;`,
    ]);

    const target = getTargets().find((item) => item.metric === metric) || null;

    auditLog({
      actor: session.actor,
      action: "UPSERT",
      entity: "kpi_targets",
      entityId: metric,
      field: "target_pct",
      newValue: targetPct,
      ip: getClientIp(req),
    });
    json(res, 200, { ok: true, target });
    return true;
  }

  if (pathname === "/api/plans" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "plans:write")) {
      return true;
    }
    const body = await readBody(req);
    const title = (body.title || "").trim();
    const objective = (body.objective || "").trim();
    if (!title || !objective) {
      json(res, 400, { error: "Plan title and objective are required" });
      return true;
    }

    const result = db
      .prepare(
        `INSERT INTO future_plans (title, horizon_label, objective, owner_name, status, impact_score)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        title,
        body.horizonLabel || "30 days",
        objective,
        body.ownerName || "Operations Team",
        body.status || "planned",
        Number(body.impactScore || 80)
      );

    auditLog({
      actor: session.actor,
      action: "CREATE",
      entity: "future_plans",
      entityId: String(result.lastInsertRowid),
      newValue: { title, objective },
      ip: getClientIp(req),
    });
    json(res, 201, { id: Number(result.lastInsertRowid) });
    return true;
  }

  if (pathname === "/api/plans" && req.method === "GET") {
    json(res, 200, getPlans());
    return true;
  }

  if (pathname.startsWith("/api/plans/") && req.method === "DELETE") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "plans:delete")) {
      return true;
    }
    const planId = Number(pathname.split("/").at(-1));
    if (!planId) {
      json(res, 400, { error: "Invalid plan id" });
      return true;
    }

    const result = db.prepare("DELETE FROM future_plans WHERE id = ?").run(planId);
    if (!result.changes) {
      json(res, 404, { error: "Plan not found" });
      return true;
    }

    auditLog({
      actor: session.actor,
      action: "DELETE",
      entity: "future_plans",
      entityId: String(planId),
      ip: getClientIp(req),
    });
    json(res, 200, { ok: true });
    return true;
  }

  if (pathname.startsWith("/api/plans/") && req.method === "PATCH") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "plans:write")) {
      return true;
    }
    const planId = Number(pathname.split("/").at(-1));
    if (!planId) {
      json(res, 400, { error: "Invalid plan id" });
      return true;
    }

    const body = await readBody(req);
    const current = db.prepare(
      "SELECT * FROM future_plans WHERE id = ?"
    ).get(planId);

    if (!current) {
      json(res, 404, { error: "Plan not found" });
      return true;
    }

    db.prepare(
      `UPDATE future_plans
       SET title        = ?,
           horizon_label = ?,
           objective    = ?,
           owner_name   = ?,
           status       = ?,
           impact_score = ?
       WHERE id = ?`
    ).run(
      body.title !== undefined ? body.title : current.title,
      body.horizonLabel !== undefined ? body.horizonLabel : current.horizon_label,
      body.objective !== undefined ? body.objective : current.objective,
      body.ownerName !== undefined ? body.ownerName : current.owner_name,
      body.status !== undefined ? body.status : current.status,
      body.impactScore !== undefined
        ? Number(body.impactScore)
        : current.impact_score,
      planId
    );

    auditLog({
      actor: session.actor,
      action: "UPDATE",
      entity: "future_plans",
      entityId: String(planId),
      newValue: {
        title: body.title !== undefined ? body.title : current.title,
        objective: body.objective !== undefined ? body.objective : current.objective,
        status: body.status !== undefined ? body.status : current.status,
      },
      ip: getClientIp(req),
    });
    json(res, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/handover" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "handover:write")) {
      return true;
    }
    const body = await readBody(req);
    const shiftLabel = (body.shiftLabel || "").trim();
    const speakerName = (body.speakerName || "").trim();
    const summary = (body.summary || "").trim();
    if (!shiftLabel || !speakerName || !summary) {
      json(res, 400, { error: "Shift label, speaker name, and summary are required" });
      return true;
    }

    const result = db
      .prepare(
        `INSERT INTO handover_notes (shift_label, speaker_name, summary, blockers, next_step, mood)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        shiftLabel,
        speakerName,
        summary,
        body.blockers || "",
        body.nextStep || "",
        body.mood || "steady"
      );

    auditLog({
      actor: session.actor,
      action: "CREATE",
      entity: "handover_notes",
      entityId: String(result.lastInsertRowid),
      newValue: { shiftLabel, speakerName },
      ip: getClientIp(req),
    });
    json(res, 201, { id: Number(result.lastInsertRowid) });
    return true;
  }

  if (pathname.startsWith("/api/handover/") && req.method === "DELETE") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "handover:delete")) {
      return true;
    }
    const noteId = Number(pathname.split("/").at(-1));
    if (!noteId) {
      json(res, 400, { error: "Invalid handover id" });
      return true;
    }

    const result = db
      .prepare("DELETE FROM handover_notes WHERE id = ?")
      .run(noteId);

    if (!result.changes) {
      json(res, 404, { error: "Handover note not found" });
      return true;
    }

    auditLog({
      actor: session.actor,
      action: "DELETE",
      entity: "handover_notes",
      entityId: String(noteId),
      ip: getClientIp(req),
    });
    json(res, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/reports/draft" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "reports:generate")) {
      return true;
    }
    const body = await readBody(req);
    const dashboard = buildDashboardPayload();
    const ai = await generateAiResponse("executive-brief", body, dashboard);
    json(res, 200, {
      provider: ai.provider,
      summary: ai.content,
      periodLabel: body.periodLabel || dashboard.analytics.latestMonthLabel,
      title: body.title || "AI-generated executive report",
      recipients: (body.recipients || "").trim()
    });
    return true;
  }

  if (pathname === "/api/reports/save" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "reports:generate")) {
      return true;
    }
    const body = await readBody(req);
    const finalSummary = (body.summary || "").trim();
    if (!finalSummary) {
      json(res, 400, { error: "Final report summary is required" });
      return true;
    }

    const dashboard = buildDashboardPayload();
    const topAlert = dashboard.analytics.productAlerts[0];
    const recipients = (body.recipients || "").trim();
    const emailRequested = Boolean(body.emailToRecipients) && Boolean(recipients);
    const reportTitle = body.title || "AI-generated executive report";
    const periodLabel = body.periodLabel || dashboard.analytics.latestMonthLabel;
    const result = db
      .prepare(
        `INSERT INTO executive_reports (title, period_label, summary, risks, recommendations, recipients, generated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        reportTitle,
        periodLabel,
        finalSummary,
        topAlert ? `Product ${topAlert.productName} reached ${topAlert.latestRate}% in the latest period.` : "No material risk classified.",
        "Adopt daily monitoring for high-risk products, keep ownership visible, and publish a short weekly executive update.",
        recipients,
        body.generatedBy || "manual-review"
      );

    let emailResult = null;
    if (emailRequested) {
      const summaryHtml = escapeHtml(finalSummary).replace(/\n/g, "<br />");
      const kpis = [
        ["Overall Reject Rate", `${dashboard.analytics.overview.latestRejectRate}%`],
        ["Total Rejected Qty", dashboard.analytics.overview.totalRejectQty.toLocaleString("en-US")],
        ["Products Above 5%", String(dashboard.analytics.overview.productsAboveThreshold)]
      ];
      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#17212b;background:#f5f7fa;padding:24px;">
          <div style="max-width:760px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px;border:1px solid #e6ecf2;">
            <h1 style="margin:0 0 8px;font-size:28px;">AIMAIS Manufacturing Plant</h1>
            <p style="margin:0 0 20px;color:#5c6b7a;">Period: ${escapeHtml(periodLabel)}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <thead>
                <tr>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #d8e1ea;">KPI</th>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #d8e1ea;">Value</th>
                </tr>
              </thead>
              <tbody>
                ${kpis
                  .map(
                    ([label, value]) => `
                      <tr>
                        <td style="padding:10px;border-bottom:1px solid #eef3f7;">${escapeHtml(label)}</td>
                        <td style="padding:10px;border-bottom:1px solid #eef3f7;">${escapeHtml(value)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
            <div style="font-size:15px;line-height:1.7;color:#22313f;margin-bottom:24px;">${summaryHtml}</div>
            <p style="margin:0;color:#6b7b8c;font-size:13px;">Sent by AIMAIS — AI Manufacturing Intelligence System</p>
          </div>
        </div>
      `;
      emailResult = await sendEmail(recipients, reportTitle, html);
    }

    auditLog({
      actor: session.actor,
      action: "CREATE",
      entity: "executive_reports",
      entityId: String(result.lastInsertRowid),
      newValue: { title: reportTitle, recipients },
      ip: getClientIp(req),
    });
    json(res, 201, {
      id: Number(result.lastInsertRowid),
      provider: body.generatedBy || "manual-review",
      recipients,
      emailRequested,
      emailResult
    });
    return true;
  }

  if (pathname === "/api/import/excel" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "import:excel")) {
      return true;
    }
    const body = await readBody(req);
    const fileName = sanitizeFilename(body.fileName);
    const contentBase64 = body.contentBase64 || "";
    if (!contentBase64) {
      json(res, 400, { error: "Excel file content is required" });
      return true;
    }

    const filePath = join(UPLOADS_DIR, `${Date.now()}-${fileName}`);
    writeFileSync(filePath, Buffer.from(contentBase64, "base64"));

    const result = await executeImportWorkflow({
      filePath,
      fileName,
      reason: `manual upload by ${session.actor}`,
      logPrefix: "[ManualImport]",
    });

    if (!result.ok) {
      json(res, result.statusCode || 500, {
        ok: false,
        error: result.error || "Import failed",
        detail: result.detail || "Unknown error"
      });
      return true;
    }

    auditLog({
      actor: session.actor,
      action: "IMPORT",
      entity: "rejection_records",
      entityId: fileName,
      newValue: {
        fileName,
        rowCount: result.importSummary?.rowCount || 0,
      },
      ip: getClientIp(req),
    });

    json(res, 200, {
      ok: true,
      fileName,
      importLog: result.importLog,
      latestMonthLabel: result.latestMonthLabel,
      totalRejectedQty: result.totalRejectedQty,
      rowCount: result.rowCount
    });
    return true;
  }

  if (pathname === "/api/import/bundled" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "import:excel")) {
      return true;
    }
    const bundledWorkbook = getBundledWorkbookInfo();
    if (!bundledWorkbook.available) {
      json(res, 404, { error: "No bundled workbook found in the project." });
      return true;
    }

    const result = await executeImportWorkflow({
      filePath: bundledWorkbook.path,
      fileName: bundledWorkbook.fileName,
      reason: `bundled import by ${session.actor}`,
      logPrefix: "[BundledImport]",
    });

    if (!result.ok) {
      json(res, result.statusCode || 500, {
        ok: false,
        error: result.error || "Import failed",
        detail: result.detail || "Unknown error"
      });
      return true;
    }

    auditLog({
      actor: session.actor,
      action: "IMPORT",
      entity: "rejection_records",
      entityId: bundledWorkbook.fileName,
      newValue: {
        fileName: bundledWorkbook.fileName,
        rowCount: result.importSummary?.rowCount || 0,
      },
      ip: getClientIp(req),
    });

    json(res, 200, {
      ok: true,
      fileName: bundledWorkbook.fileName,
      importLog: result.importLog,
      latestMonthLabel: result.latestMonthLabel,
      totalRejectedQty: result.totalRejectedQty,
      rowCount: result.rowCount
    });
    return true;
  }

  if (pathname === "/api/ai/generate" && req.method === "POST") {
    const session = getSessionFromRequest(req);
    if (!requirePermission(res, session, "ai:generate")) {
      return true;
    }
    const body = await readBody(req);
    const dashboard = buildDashboardPayload();
    const response = await generateAiResponse(body.type || "analysis", body, dashboard);
    json(res, 200, response);
    return true;
  }

  return false;
}

function resolveStaticPath(pathname) {
  const normalizedPathname = normalizePublicPathname(pathname);

  if (normalizedPathname === "/") {
    return join(PUBLIC_DIR, "index.html");
  }

  const normalized = normalize(join(PUBLIC_DIR, normalizedPathname));
  if (!normalized.startsWith(PUBLIC_DIR)) {
    return null;
  }

  if (existsSync(normalized) && !statSync(normalized).isDirectory()) {
    return normalized;
  }

  if (!extname(normalized)) {
    const htmlPath = `${normalized}.html`;
    if (existsSync(htmlPath) && !statSync(htmlPath).isDirectory()) {
      return htmlPath;
    }
  }

  return null;
}

function normalizePublicPathname(pathname) {
  if (pathname === "/aimais/public" || pathname === "/aimais/public/") {
    return "/";
  }

  if (pathname.startsWith("/aimais/public/")) {
    return pathname.slice("/aimais/public".length);
  }

  return pathname;
}

async function serveStatic(res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    notFound(res);
    return;
  }

  const stream = createReadStream(filePath);
  res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
  stream.pipe(res);
}

async function runStartupImport() {
  console.log("[Startup] Checking Excel file...");

  const currentMtime = getFileMtime();
  if (currentMtime === 0) {
    console.log("[Startup] Rejection_Slip_Report.xlsx not found");
    return;
  }

  const record = getWatchRecord();
  const storedMtime = Number(record?.last_mtime_ms || 0);
  const { total } = db.prepare(
    "SELECT COUNT(*) AS total FROM rejection_records"
  ).get();

  if (total === 0) {
    console.log("[Startup] DB empty - importing now");
    await runAutoImport("startup: DB empty");
    return;
  }

  if (currentMtime > storedMtime) {
    console.log(
      `[Startup] File changed since last import (${new Date(storedMtime).toISOString()} -> ${new Date(currentMtime).toISOString()}) - importing`
    );
    await runAutoImport("startup: file changed");
    return;
  }

  console.log(
    `[Startup] DB has ${total} rows, file unchanged - skipping import`
  );
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/health") {
    const gemini = getGeminiConfig();
    json(res, 200, {
      ok: true,
      service: "aimais-dashboard",
      aiConfigured: Boolean(gemini.apiKey),
      aiModel: gemini.model,
      emailConfigured: Boolean(readTrimmedEnv("RESEND_API_KEY"))
    });
    return;
  }

  if (pathname.startsWith("/api/")) {
    try {
      const handled = await handleApi(req, res, pathname);
      if (!handled) {
        notFound(res);
      }
    } catch (error) {
      json(res, 500, { error: error.message || "Unexpected server error" });
    }
    return;
  }

  if (pathname === "/new.png") {
    const logoPath = join(ROOT, "new.png");
    if (existsSync(logoPath)) {
      const stream = createReadStream(logoPath);
      res.writeHead(200, { "Content-Type": "image/png" });
      stream.pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  if (pathname === "/favicon.ico") {
    const svgPath = join(PUBLIC_DIR, "favicon.svg");
    if (existsSync(svgPath)) {
      const stream = createReadStream(svgPath);
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      stream.pipe(res);
    } else {
      res.writeHead(204);
      res.end();
    }
    return;
  }

  await serveStatic(res, pathname);
});

const PORT = Number(process.env.PORT || 3000);
async function startServer() {
  await runStartupImport();
  server.listen(PORT, () => {
    console.log(`AIMAIS dashboard running on http://localhost:${PORT}`);
  });
}

startServer();
