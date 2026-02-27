"use strict";

const {
  fetchSecurityAuditLogsFromNetlify,
  writeSecurityAuditLog,
} = require("./_shared/audit-store");

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_ALLOWED_ROLES = ["super_admin", "company_admin"];
const LOCAL_ADMIN_ENABLED = String(process.env.AUDIT_LOCAL_ADMIN_ENABLED || "true").toLowerCase() === "true";
const LOCAL_ADMIN_TOKEN = String(
  process.env.AUDIT_LOCAL_ADMIN_TOKEN || process.env.LOCAL_ADMIN_ACCESS_TOKEN || "local-admin-access-token"
).trim();
const LOCAL_ADMIN_USER_ID = String(
  process.env.AUDIT_LOCAL_ADMIN_USER_ID || "11111111-1111-4111-8111-111111111111"
).trim();

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(payload),
});

const getHeader = (headers, key) => {
  if (!headers) return "";
  const direct = headers[key];
  if (typeof direct === "string") return direct;
  const lower = headers[key.toLowerCase()];
  if (typeof lower === "string") return lower;
  return "";
};

const getBearerToken = (headers) => {
  const auth = getHeader(headers, "authorization").trim();
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return auth.slice(7).trim();
};

const parseQuery = (event) => {
  const params = new URLSearchParams(event?.rawQuery || "");
  const fallback = event?.queryStringParameters || {};
  Object.entries(fallback).forEach(([key, value]) => {
    if (!params.has(key) && typeof value === "string") {
      params.set(key, value);
    }
  });

  const limitRaw = Number(params.get("limit") || DEFAULT_LIMIT);
  const offsetRaw = Number(params.get("offset") || 0);

  const normalizeDate = (value, mode) => {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return mode === "from" ? `${text}T00:00:00.000Z` : `${text}T23:59:59.999Z`;
    }
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    return parsed.toISOString();
  };

  return {
    limit: Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT) : DEFAULT_LIMIT,
    offset: Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0,
    action: String(params.get("action") || "").trim(),
    userId: String(params.get("userId") || "").trim(),
    tableName: String(params.get("tableName") || "").trim(),
    dateFrom: normalizeDate(params.get("dateFrom"), "from"),
    dateTo: normalizeDate(params.get("dateTo"), "to"),
    endpoint: String(params.get("endpoint") || "").trim().toLowerCase(),
    level: String(params.get("level") || "").trim().toLowerCase(),
    requestId: String(params.get("requestId") || "").trim().toLowerCase(),
  };
};

const toUuidOrEmpty = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return UUID_REGEX.test(text) ? text : "";
};

const getAllowedRoles = () => {
  const raw = String(process.env.AUDIT_VIEWER_ROLES || "").trim();
  if (!raw) {
    return DEFAULT_ALLOWED_ROLES;
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const resolveSupabaseAuthConfig = () => {
  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "").trim();
  const supabaseAnonKey = String(
    process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || ""
  ).trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return { supabaseUrl, supabaseAnonKey };
};

const resolveSupabaseServiceConfig = () => {
  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return { supabaseUrl, serviceRoleKey };
};

const verifySupabaseToken = async (token) => {
  const config = resolveSupabaseAuthConfig();
  if (!config) {
    return null;
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      return null;
    }
    const user = await response.json();
    return user || null;
  } catch {
    return null;
  }
};

const verifyLocalAdminToken = (token) => {
  if (!LOCAL_ADMIN_ENABLED) {
    return null;
  }
  if (!token || token !== LOCAL_ADMIN_TOKEN) {
    return null;
  }
  return {
    id: LOCAL_ADMIN_USER_ID,
    role: "super_admin",
    app_metadata: { role: "super_admin", provider: "local" },
    user_metadata: { role: "super_admin", source: "local" },
  };
};

const verifyRequestToken = async (token) => {
  if (!token) {
    return null;
  }
  const supabaseUser = await verifySupabaseToken(token);
  if (supabaseUser?.id) {
    return supabaseUser;
  }
  return verifyLocalAdminToken(token);
};

const isAuthorizedForGlobalView = (user) => {
  const allowedRoles = getAllowedRoles();
  const roleCandidates = [
    user?.app_metadata?.role,
    user?.user_metadata?.role,
    user?.role,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return roleCandidates.some((role) => allowedRoles.includes(role));
};

const extractEndpoint = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  return String(payload.endpoint || payload.path || payload?.meta?.url || "").trim();
};

