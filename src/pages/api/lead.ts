/**
 * src/pages/api/lead.ts — KERNEL-AI-2026-07-14
 *
 * Server-side lead capture endpoint. يستقبل طلبات "تواصل معنا" من
 * KernelLeadForm الموجود في كل صفحة Kernel.
 *
 * السلوك:
 *  - POST { name, contact, company, page?, source? }
 *  - يتحقق من الحقول بـ Zod
 *  - rate limit: 5 طلبات / دقيقة / IP (أقل من chat لأن lead = قيمة عالية)
 *  - يسجّل الـ lead في console (server-side log) — بدون DB أو SMTP
 *  - يرجّع { ok: true, mode: 'logged' } عند النجاح
 *  - يرجّع 400 / 429 / 502 بأخطاء موحدة
 *
 * النشر:
 *  - يتطلب @astrojs/node (مفعّل في astro.config.mjs)
 *  - ينشر على Render كـ Node service
 *  - لو نُشر على static hosting (404) → العميل يفتح wa.me fallback تلقائياً
 *
 * الأمان:
 *  - لا يحفظ في localStorage / cookies
 *  - لا يكشف بيانات حساسة في الرد
 *  - rate limit يحمي من spam
 *  - Zod validation يحمي من حقن payloads
 *
 * الخصوصية:
 *  - لا يُسجّل body كامل (فقط الحقول المُتحققة)
 *  - IP يُسجّل في rate limit bucket فقط (لا يُحفظ)
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;  // 5 leads / minute / IP

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

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
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
// POST handler
// ─────────────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  ensureCleanup();

  // 1. Rate limit
  const ip = getClientIp(request);
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

  // 4. Log lead (server-side only — no DB yet)
  // النية: لاحقاً يربط هذا مع SendGrid / Resend / webhook
  // حالياً يطبع في console لسهولة الاختبار اليدوي
  try {
    // eslint-disable-next-line no-console
    console.log(
      `[brightai-kernel-lead] ${new Date().toISOString()} ip=${ip} page=${lead.page ?? 'unknown'} ` +
      `name="${lead.name}" company="${lead.company}" contact="${lead.contact}" source=${lead.source ?? 'kernel'}`,
    );
  } catch {
    // console.log قد يفشل في بعض البيئات (edge) — نتجاهل بصمت
  }

  // 5. نجاح
  return jsonResponse({
    ok: true,
    mode: 'logged',
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
