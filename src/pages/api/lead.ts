/**
 * src/pages/api/lead.ts — KERNEL-AI-2026-07-14
 *                  + KERNEL-AUDIT-2026-07-15-BATCH-3 (EXEC-04)
 *
 * Server-side lead capture endpoint. يستقبل طلبات "تواصل معنا" من
 * KernelLeadForm الموجود في كل صفحة Kernel.
 *
 * السلوك (KRN-004 / EXEC-04):
 *  - POST { name, contact, company, page?, source? }
 *  - يتحقق من الحقول بـ Zod
 *  - rate limit: 5 طلبات / دقيقة / IP
 *  - يولد leadId = SHA-256(ip + name + timestamp)
 *  - يحاول ship إلى LEAD_WEBHOOK_URL (best-effort, 5s timeout)
 *  - لو webhook فشل → queue في الذاكرة (cap 100)
 *  - setInterval (60s) يجرب drain للـ queue (لو webhook رجع)
 *  - queue overflow → 503 lead_sink_unavailable
 *  - يطبع في console: id=<sha256> ts=<iso> page=<path> mode=<shipped|queued>
 *    ← NO PII في الـ logs (لا name، لا contact، لا company، لا IP)
 *  - يرجّع { ok: true, mode: 'shipped'|'queued' }
 *
 * النشر:
 *  - يتطلب @astrojs/node (مفعّل في astro.config.mjs)
 *  - ينشر على Render كـ Node service
 *  - LEAD_WEBHOOK_URL + LEAD_WEBHOOK_SECRET تُضبط في Render dashboard
 *
 * الأمان:
 *  - لا يحفظ في localStorage / cookies
 *  - لا يكشف بيانات حساسة في الرد
 *  - rate limit يحمي من spam
 *  - Zod validation يحمي من حقن payloads
 *  - HMAC-SHA256 signing على الـ webhook (لو LEAD_WEBHOOK_SECRET موجود)
 *  - leadId hash غير reversible (SHA-256 + salt = timestamp)
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import crypto from 'node:crypto';
// KRN-013 / EXEC-13: shared client IP extraction
import { getClientIp } from '../../lib/ip';

export const prerender = false;

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;  // 5 leads / minute / IP
const MAX_QUEUE_SIZE = 100;         // in-memory buffer cap
const WEBHOOK_TIMEOUT_MS = 5_000;   // 5 seconds
const DRAIN_INTERVAL_MS = 60_000;   // 1 minute retry interval

// ─────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────
const LeadSchema = z.object({
  name: z
    .string()
    .min(2, 'الاسم قصير جداً')
    .max(100, 'الاسم طويل جداً')
    .trim(),
  contact: z
    .string()
    .min(3, 'بيانات التواصل مطلوبة')
    .max(120, 'بيانات التواصل طويلة جداً')
    .trim()
    .refine(
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^\+?\d{8,15}$/.test(v.replace(/[\s-]/g, '')),
      'يجب أن يكون بريد إلكتروني أو رقم جوال دولي',
    ),
  company: z
    .string()
    .min(2, 'اسم الشركة قصير جداً')
    .max(120, 'اسم الشركة طويل جداً')
    .trim(),
  page: z.string().max(200).optional(),
  source: z.string().max(50).optional(),
});

type LeadPayload = z.infer<typeof LeadSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Rate limit bucket (نفس النمط في chat.ts)
// ─────────────────────────────────────────────────────────────────────────
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIpLocal(req: Request): string {
  // KRN-013 / EXEC-13: TRUSTED_PROXY_COUNT env (default 1 for Render)
  const trustedProxyCount = parseInt(process.env.TRUSTED_PROXY_COUNT || '1', 10);
  return getClientIp(req, { trustedProxyCount });
}

function checkRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(ip);
  if (!existing || now > existing.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  existing.count += 1;
  if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true };
}

const CLEANUP_INTERVAL_MS = 5 * 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, b] of buckets) {
      if (now > b.resetAt) buckets.delete(ip);
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer === 'object' && cleanupTimer && 'unref' in cleanupTimer) {
    (cleanupTimer as { unref: () => void }).unref?.();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// JSON helpers
// ─────────────────────────────────────────────────────────────────────────
function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function jsonError(
  status: number,
  error: string,
  extra: Record<string, unknown> = {},
): Response {
  const headers: Record<string, string> = {};
  if (status === 429 && typeof extra.retryAfterSec === 'number') {
    headers['Retry-After'] = String(extra.retryAfterSec);
  }
  return jsonResponse({ error, ...extra }, status, headers);
}

// ─────────────────────────────────────────────────────────────────────────
// Lead ID hashing + HMAC signing (KRN-004 / EXEC-04 — PII redaction)
// ─────────────────────────────────────────────────────────────────────────
function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function hmacSign(message: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────
// Webhook sink (best-effort, 5s timeout)
// ─────────────────────────────────────────────────────────────────────────
type QueuedLead = {
  lead: LeadPayload;
  leadId: string;
  ip: string;
  ts: number;
};

async function shipToWebhook(lead: LeadPayload, leadId: string, ip: string): Promise<boolean> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return false; // Not configured = treat as no-op (will fall through to queue)

  const secret = process.env.LEAD_WEBHOOK_SECRET;
  const body = JSON.stringify({
    id: leadId,
    name: lead.name,
    contact: lead.contact,
    company: lead.company,
    page: lead.page ?? null,
    source: lead.source ?? 'kernel',
    ip, // OK to ship to webhook (we control the destination)
    ts: new Date().toISOString(),
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-BrightAI-Lead-Id': leadId,
  };
  if (secret) {
    headers['X-BrightAI-Signature'] = `sha256=${hmacSign(body, secret)}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// In-memory queue (overflow → 503 lead_sink_unavailable)
// ─────────────────────────────────────────────────────────────────────────
const pendingLeads: QueuedLead[] = [];

function enqueueLead(item: QueuedLead): 'ok' | 'overflow' {
  if (pendingLeads.length >= MAX_QUEUE_SIZE) return 'overflow';
  pendingLeads.push(item);
  return 'ok';
}

// Periodic drain: try to flush queue to webhook every 60s (best-effort)
let drainTimer: ReturnType<typeof setInterval> | null = null;
function ensureDrain(): void {
  if (drainTimer) return;
  drainTimer = setInterval(async () => {
    while (pendingLeads.length > 0) {
      const item = pendingLeads[0];
      const ok = await shipToWebhook(item.lead, item.leadId, item.ip);
      if (!ok) break; // webhook still down — try again next interval
      pendingLeads.shift();
    }
  }, DRAIN_INTERVAL_MS);
  if (drainTimer && typeof drainTimer.unref === 'function') {
    drainTimer.unref();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  ensureCleanup();

  // 1. Rate limit
  const ip = getClientIpLocal(request);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return jsonError(429, 'rate_limited', { retryAfterSec: rl.retryAfterSec });
  }

  // 2. Parse JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }
  if (!body || typeof body !== 'object') {
    return jsonError(400, 'invalid_body');
  }

  // 3. Zod validation
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return jsonError(400, 'validation_failed', { issues });
  }

  const lead: LeadPayload = parsed.data;

  // 4. Compute lead ID hash (SHA-256 of ip + name + timestamp)
  //    — غير reversible. يُستخدم في الـ logs + الـ webhook signature.
  const leadId = sha256(`${ip}|${lead.name}|${Date.now()}`);

  // 5. Try to ship to webhook (best-effort, 5s timeout)
  ensureDrain();
  const webhookOk = await shipToWebhook(lead, leadId, ip);

  // 6. If webhook failed, queue for later drain
  let mode: 'shipped' | 'queued';
  if (webhookOk) {
    mode = 'shipped';
  } else {
    const queued = enqueueLead({ lead, leadId, ip, ts: Date.now() });
    if (queued === 'overflow') {
      // لا نخسر الـ lead بصمت — نرجّع 503 مع رسالة واضحة (KRN-004)
      // الـ user يمكنه retry أو استخدام WhatsApp fallback
      return jsonError(503, 'lead_sink_unavailable', {
        message: 'Lead system temporarily unavailable. Please try again later or use WhatsApp fallback.',
        hint: 'https://wa.me/?text=' + encodeURIComponent('استفسار عن BrightAI Kernel'),
      });
    }
    mode = 'queued';
  }

  // 7. Log ONLY ID hash + timestamp + page (لا PII في stdout)
  // eslint-disable-next-line no-console
  console.log(
    `[brightai-kernel-lead] id=${leadId} ts=${new Date().toISOString()} ` +
    `page=${lead.page ?? 'unknown'} mode=${mode}`,
  );

  // 8. نجاح
  return jsonResponse({
    ok: true,
    mode,
    message: 'تم استلام طلبك بنجاح. فريق الحوكمة سيتواصل معك خلال 24 ساعة.',
  });
};

// ─────────────────────────────────────────────────────────────────────────
// Other HTTP methods → 405
// ─────────────────────────────────────────────────────────────────────────
export const GET: APIRoute = async () =>
  jsonError(405, 'method_not_allowed', { allowed: ['POST'] });

export const PUT: APIRoute = async () =>
  jsonError(405, 'method_not_allowed', { allowed: ['POST'] });

export const DELETE: APIRoute = async () =>
  jsonError(405, 'method_not_allowed', { allowed: ['POST'] });
