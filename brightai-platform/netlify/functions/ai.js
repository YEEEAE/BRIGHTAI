"use strict";

const { writeSecurityAuditLog } = require("./_shared/audit-store");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const RATE_LIMIT_PER_MINUTE = Number(process.env.AI_RATE_LIMIT_PER_MINUTE || "30");
const RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || "60000");
const ALLOW_UNAUTH = String(process.env.AI_PROXY_ALLOW_UNAUTHENTICATED || "false").toLowerCase() === "true";
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

const normalizePath = (eventPath) =>
  String(eventPath || "/")
    .replace(/^\/\.netlify\/functions\/ai/, "")
    .replace(/^\/api\/ai/, "") || "/";

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

const extractText = (parts) =>
  Array.isArray(parts)
    ? parts
        .map((part) => (part && typeof part.text === "string" ? part.text : ""))
        .filter(Boolean)
        .join("\n")
    : "";

const normalizeMessagesToGemini = (messages) => {
  const safeMessages = Array.isArray(messages) ? messages : [];
  let systemPrompt = "";
  const contents = [];

  for (const message of safeMessages) {
    if (!message || typeof message !== "object") continue;
    const role = String(message.role || "user");
    const content = String(message.content || "");
    if (!content.trim()) continue;

    if (role === "system") {
      systemPrompt += `${content}\n`;
      continue;
    }

    contents.push({
      role: role === "assistant" ? "model" : "user",
      parts: [{ text: content }],
    });
  }

  const cleanedSystem = systemPrompt.trim();
  if (cleanedSystem) {
    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: cleanedSystem }],
      });
    } else {
      const first = contents[0];
      const firstText = extractText(first.parts);
      contents[0] = {
        role: first.role,
        parts: [{ text: `تعليمات النظام:\n${cleanedSystem}\n\n${firstText}`.trim() }],
      };
    }
  }

  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "ابدأ." }],
    });
  }

  return contents;
};

const resolveModel = (requestedModel) => {
  const model = String(requestedModel || "").trim();
  if (!model) return DEFAULT_MODEL;
  if (model.startsWith("gemini-")) return model;
  return DEFAULT_MODEL;
};

const mapFinishReason = (reason) => {
  const raw = String(reason || "").toUpperCase();
  if (raw.includes("STOP")) return "stop";
  if (raw.includes("MAX")) return "length";
  return null;
};

const getGeminiKey = (headers) =>
  getHeader(headers, "x-user-api-key").trim() ||
  String(process.env.GROQ_API_KEY || "").trim() ||
  String(process.env.GEMINI_API_KEY || "").trim();

