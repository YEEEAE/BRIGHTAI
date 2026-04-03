/**
 * Mais Co. OBM Dashboard — Render Backend Proxy
 * 
 * Proxies Gemini AI requests to protect API keys in production.
 * Environment variables:
 *   GEMINI_API_KEY  — Google Gemini API key
 *   GEMINI_MODEL    — Model name (default: gemini-2.0-flash)
 *   PORT            — Server port (default: 3000)
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/* ── Middleware ──────────────────────────────────────── */

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "2mb" }));

/* ── Simple In-Memory Rate Limiter ───────────────────── */

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 15; // 15 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/* ── Health Check ────────────────────────────────────── */

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!GEMINI_API_KEY,
    defaultModel: GEMINI_MODEL
  });
});

/* ── Gemini AI Proxy Endpoint ────────────────────────── */

app.post("/api/gemini", async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  /* Rate limit check */
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: "RATE_LIMIT",
      message: "Too many requests. Please wait a moment and try again.",
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  /* Validate server-side API key */
  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error: "SERVER_NOT_CONFIGURED",
      message: "The server does not have a Gemini API key configured. Use a local API key in the dashboard instead."
    });
  }

  /* Validate request body */
  const { prompt, model, dataSummary } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      error: "INVALID_REQUEST",
      message: "A valid prompt string is required."
    });
  }

  if (!dataSummary || typeof dataSummary !== "string") {
    return res.status(400).json({
      error: "INVALID_REQUEST",
      message: "A valid dataSummary string is required."
    });
  }

  const selectedModel = (typeof model === "string" && model.trim()) ? model.trim() : GEMINI_MODEL;

  /* Build the full prompt */
  const systemInstruction = [
    "You are a Quality Control AI analyst for Mais Co., a Saudi medical products manufacturer.",
    "You are analyzing OBM (Original Brand Manufacturing) sample rejection data.",
    "Respond in clear professional English with markdown formatting.",
    "Use headings, tables, and bullet points where helpful.",
    "Be specific with numbers and product names.",
    "Structure your response for executive-level readability.",
    "Focus on actionable insights.",
    "Do not invent data that is not present in the provided dataset."
  ].join(" ");

  const fullPrompt = `${systemInstruction}\n\nHere is the data:\n\n${dataSummary}\n\n${prompt}`;

  /* Call Gemini API */
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          topP: 0.95,
          topK: 40
        }
      })
    });

    /* Handle Gemini error responses */
    if (geminiResponse.status === 401 || geminiResponse.status === 403) {
      return res.status(502).json({
        error: "UPSTREAM_AUTH_FAILED",
        message: "The server's Gemini API key is invalid or expired. Contact the administrator."
      });
    }

    if (geminiResponse.status === 429) {
      return res.status(429).json({
        error: "UPSTREAM_RATE_LIMIT",
        message: "Gemini API rate limit reached. Please wait and try again.",
        retryAfter: 30
      });
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text().catch(() => "");
      console.error(`Gemini API error ${geminiResponse.status}:`, errorText.slice(0, 500));
      return res.status(502).json({
        error: "UPSTREAM_ERROR",
        message: `Gemini API returned status ${geminiResponse.status}.`
      });
    }

    const payload = await geminiResponse.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(502).json({
        error: "EMPTY_RESPONSE",
        message: "Gemini returned an empty response for this request."
      });
    }

    /* Success */
    return res.json({
      text,
      model: selectedModel,
      timestamp: new Date().toISOString()
    });

  } catch (networkError) {
    console.error("Gemini proxy network error:", networkError.message);
    return res.status(502).json({
      error: "NETWORK_ERROR",
      message: "Failed to connect to Gemini API. Check server network configuration."
    });
  }
});

/* ── OpenAI-Compatible Chat Endpoint (existing behavior) ── */

app.post("/api/ai/chat/completions", async (req, res) => {
  const { provider, model, messages, max_tokens = 1100, temperature = 0.2 } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "INVALID_REQUEST", message: "Messages array required." });
  }

  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: "RATE_LIMIT", message: "Too many requests." });
  }

  /* Route to Gemini via the server key as a unified backend */
  if (GEMINI_API_KEY) {
    try {
      const combinedPrompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
      const selectedModel = GEMINI_MODEL;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: combinedPrompt }] }],
          generationConfig: { temperature, maxOutputTokens: max_tokens }
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini ${geminiResponse.status}`);
      }

      const payload = await geminiResponse.json();
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return res.json({
        choices: [{
          message: { role: "assistant", content: text },
          finish_reason: "stop"
        }],
        model: selectedModel,
        provider: "gemini-proxy"
      });
    } catch (err) {
      console.error("Chat completions Gemini proxy error:", err.message);
      return res.status(502).json({ error: "UPSTREAM_ERROR", message: err.message });
    }
  }

  return res.status(503).json({
    error: "NOT_CONFIGURED",
    message: "No AI backend is configured on this server."
  });
});

/* ── Serve Static Files ──────────────────────────────── */

app.use(express.static(path.join(__dirname), {
  extensions: ["html"],
  index: "index.html"
}));

/* ── Fallback to index.html ──────────────────────────── */

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ── Start Server ────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`[Mais OBM] Server running on port ${PORT}`);
  console.log(`[Mais OBM] Gemini API key: ${GEMINI_API_KEY ? "configured" : "NOT configured"}`);
  console.log(`[Mais OBM] Default model: ${GEMINI_MODEL}`);
});
