'use server';

/**
 * @brightai/dashboard — SSO Settings Server Actions
 *
 * SSO-001 (2026-07-15): configure / disable / test the org's SSO connection.
 *
 * All actions:
 *   - require OWNER role (defense in depth, in addition to page-level gate)
 *   - write a hash-chained audit entry on success
 *   - return ActionResult discriminated union
 */

import { revalidatePath } from 'next/cache';
import { dbServiceRole } from '@brightai/db';
import { requireSessionRoleAtLeast } from '@/lib/session';
import { appendAuditLog } from '@/lib/firewall/audit/hashchain';

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const SUPPORTED_PROVIDERS = ['azure_ad', 'okta', 'google_workspace', 'generic'] as const;
type Provider = typeof SUPPORTED_PROVIDERS[number];

function isProvider(v: unknown): v is Provider {
  return typeof v === 'string' && (SUPPORTED_PROVIDERS as readonly string[]).includes(v);
}

// ─────────────────────────────────────────────────────────────────────────
// Configure SSO connection
// ─────────────────────────────────────────────────────────────────────────
export async function configureSsoAction(formData: FormData): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireSessionRoleAtLeast('OWNER');
  } catch {
    return { ok: false, error: 'غير مصرح' };
  }

  const provider = formData.get('provider');
  if (!isProvider(provider)) {
    return { ok: false, error: 'مزوّد غير مدعوم' };
  }
  const domainsRaw = String(formData.get('emailDomains') ?? '');
  const domains = domainsRaw
    .split(/[,\s]+/)
    .map((d) => d.trim().toLowerCase())
    .filter((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d));
  if (domains.length === 0) {
    return { ok: false, error: 'يجب إدخال نطاق بريد إلكتروني واحد على الأقل' };
  }

  const roleMapping: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('role_') && typeof value === 'string' && value) {
      roleMapping[key.slice(5)] = value;
    }
  }

  await dbServiceRole.samlConnection.upsert({
    where: { organizationId: ctx.tenant.id },
    create: {
      organizationId: ctx.tenant.id,
      provider,
      emailDomains: domains,
      enabled: true,
      roleMapping,
    },
    update: {
      provider,
      emailDomains: domains,
      enabled: true,
      roleMapping,
    },
  });

  await appendAuditLog({
    organizationId: ctx.tenant.id,
    actorId: ctx.user.id,
    actorType: 'USER',
    action: 'SSO_CONNECTION_CONFIGURED',
    targetType: 'SamlConnection',
    targetId: ctx.tenant.id,
    metadata: { provider, domains, hasRoleMapping: Object.keys(roleMapping).length > 0 },
  });

  revalidatePath('/settings/sso');
  return { ok: true, message: 'تم تكوين تسجيل الدخول الموحد بنجاح' };
}

// ─────────────────────────────────────────────────────────────────────────
// Disable SSO (keeps the row for audit trail; just flips `enabled = false`)
// ─────────────────────────────────────────────────────────────────────────
export async function disableSsoAction(): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireSessionRoleAtLeast('OWNER');
  } catch {
    return { ok: false, error: 'غير مصرح' };
  }

  const existing = await dbServiceRole.samlConnection.findUnique({
    where: { organizationId: ctx.tenant.id },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, error: 'لا يوجد اتصال SSO لإيقافه' };
  }

  await dbServiceRole.samlConnection.update({
    where: { organizationId: ctx.tenant.id },
    data: { enabled: false },
  });

  await appendAuditLog({
    organizationId: ctx.tenant.id,
    actorId: ctx.user.id,
    actorType: 'USER',
    action: 'SSO_CONNECTION_DISABLED',
    targetType: 'SamlConnection',
    targetId: ctx.tenant.id,
    metadata: { reason: 'manual-disable' },
  });

  revalidatePath('/settings/sso');
  return { ok: true, message: 'تم إيقاف تسجيل الدخول الموحد' };
}