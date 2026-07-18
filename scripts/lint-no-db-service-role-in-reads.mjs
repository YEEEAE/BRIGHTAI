#!/usr/bin/env node
/**
 * scripts/lint-no-db-service-role-in-reads.mjs — P0-1 / 2026-07-18
 *
 * Fails CI if `dbServiceRole` is imported in any dashboard read path
 * OUTSIDE the documented allowlist. The allowlist is enforced at the
 * filesystem level — any path added here MUST have a comment explaining
 * why it bypasses RLS.
 *
 * Allowlist (each has a justified reason — see agent.md P0-1):
 *   - apps/dashboard/lib/session.ts              (user auto-sync, no tenant ctx yet)
 *   - apps/dashboard/lib/firewall/auth/api-key.ts (resolves org from API key)
 *   - apps/dashboard/lib/firewall/audit/*         (hash chain writer)
 *   - apps/dashboard/app/api/health/*             (raw liveness)
 *   - apps/dashboard/app/api/firewall/health/*    (raw liveness)
 *   - apps/dashboard/app/api/firewall/chat/completions/* (P1-4 will migrate)
 *   - apps/dashboard/app/api/webhooks/clerk/*     (webhook, no user session)
 *   - apps/dashboard/app/api/webhooks/stripe/*    (webhook, no user session)
 *   - apps/dashboard/app/(auth)/sign-in/[[...sign-in]]/page.tsx (pre-auth SSO lookup)
 *   - apps/dashboard/app/(settings)/settings/features/page.tsx (featureFlag global catalog)
 *   - apps/dashboard/app/invitation/[token]/page.tsx (token-based public route)
 *
 * The marketing site (src/pages/api/*) is NOT covered by this lint — it
 * uses its own patterns and is Astro SSR, not Next.js dashboard.
 *
 * Run:  node scripts/lint-no-db-service-role-in-reads.mjs
 * Exit: 0 = clean, 1 = violations found
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SCAN_ROOT = join(REPO_ROOT, 'apps/dashboard/app');

const ALLOWLIST = new Set([
  // Hash chain writer
  'apps/dashboard/lib/firewall/audit/durable.ts',
  'apps/dashboard/lib/firewall/audit/hashchain.ts',
  'apps/dashboard/lib/firewall/audit/audit-writer.ts',
  // API-key auth (resolves org from key)
  'apps/dashboard/lib/firewall/auth/api-key.ts',
  // Session auto-sync (no tenant ctx yet for first login)
  'apps/dashboard/lib/session.ts',
  // Health probes
  'apps/dashboard/app/api/health/route.ts',
  'apps/dashboard/app/api/firewall/health/route.ts',
  // Firewall chat (P1-4 territory)
  'apps/dashboard/app/api/firewall/chat/completions/route.ts',
  'apps/dashboard/app/api/firewall/chat/route.ts',
  'apps/dashboard/app/api/firewall/redact/route.ts',
  'apps/dashboard/app/api/firewall/transcribe/route.ts',
  // Webhooks (no user session)
  'apps/dashboard/app/api/webhooks/clerk/route.ts',
  'apps/dashboard/app/api/webhooks/stripe/route.ts',
  // Pre-auth SSO lookup
  'apps/dashboard/app/(auth)/sign-in/[[...sign-in]]/page.tsx',
  // Feature flag global catalog (mixed: featureFlag = global, orgFeatureFlag = per-org)
  'apps/dashboard/app/(settings)/settings/features/page.tsx',
  // Invitation (token = auth)
  'apps/dashboard/app/invitation/[token]/page.tsx',
]);

/** @type {{file: string, line: number, text: string}[]} */
const violations = [];

/** @param {string} dir */
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      scan(full);
    }
  }
}

/** @param {string} fullPath */
function scan(fullPath) {
  const rel = relative(REPO_ROOT, fullPath);
  if (ALLOWLIST.has(rel)) return;

  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('dbServiceRole')) {
      violations.push({ file: rel, line: i + 1, text: line.trim() });
    }
  }
}

walk(SCAN_ROOT);

if (violations.length === 0) {
  console.log(
    '✅ lint-no-db-service-role-in-reads: 0 violations. ' +
      'All dashboard read paths use runInTenantContext or are in the allowlist.',
  );
  process.exit(0);
}

console.error(
  `❌ lint-no-db-service-role-in-reads: ${violations.length} violation(s).\n` +
    '   dbServiceRole (BYPASSRLS) must not be used in tenant read paths.\n' +
    '   Use runInTenantContext from @/lib/session instead.\n' +
    '   If this is a legitimate allowlist case, update scripts/lint-no-db-service-role-in-reads.mjs.\n',
);
for (const v of violations) {
  console.error(`   ${v.file}:${v.line}: ${v.text}`);
}
process.exit(1);
