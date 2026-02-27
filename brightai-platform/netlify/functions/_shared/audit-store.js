"use strict";

const { Pool } = require("pg");

let netlifyPool = null;
let netlifySchemaReadyPromise = null;

const resolveSupabaseConfig = () => {
  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { supabaseUrl, serviceRoleKey };
};

const resolveNetlifyDbConfig = () => {
  const connectionString = String(
    process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED || ""
  ).trim();
  if (!connectionString) {
    return null;
  }
  return { connectionString };
};

const getNetlifyPool = () => {
  const config = resolveNetlifyDbConfig();
  if (!config) {
    return null;
  }

  if (!netlifyPool) {
    netlifyPool = new Pool({
      connectionString: config.connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }

  return netlifyPool;
};

const ensureNetlifyAuditSchema = async () => {
  const pool = getNetlifyPool();
  if (!pool) {
    return { ok: false, reason: "missing_netlify_database_url" };
  }

  if (!netlifySchemaReadyPromise) {
    netlifySchemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS security_audit_logs (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NULL,
          action VARCHAR(100) NOT NULL,
          table_name VARCHAR(120) NOT NULL,
          record_id TEXT NULL,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at
        ON security_audit_logs (created_at DESC);
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action
        ON security_audit_logs (action);
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id
        ON security_audit_logs (user_id);
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_table_name
        ON security_audit_logs (table_name);
      `);
    })().catch((error) => {
      netlifySchemaReadyPromise = null;
      throw error;
    });
  }

  try {
    await netlifySchemaReadyPromise;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "netlify_audit_schema_failed",
    };
  }
};

const normalizeAction = (action) => String(action || "").trim().slice(0, 100) || "UNSPECIFIED_EVENT";
const normalizeTableName = (tableName) => String(tableName || "").trim().slice(0, 120) || "runtime";
const normalizePayload = (payload) => (payload && typeof payload === "object" ? payload : {});

const writeToSupabase = async ({ userId = null, action, tableName, payload }) => {
  const config = resolveSupabaseConfig();
  if (!config) {
    return { ok: false, skipped: true, reason: "missing_supabase_service_config" };
  }

  const body = {
    user_id: userId || null,
    action: normalizeAction(action),
    table_name: normalizeTableName(tableName),
    payload: normalizePayload(payload),
  };

  const response = await fetch(`${config.supabaseUrl}/rest/v1/security_audit_logs`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, skipped: false, reason: text || "supabase_insert_failed" };
  }

  return { ok: true, backend: "supabase" };
};

const writeToNetlifyPostgres = async ({ userId = null, action, tableName, payload }) => {
  const pool = getNetlifyPool();
  if (!pool) {
    return { ok: false, skipped: true, reason: "missing_netlify_database_url" };
  }

  const schema = await ensureNetlifyAuditSchema();
  if (!schema.ok) {
    return schema;
  }

  try {
    await pool.query(
      `
        INSERT INTO security_audit_logs (user_id, action, table_name, payload)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [
        userId || null,
        normalizeAction(action),
        normalizeTableName(tableName),
        JSON.stringify(normalizePayload(payload)),
      ]
    );
    return { ok: true, backend: "netlify_postgres" };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: error instanceof Error ? error.message : "netlify_insert_failed",
    };
  }
};

const writeSecurityAuditLog = async ({ userId = null, action, tableName, payload }) => {
  const supabaseResult = await writeToSupabase({ userId, action, tableName, payload });
  if (supabaseResult.ok) {
    return supabaseResult;
  }

  const netlifyResult = await writeToNetlifyPostgres({ userId, action, tableName, payload });
  if (netlifyResult.ok) {
    return {
      ok: true,
      backend: netlifyResult.backend,
      fallbackFrom: supabaseResult.reason || "supabase_unavailable",
    };
  }

  return {
    ok: false,
    skipped: Boolean(supabaseResult.skipped && netlifyResult.skipped),
    reason: `supabase:${supabaseResult.reason || "unknown"}|netlify:${netlifyResult.reason || "unknown"}`,
  };
};

const fetchSecurityAuditLogsFromNetlify = async ({ query, viewerUserId, canViewAll }) => {
  const pool = getNetlifyPool();
  if (!pool) {
    throw new Error("missing_netlify_database_url");
  }

  const schema = await ensureNetlifyAuditSchema();
  if (!schema.ok) {
    throw new Error(schema.reason || "netlify_audit_schema_failed");
  }

  const values = [];
  const where = [];

  const pushWhere = (clause, value) => {
    values.push(value);
    where.push(clause.replace("$", `$${values.length}`));
  };

  const action = String(query?.action || "").trim();
  const tableName = String(query?.tableName || "").trim();
  const dateFrom = String(query?.dateFrom || "").trim();
  const dateTo = String(query?.dateTo || "").trim();
  const endpoint = String(query?.endpoint || "").trim().toLowerCase();
  const level = String(query?.level || "").trim().toLowerCase();
  const requestId = String(query?.requestId || "").trim().toLowerCase();
  const requestedUserId = String(query?.userId || "").trim();

  if (action) pushWhere("action = $", action);
  if (tableName) pushWhere("table_name = $", tableName);
  if (dateFrom) pushWhere("created_at >= $", dateFrom);
  if (dateTo) pushWhere("created_at <= $", dateTo);
  if (endpoint) {
    pushWhere(
      "LOWER(COALESCE(payload->>'endpoint', payload->>'path', payload->'meta'->>'url', '')) LIKE $",
      `%${endpoint}%`
    );
  }
  if (level) pushWhere("LOWER(COALESCE(payload->>'level', '')) = $", level);
  if (requestId) pushWhere("LOWER(COALESCE(payload->>'requestId', '')) LIKE $", `%${requestId}%`);

  if (canViewAll) {
    if (requestedUserId) {
      pushWhere("user_id = $", requestedUserId);
    }
  } else {
    pushWhere("user_id = $", String(viewerUserId || ""));
  }

  const safeLimitRaw = Number(query?.limit || 50);
  const safeOffsetRaw = Number(query?.offset || 0);
  const safeLimit = Number.isFinite(safeLimitRaw) ? Math.min(Math.max(safeLimitRaw, 1), 200) : 50;
  const safeOffset = Number.isFinite(safeOffsetRaw) ? Math.max(safeOffsetRaw, 0) : 0;

  values.push(safeLimit + 1);
  const limitPlaceholder = `$${values.length}`;
  values.push(safeOffset);
  const offsetPlaceholder = `$${values.length}`;

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const querySql = `
    SELECT
      id::text AS id,
      user_id,
      action,
      table_name,
      record_id,
      payload,
      created_at
    FROM security_audit_logs
    ${whereSql}
    ORDER BY created_at DESC, id DESC
    LIMIT ${limitPlaceholder}
    OFFSET ${offsetPlaceholder}
  `;

  const result = await pool.query(querySql, values);
  const rows = Array.isArray(result?.rows) ? result.rows : [];
  const hasMore = rows.length > safeLimit;
  const sliced = rows.slice(0, safeLimit).map((row) => ({
    id: String(row.id || ""),
    user_id: row.user_id ? String(row.user_id) : null,
    action: String(row.action || ""),
    table_name: String(row.table_name || ""),
    record_id: row.record_id ? String(row.record_id) : null,
    payload: row.payload && typeof row.payload === "object" ? row.payload : {},
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at || new Date().toISOString()),
  }));

  return {
    rows: sliced,
    hasMore,
  };
};

module.exports = {
  fetchSecurityAuditLogsFromNetlify,
  writeSecurityAuditLog,
};
