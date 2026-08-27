/**
 * @brightai/config — Environment variable validation.
 *
 * Loads .env once per process, validates with Zod, and exposes typed
 * `env` object. Throws at startup if anything is missing or malformed.
 *
 * Convention:
 *   - Public (NEXT_PUBLIC_*)  → exposed to client, must be safe
 *   - Server-only              → no prefix, accessed only on the server
 *   - Shared between apps      → same key + same meaning across all apps
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────

const databaseUrlSchema = z
  .string()
  .url()
  .refine(
    (u) => u.startsWith('postgres://') || u.startsWith('postgresql://'),
    'DATABASE_URL must be a postgres:// URL',
  );

const redisUrlSchema = z
  .string()
  .refine(
    (u) => u.startsWith('redis://') || u.startsWith('rediss://'),
    'REDIS_URL must be a redis:// URL',
  );

// ─────────────────────────────────────────────────────────────────
// Server-side env (no client exposure)
// ─────────────────────────────────────────────────────────────────

const serverSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database
  DATABASE_URL: databaseUrlSchema,
  DIRECT_URL: databaseUrlSchema.optional(), // for Prisma accelerate / pooler

  // Redis
  REDIS_URL: redisUrlSchema,

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(10),
  CLERK_WEBHOOK_SECRET: z.string().min(10).optional(),
  CLERK_JWT_KEY: z.string().min(10).optional(),

  // Email (SendGrid)
  SENDGRID_API_KEY: z.string().min(10).optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default('noreply@brightai.live'),
  SENDGRID_FROM_NAME_AR: z.string().default('BrightAI - ذكاء اصطناعي آمن'),

  // SMS (Unifonic - Saudi Arabia)
  UNIFONIC_APP_ID: z.string().optional(),
  UNIFONIC_ACCOUNT_ID: z.string().optional(),
  UNIFONIC_SENDER_ID: z.string().default('BrightAI'),

  // Rate limiting
  RATE_LIMIT_REDIS_URL: redisUrlSchema.optional(),

  // Subdomain routing
  ROOT_DOMAIN: z.string().default('brightai.live'),
  RESERVED_SUBDOMAINS: z
    .string()
    .default('www,api,admin,app,dashboard,docs,status,mail,cdn')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),

  // Feature flags
  ENABLE_SIGNUP: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  ENABLE_PASSKEYS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  ENABLE_2FA_SMS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Audit retention (days)
  AUDIT_RETENTION_DAYS: z.coerce.number().int().min(90).default(365 * 2),

  // Invitation
  INVITATION_BASE_URL: z.string().url().optional(),

  // Stripe (BAI-004 / 2026-07-15) — server-only. All keys optional
  // because the dashboard can boot without billing configured (the
  // billing page returns a friendly "billing is not configured" state
  // if STRIPE_SECRET_KEY is missing). The library throws a clear
  // error when called without config.
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^sk_(test|live)_[A-Za-z0-9]{16,}$/, 'STRIPE_SECRET_KEY must look like sk_test_xxx or sk_live_xxx')
    .optional(),
  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^pk_(test|live)_[A-Za-z0-9]{16,}$/, 'STRIPE_PUBLISHABLE_KEY must look like pk_test_xxx or pk_live_xxx')
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .regex(/^whsec_[A-Za-z0-9]{16,}$/, 'STRIPE_WEBHOOK_SECRET must look like whsec_xxx')
    .optional(),
  // Stripe Price IDs (one per plan). Optional to allow the dashboard
  // to boot before all three plans are created in Stripe Dashboard.
  STRIPE_PRICE_STARTER: z.string().regex(/^price_[A-Za-z0-9]+$/).optional(),
  STRIPE_PRICE_PRO: z.string().regex(/^price_[A-Za-z0-9]+$/).optional(),
  // ENTERPRISE has no self-serve price — sales-led. We just check-in
  // form posts to a /contact endpoint.
});

// ─────────────────────────────────────────────────────────────────
// Public env (exposed to client — safe values only)
// ─────────────────────────────────────────────────────────────────

const publicSchema = z.object({
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().default('brightai.live'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(10),
  NEXT_PUBLIC_ENABLE_SIGNUP: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  // Stripe (BAI-004 / 2026-07-15) — publishable key is safe for client
  // (publishable keys can only create tokens / customers, not charge).
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^pk_(test|live)_[A-Za-z0-9]{16,}$/)
    .optional(),
});

// ─────────────────────────────────────────────────────────────────
// Combined schema + parse helpers
// ─────────────────────────────────────────────────────────────────

const fullSchema = serverSchema.merge(publicSchema);

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;
export type Env = z.infer<typeof fullSchema>;

/**
 * Parse the current process env. Throws with a human-readable list of
 * problems if validation fails. Designed to crash early — a misconfigured
 * server is worse than a server that won't start.
 *
 * In test environments (`NODE_ENV=test`), missing optionals are tolerated
 * to keep unit tests lightweight.
 */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = fullSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`,
    );
    throw new Error(
      `[config/env] Invalid environment variables:\n${issues.join('\n')}`,
    );
  }
  return result.data;
}

/**
 * Split env into server-only and public halves for frameworks that
 * distinguish the two (Next.js, Vite).
 */
export function parseEnvSplit(source: NodeJS.ProcessEnv = process.env): {
  server: ServerEnv;
  public: PublicEnv;
} {
  const parsed = parseEnv(source);
  return {
    server: serverSchema.parse(source),
    public: publicSchema.parse(source),
  };
}

/**
 * Convenience: which env vars are required for the dashboard app to boot.
 * Use in CI to fail fast when a secret is missing.
 */
export const REQUIRED_DASHBOARD_ENV = [
  'DATABASE_URL',
  'REDIS_URL',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
] as const;

/**
 * Required env for billing/stripe to be operational. The dashboard
 * boots fine without these (billing page shows a "not configured"
 * state). The webhook endpoint returns 503 if STRIPE_WEBHOOK_SECRET
 * is missing.
 */
export const REQUIRED_BILLING_ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STARTER',
  'STRIPE_PRICE_PRO',
] as const;