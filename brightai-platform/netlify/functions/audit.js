"use strict";

const { writeSecurityAuditLog } = require("./_shared/audit-store");

const RATE_LIMIT_PER_MINUTE = Number(process.env.AUDIT_RATE_LIMIT_PER_MINUTE || "120");
const RATE_LIMIT_WINDOW_MS = Number(process.env.AUDIT_RATE_LIMIT_WINDOW_MS || "60000");
const ALLOW_UNAUTH = String(process.env.AUDIT_ALLOW_UNAUTHENTICATED || "false").toLowerCase() === "true";
const AUDIT_LOGGING_ENABLED = String(process.env.AUDIT_LOGGING_ENABLED || "true").toLowerCase() !== "false";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_ADMIN_ENABLED = String(process.env.AUDIT_LOCAL_ADMIN_ENABLED || "false").toLowerCase() === "true";
const LOCAL_ADMIN_TOKEN = String(
  process.env.AUDIT_LOCAL_ADMIN_TOKEN || process.env.LOCAL_ADMIN_ACCESS_TOKEN || ""
).trim();
const LOCAL_ADMIN_USER_ID = String(
  process.env.AUDIT_LOCAL_ADMIN_USER_ID || "11111111-1111-4111-8111-111111111111"
).trim();

const rateStore = new Map();

const json = (statusCode, payload, extraHeaders = {}) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
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

const getClientIp = (event) => {
  const forwardedFor = getHeader(event?.headers, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return event?.ip || "unknown";
};

const pruneBucket = (bucket, now) => bucket.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

const enforceRateLimit = (key) => {
  const now = Date.now();
  const current = pruneBucket(rateStore.get(key) || [], now);
  if (current.length >= RATE_LIMIT_PER_MINUTE) {
    rateStore.set(key, current);
    const oldest = current[0];
    const retryAfterMs = Math.max(0, RATE_LIMIT_WINDOW_MS - (now - oldest));
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }
  current.push(now);
  rateStore.set(key, current);
  return { allowed: true, retryAfterSeconds: 0 };
};

const parseEventBody = (event) => {
  if (!event?.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(String(event.body), "base64").toString("utf8")
      : String(event.body);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const verifySupabaseToken = async (token) => {
  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "").trim();
  const supabaseAnonKey = String(
    process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || ""
  ).trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      return null;
    }
    const user = await response.json();
    return user?.id ? String(user.id) : null;
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
  return LOCAL_ADMIN_USER_ID;
};

const verifyRequestToken = async (token) => {
  const supabaseId = await verifySupabaseToken(token);
  if (supabaseId) {
    return supabaseId;
  }
  return verifyLocalAdminToken(token);
};

const sanitizePayload = (value) => {
  if (!value || typeof value !== "object") {
    return {};
  }
  try {
    const raw = JSON.stringify(value);
    // حد أقصى 16KB لكل سجل لتفادي الاستهلاك المبالغ فيه
    if (raw.length > 16384) {
      return { truncated: true, size: raw.length };
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const toUuidOrNull = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }
  return UUID_REGEX.test(text) ? text : null;
};

exports.handler = async (event) => {
  const method = String(event?.httpMethod || "POST").toUpperCase();

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      },
      body: "",
    };
  }

  if (method !== "POST") {
    return json(405, { error: "الطريقة غير مدعومة. استخدم POST فقط." });
  }

  if (!AUDIT_LOGGING_ENABLED) {
    return json(202, { ok: true, skipped: true, reason: "audit_disabled" });
  }

  const token = getBearerToken(event?.headers);
  let subject = "";

  if (!ALLOW_UNAUTH) {
    if (!token) {
      return json(401, { error: "غير مصرح. يلزم توكن جلسة صالح." });
    }
    subject = (await verifyRequestToken(token)) || "";
    if (!subject) {
      return json(401, { error: "فشل التحقق من الجلسة." });
    }
  } else {
    subject = token || "dev-anon";
  }

  const ip = getClientIp(event);
  const limiterKey = `${subject}:${ip}`;
  const limitState = enforceRateLimit(limiterKey);
  if (!limitState.allowed) {
    return json(
      429,
      { error: "تم تجاوز الحد المسموح مؤقتًا، حاول لاحقًا." },
      { "Retry-After": String(limitState.retryAfterSeconds) }
    );
  }

  const body = parseEventBody(event);
  const action = String(body?.action || "").trim() || "UNSPECIFIED_EVENT";
  const tableName = String(body?.tableName || "").trim() || "runtime";
  const level = String(body?.level || "info");
  const createdAt = String(body?.createdAt || new Date().toISOString());
  const payload = sanitizePayload(body?.payload);

  const writeResult = await writeSecurityAuditLog({
    userId: toUuidOrNull(subject),
    action,
    tableName,
    payload: {
      level,
      createdAt,
      sourceIp: ip,
      requestId: getHeader(event?.headers, "x-request-id"),
      ...payload,
    },
  });

  if (!writeResult.ok) {
    console.warn("AUDIT_WRITE_FALLBACK", {
      userId: subject,
      action,
      tableName,
      reason: writeResult.reason,
      payload,
    });
    return json(202, { ok: true, skipped: true, reason: writeResult.reason || "fallback_console" });
  }

  return json(201, { ok: true });
};
