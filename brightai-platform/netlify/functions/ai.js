"use strict";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const RATE_LIMIT_PER_MINUTE = Number(process.env.AI_RATE_LIMIT_PER_MINUTE || "30");
const RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || "60000");
const ALLOW_UNAUTH = String(process.env.AI_PROXY_ALLOW_UNAUTHENTICATED || "false").toLowerCase() === "true";

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
  const method = String(event?.httpMethod || "GET").toUpperCase();
  const path = normalizePath(event?.path);

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Api-Key",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
      body: "",
    };
  }

  const token = getBearerToken(event?.headers);
  let subject = "";

  if (!ALLOW_UNAUTH) {
    if (!token) {
      return json(401, { error: "غير مصرح. يلزم توكن جلسة صالح." });
    }
    subject = (await verifySupabaseToken(token)) || "";
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
      {
        error: "تم تجاوز الحد المسموح مؤقتًا، حاول لاحقًا.",
      },
      {
        "Retry-After": String(limitState.retryAfterSeconds),
      }
    );
  }

  if (method === "GET" && path === "/models") {
    return handleModels(event);
  }

  if (method === "POST" && path === "/chat/completions") {
    return handleChatCompletions(event);
  }

  return json(404, {
    error: `المسار غير مدعوم: ${method} ${path}`,
  });
};
