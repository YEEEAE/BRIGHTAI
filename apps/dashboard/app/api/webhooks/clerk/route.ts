/**
 * @brightai/dashboard — Clerk webhook
 *
 * Phase 0: user.created, user.updated, user.deleted synced into our
 * User table. Phase 1: org.created, orgMembership.* events for
 * multi-tenant sync.
 *
 * Verifies the signature using CLERK_WEBHOOK_SECRET via Svix.
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { dbServiceRole } from '@brightai/db';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ClerkEmailAddress = { id: string; email_address: string };
type ClerkUserEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: ClerkEmailAddress[];
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    public_metadata?: Record<string, unknown>;
    deleted?: boolean;
  };
};

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CLERK_WEBHOOK_SECRET not configured' },
      { status: 500 },
    );
  }

  const h = await headers();
  const svixId = h.get('svix-id');
  const svixTimestamp = h.get('svix-timestamp');
  const svixSignature = h.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);
  let event: ClerkUserEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature', details: err instanceof Error ? err.message : String(err) },
      { status: 401 },
    );
  }

  const clerkUserId = event.data.id;
  const primaryEmail = event.data.email_addresses[0]?.email_address ?? '';
  const fullName = [event.data.first_name, event.data.last_name].filter(Boolean).join(' ');
  const fullNameAr = (event.data.public_metadata?.fullNameAr as string | undefined) ?? null;
  const primaryLocale = (event.data.public_metadata?.locale as 'ar' | 'en' | undefined) ?? 'ar';

  if (event.type === 'user.deleted') {
    await dbServiceRole.user.deleteMany({ where: { clerkUserId } });
    return NextResponse.json({ ok: true, action: 'deleted' });
  }

  await dbServiceRole.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email: primaryEmail,
      fullName,
      fullNameAr,
      primaryLocale,
      emailVerified: true, // Clerk users are already verified by the time the webhook fires
    },
    update: {
      email: primaryEmail,
      fullName,
      fullNameAr,
      primaryLocale,
    },
  });

  return NextResponse.json({ ok: true, action: event.type });
}
