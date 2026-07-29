/**
 * src/pages/api/lead.ts — KERNEL-AI-2026-07-14
 *                  + KERNEL-AUDIT-2026-07-15-BATCH-3 (EXEC-04)
 *                  + HIGH-04 (2026-07-15) — durable lead outbox
 *
 * Server-side lead capture endpoint. يستقبل طلبات "تواصل معنا" من
 * KernelLeadForm الموجود في كل صفحة Kernel.
 *
 * السلوك (HIGH-04):
 *  - POST { name, contact, company, page?, source? }
 *  - يدعم `Idempotency-Key` header (اختياري). لو مو موجود → synthetic
 *    key من sha256(ip + ua + contact + 30s-bucket).
 *  - يتحقق من الحقول بـ Zod
 *  - rate limit: 5 طلبات / دقيقة / IP
 *  - enqueue في Postgres LeadQueue (durable على Render restart)
 *  - drainOnce() يجرب ship لـ LEAD_WEBHOOK_URL كل 60s
 *  - exponential backoff: 1min → 5min → 30min → DLQ
 *  - يطبع في console: id=<sha256> ts=<iso> page=<path> mode=<shipped|queued>
 *    ← NO PII في الـ logs (لا name، لا contact، لا company، لا IP)
 *  - يرجّع { ok: true, mode: 'shipped'|'queued', idempotencyKey }
 *
 * النشر:
 *  - يتطلب @astrojs/node (مفعّل في astro.config.mjs)
 *  - ينشر على Render كـ Node service
 *  - LEAD_WEBHOOK_URL + LEAD_WEBHOOK_SECRET تُضبط في Render dashboard
 *  - DATABASE_URL يُضبط في Render dashboard (نفس connection string
 *    للـ dashboard — shared Postgres instance)
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
import {
  enqueue as enqueueLeadRow,
  drainOnce,
  resolveIdempotencyKey,
} from '@brightai/lead-queue';
// BAI-005: shared Redis sliding-window rate limiter (unified across Render instances)
import { rateLimit } from '../../lib/ratelimit';
// CSRF-LEAD-001 (2026-07-15): double-submit cookie pattern
import { verifyCsrfRequest } from '../../lib/csrf';
// EXEC-10 (2026-07-29): GA4 Measurement Protocol server-side. Covers
// client-side event loss (adblocker, network drop after submit, tab
// close). Best-effort — never blocks the lead enqueue.
import {
  sendServerEvent,
  parseClientIdFromCookie,
} from '../../lib/ga4-server';
// `drainOnce` is used inside ensureDrain() below — see the timer block.

export const prerender = false;

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;  // 5 leads / minute / IP
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
// Client IP / User-Agent helpers
// ─────────────────────────────────────────────────────────────────────────
function getClientIpLocal(req: Request): string {
  // KRN-013 / EXEC-13: TRUSTED_PROXY_COUNT env (default 1 for Render)
  const trustedProxyCount = parseInt(process.env.TRUSTED_PROXY_COUNT || '1', 10);
  return getClientIp(req, { trustedProxyCount });
}

function getUserAgentLocal(req: Request): string {
  return req.headers.get('user-agent') ?? '';
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
// Lead ID hashing — kept for log correlation only (sha256 of the leadId
// row from @brightai/lead-queue). PII redaction (KRN-004 / EXEC-04)
// preserved verbatim.
// ─────────────────────────────────────────────────────────────────────────
function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────
// Drain timer — tries to ship the LeadQueue every DRAIN_INTERVAL_MS.
//
// Best-effort: if the webhook is down, we leave the rows in
// LeadQueue.status = PENDING with nextRetryAt set; the next tick picks
// them up automatically. Survives process restarts because rows live
// in Postgres, not memory.
// ─────────────────────────────────────────────────────────────────────────
let drainTimer: ReturnType<typeof setInterval> | null = null;
let drainInFlight = false;
function ensureDrain(): void {
  if (drainTimer) return;
  drainTimer = setInterval(async () => {
    if (drainInFlight) return;
    const url = process.env.LEAD_WEBHOOK_URL;
    if (!url) return; // sink not configured — pure queue mode
    drainInFlight = true;
    try {
      await drainOnce({
        webhookUrl: url,
        webhookSecret: process.env.LEAD_WEBHOOK_SECRET,
        httpTimeoutMs: WEBHOOK_TIMEOUT_MS,
        batchSize: 10,
      });
    } catch {
      // never propagate — drain errors are not user-facing
    } finally {
      drainInFlight = false;
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
  // 0. CSRF (CSRF-LEAD-001): double-submit cookie validation.
  //    يُتحقق قبل rate limit عشان ما نضيع quota على attackers.
  //    Origin allowlist وحده غير كافي لأن Origin header optional في
  //    بعض السيناريوهات (form submits، privacy modes، legacy browsers).
  if (!verifyCsrfRequest(request)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[brightai-kernel-lead] csrf_invalid ip=${getClientIpLocal(request)} ` +
      `ua=${getUserAgentLocal(request).slice(0, 80)}`,
    );
    return jsonError(403, 'csrf_invalid', {
      hint: 'fetch /api/csrf-token/ first, then re-submit with X-CSRF-Token header',
    });
  }

  // 1. Rate limit (BAI-005: Redis sliding-window, unified across Render instances)
  const ip = getClientIpLocal(request);
  const rl = await rateLimit(`lead:${ip}`, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS / 1_000);
  if (!rl.allowed) {
    const headers: Record<string, string> = {
      'Retry-After': String(rl.retryAfterSec),
      'X-RateLimit-Limit': String(rl.limit),
      'X-RateLimit-Remaining': '0',
    };
    if (rl.degraded) headers['X-RateLimit-Degraded'] = 'true';
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

  // 4. Resolve Idempotency-Key (HIGH-04).
  //    - If client sent the header, use it (client-provided key).
  //    - Otherwise derive a synthetic key from IP + UA + contact +
  //      30-second bucket (stable within a window so retries dedup).
  const headerKey = request.headers.get('idempotency-key');
  const resolvedKey = resolveIdempotencyKey({
    headerValue: headerKey,
    ip,
    userAgent: getUserAgentLocal(request),
    contact: lead.contact,
  });

  // 5. Compute the public lead ID hash (for log correlation only).
  //    sha256(ip + name + ts) — NOT the same as the Idempotency-Key.
  const leadHash = sha256(`${ip}|${lead.name}|${Date.now()}`);

  // 6. Always enqueue first — durability is the contract. The drain
  //    timer (60s) picks the row up on the next tick. We deliberately
  //    do NOT call drainOnce() inline: an immediate-drain attempt
  //    would race the insert (the row is not yet on disk when the
  //    drainer starts reading) and would also inflate LCP for the
  //    client while waiting on the webhook.
  ensureDrain();
  const enqueued = await enqueueLeadRow({
    idempotencyKey: resolvedKey.value,
    name: lead.name,
    contact: lead.contact,
    company: lead.company,
    page: lead.page ?? null,
    source: lead.source ?? 'kernel',
    ip,
    userAgent: getUserAgentLocal(request),
  });
  // If the same Idempotency-Key was already delivered (re-submit from
  // a client that lost the previous response), the row comes back with
  // status = DELIVERED — surface that as `shipped`.
  const mode: 'shipped' | 'queued' = enqueued.status === 'DELIVERED' ? 'shipped' : 'queued';

  // 7.5. EXEC-10: Server-side GA4 `generate_lead` conversion (best-effort).
  //      Covers the case where the client-side gtag event is lost
  //      (adblocker, network drop after submit, tab closed). Stitches to
  //      the same GA4 session via the _ga cookie when available; falls
  //      back to a stable IP+UA hash (no raw PII leaves the server).
  //      Never blocks or fails the lead — any throw is swallowed.
  const cookieClientId = parseClientIdFromCookie(request.headers.get('cookie'));
  const fallbackClientId = crypto
    .createHash('sha256')
    .update(`${ip}|${getUserAgentLocal(request)}`)
    .digest('hex')
    .slice(0, 16);
  void sendServerEvent({
    clientId: cookieClientId ?? fallbackClientId,
    events: [
      {
        name: 'generate_lead',
        params: {
          source: lead.source ?? 'kernel',
          page: lead.page ?? null,
          mode,
        },
      },
    ],
  }).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn('[ga4-server] generate_lead rejected (swallowed)', e);
  });

  // 8. Log ONLY ID hash + timestamp + page (لا PII في stdout)
  // eslint-disable-next-line no-console
  console.log(
    `[brightai-kernel-lead] id=${leadHash} ts=${new Date().toISOString()} ` +
    `page=${lead.page ?? 'unknown'} mode=${mode} ` +
    `idem=${resolvedKey.source} key=${resolvedKey.value.slice(0, 12)}…`,
  );

  // 9. نجاح
  return jsonResponse({
    ok: true,
    mode,
    idempotencyKey: resolvedKey.value,
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