const buildLogsQueryUrl = ({ baseUrl, filterUserId, query, fetchLimit }) => {
  const params = new URLSearchParams();
  params.set("select", "id,user_id,action,table_name,record_id,payload,created_at");
  params.set("order", "created_at.desc");
  params.set("limit", String(fetchLimit));
  params.set("offset", String(query.offset));

  if (query.action) {
    params.set("action", `eq.${query.action}`);
  }
  if (query.tableName) {
    params.set("table_name", `eq.${query.tableName}`);
  }
  if (query.dateFrom) {
    params.append("created_at", `gte.${query.dateFrom}`);
  }
  if (query.dateTo) {
    params.append("created_at", `lte.${query.dateTo}`);
  }
  if (filterUserId) {
    params.set("user_id", `eq.${filterUserId}`);
  }

  return `${baseUrl}/rest/v1/security_audit_logs?${params.toString()}`;
};

const filterLogsInMemory = (rows, query) =>
  rows.filter((row) => {
    const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
    const endpoint = extractEndpoint(payload).toLowerCase();
    const level = String(payload.level || "").toLowerCase();
    const requestId = String(payload.requestId || "").toLowerCase();

    if (query.endpoint && !endpoint.includes(query.endpoint)) {
      return false;
    }
    if (query.level && level !== query.level) {
      return false;
    }
    if (query.requestId && !requestId.includes(query.requestId)) {
      return false;
    }
    return true;
  });

const fetchAuditLogs = async ({ query, userId, canViewAll }) => {
  const config = resolveSupabaseServiceConfig();
  if (!config) {
    const fallback = await fetchSecurityAuditLogsFromNetlify({
      query,
      viewerUserId: userId,
      canViewAll,
    });
    return {
      rows: fallback.rows,
      hasMore: fallback.hasMore,
      scope: canViewAll ? "all" : "own",
    };
  }

  const requestedUserId = toUuidOrEmpty(query.userId);
  const filterUserId = canViewAll ? requestedUserId : userId;

  const requiresInMemoryFiltering = Boolean(query.endpoint || query.level || query.requestId);
  const fetchLimit = requiresInMemoryFiltering ? Math.min(MAX_LIMIT, 200) : query.limit + 1;

  const url = buildLogsQueryUrl({
    baseUrl: config.supabaseUrl,
    filterUserId,
    query,
    fetchLimit,
  });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "audit_logs_fetch_failed");
  }

  const raw = await response.json();
  const rows = Array.isArray(raw) ? raw : [];
  const filtered = requiresInMemoryFiltering ? filterLogsInMemory(rows, query) : rows;

  const hasMore = filtered.length > query.limit;
  const sliced = filtered.slice(0, query.limit);

  return {
    rows: sliced,
    hasMore,
    scope: canViewAll ? "all" : "own",
  };
};

exports.handler = async (event) => {
  const method = String(event?.httpMethod || "GET").toUpperCase();

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
      },
      body: "",
    };
  }

  if (method !== "GET") {
    return json(405, { error: "الطريقة غير مدعومة. استخدم GET فقط." });
  }

  const token = getBearerToken(event?.headers);
  if (!token) {
    return json(401, { error: "غير مصرح. يلزم توكن جلسة صالح." });
  }

  const user = await verifyRequestToken(token);
  if (!user?.id) {
    return json(401, { error: "فشل التحقق من الجلسة." });
  }

  const query = parseQuery(event);
  const canViewAll = isAuthorizedForGlobalView(user);

  try {
    const result = await fetchAuditLogs({
      query,
      userId: user.id,
      canViewAll,
    });

    void writeSecurityAuditLog({
      userId: toUuidOrEmpty(user.id) || null,
      action: "AUDIT_LOGS_VIEW",
      tableName: "audit_logs_viewer",
      payload: {
        scope: result.scope,
        filters: {
          action: query.action || null,
          userId: query.userId || null,
          tableName: query.tableName || null,
          endpoint: query.endpoint || null,
          level: query.level || null,
          requestId: query.requestId || null,
          dateFrom: query.dateFrom || null,
          dateTo: query.dateTo || null,
        },
        limit: query.limit,
        offset: query.offset,
        returned: result.rows.length,
      },
    });

    return json(200, {
      rows: result.rows,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        hasMore: result.hasMore,
      },
      scope: result.scope,
    });
  } catch (error) {
    return json(500, {
      error: "تعذر جلب سجلات التدقيق.",
      details: error instanceof Error ? error.message : "unknown_error",
    });
  }
};