const verifySupabaseToken = async (token) => {
  const supabaseUrl = String(process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const supabaseAnonKey = String(
    process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
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

const toUuidOrNull = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }
  return UUID_REGEX.test(text) ? text : null;
};

const writeAiAudit = async ({
  userId,
  method,
  path,
  statusCode,
  latencyMs,
  model,
  stream,
  ip,
  requestId,
  userAgent,
  error,
}) => {
  if (!AUDIT_LOGGING_ENABLED) {
    return;
  }

  const result = await writeSecurityAuditLog({
    userId: toUuidOrNull(userId),
    action: "AI_REQUEST",
    tableName: "ai_proxy",
    payload: {
      method,
      path,
      statusCode,
      latencyMs,
      model: model || null,
      stream: Boolean(stream),
      sourceIp: ip,
      requestId: requestId || null,
      userAgent: userAgent || null,
      error: error || null,
      release: process.env.REACT_APP_RELEASE || "",
      environment: process.env.NODE_ENV || "production",
    },
  });

  if (!result.ok) {
    console.warn("AI_AUDIT_FALLBACK", {
      userId,
      path,
      method,
      statusCode,
      reason: result.reason,
    });
  }
};

const handleModels = async (event) => {
  const apiKey = getGeminiKey(event.headers);
  if (!apiKey) {
    return json(500, { error: "مفتاح خدمة الذكاء غير مهيأ في الخادم." });
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    method: "GET",
    headers: {
      "X-goog-api-key": apiKey,
    },
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    return json(response.status, {
      error: "فشل جلب نماذج Gemini.",
      details: payload,
    });
  }

  return json(200, payload);
};

const handleChatCompletions = async (event) => {
  const body = parseEventBody(event);
  const model = resolveModel(body?.model);
  const stream = Boolean(body?.stream);
  const contents = normalizeMessagesToGemini(body?.messages);

  const geminiPayload = {
    contents,
    generationConfig: {
      temperature: Number.isFinite(Number(body?.temperature)) ? Number(body.temperature) : 0.4,
      topP: Number.isFinite(Number(body?.top_p)) ? Number(body.top_p) : 0.9,
      maxOutputTokens: Number.isFinite(Number(body?.max_tokens)) ? Number(body.max_tokens) : 1000,
    },
  };

  const apiKey = getGeminiKey(event.headers);
  if (!apiKey) {
    return json(500, { error: "مفتاح خدمة الذكاء غير مهيأ في الخادم." });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey,
    },
    body: JSON.stringify(geminiPayload),
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    return json(response.status, {
      error: "فشل الاتصال بخدمة Gemini.",
      details: payload,
    });
  }

  const candidate = Array.isArray(payload?.candidates) ? payload.candidates[0] : null;
  const content = extractText(candidate?.content?.parts);
  const usage = payload?.usageMetadata || {};

  const normalized = {
    id: `gemini-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: content || "",
        },
        finish_reason: mapFinishReason(candidate?.finishReason),
      },
    ],
    usage: {
      prompt_tokens: Number(usage.promptTokenCount || 0),
      completion_tokens: Number(usage.candidatesTokenCount || 0),
      total_tokens: Number(usage.totalTokenCount || 0),
    },
  };

  if (!stream) {
    return json(200, normalized);
  }

  const streamChunk = {
    id: normalized.id,
    object: "chat.completion.chunk",
    created: normalized.created,
    model,
    choices: [
      {
        index: 0,
        delta: {
          content: normalized.choices[0].message.content,
        },
        finish_reason: normalized.choices[0].finish_reason,
      },
    ],
    usage: normalized.usage,
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
    body: `data: ${JSON.stringify(streamChunk)}\n\ndata: [DONE]\n\n`,
  };
};

exports.handler = async (event) => {
  const startedAt = Date.now();
  const method = String(event?.httpMethod || "GET").toUpperCase();
  const path = normalizePath(event?.path);
  const requestId = getHeader(event?.headers, "x-request-id");
  const userAgent = getHeader(event?.headers, "user-agent");
  const ip = getClientIp(event);
  const rawBody = parseEventBody(event);
  const model = resolveModel(rawBody?.model);
  const stream = Boolean(rawBody?.stream);

  const finalize = async (response, subject = "", errorMessage = "") => {
    const statusCode = Number(response?.statusCode || 500);
    await writeAiAudit({
      userId: toUuidOrNull(subject),
      method,
      path,
      statusCode,
      latencyMs: Date.now() - startedAt,
      model,
      stream,
      ip,
      requestId,
      userAgent,
      error: errorMessage || undefined,
    });
    return response;
  };

  if (method === "OPTIONS") {
    return finalize({
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Api-Key",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
      body: "",
    });
  }

  const token = getBearerToken(event?.headers);
  let subject = "";

  if (!ALLOW_UNAUTH) {
    if (!token) {
      return finalize(json(401, { error: "غير مصرح. يلزم توكن جلسة صالح." }));
    }
    subject = (await verifyRequestToken(token)) || "";
    if (!subject) {
      return finalize(json(401, { error: "فشل التحقق من الجلسة." }));
    }
  } else {
    subject = token || "dev-anon";
  }

  const limiterKey = `${subject}:${ip}`;
  const limitState = enforceRateLimit(limiterKey);
  if (!limitState.allowed) {
    return finalize(
      json(
      429,
      {
        error: "تم تجاوز الحد المسموح مؤقتًا، حاول لاحقًا.",
      },
      {
        "Retry-After": String(limitState.retryAfterSeconds),
      }
      ),
      subject
    );
  }

  try {
    if (method === "GET" && path === "/models") {
      return finalize(await handleModels(event), subject);
    }

    if (method === "POST" && path === "/chat/completions") {
      return finalize(await handleChatCompletions(event), subject);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected_error";
    return finalize(
      json(500, {
        error: "فشل داخلي أثناء تنفيذ طلب الذكاء.",
      }),
      subject,
      message
    );
  }

  return finalize(
    json(404, {
      error: `المسار غير مدعوم: ${method} ${path}`,
    }),
    subject
  );
};
