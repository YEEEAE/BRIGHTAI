#!/usr/bin/env node
/**
 * scripts/seed-eval-cert-key.mjs — EVAL-CERT-011.
 *
 * يخزّن مفتاح التوقيع العام (Ed25519) في جدول signing_keys حتى يتمكن
 * التحقق من الشهادة (verify) من استرجاع المفتاح العام الضروري للتحقق،
 * حتى بعد rotation أو عبر طلب HTTP عام.
 *
 * مصدر المفتاح (حسب الترتيب):
 *   1. EVAL_CERT_SIGNING_KEY_RING (JSON) — آخر إدخال = النشط.
 *   2. EVAL_CERT_PUBLIC_KEY + EVAL_CERT_KEY_ID.
 *   3. الوسائط --public-key-pem / --key-id (لاختبار سريع يدوي).
 *
 * المفتاح الخاص لا يُخزَّن في الـ DB ولا يُطبع هنا.
 *
 * Usage:
 *   DATABASE_URL=postgresql://brightai:brightai@localhost:5432/brightai_dev \
 *     node scripts/seed-eval-cert-key.mjs
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

// Load root .env manually (no dotenv dependency at root require path).
try {
  const envRaw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of envRaw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  /* no .env — rely on shell env */
}

const req = createRequire(fileURLToPath(new URL('../packages/db/src/client.ts', import.meta.url)));
const { PrismaClient } = req('@prisma/client');

const client = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_SERVICE ?? process.env.DATABASE_URL ?? '' },
  },
});

function pem(body, label) {
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}

async function main() {
  const ringRaw = process.env.EVAL_CERT_SIGNING_KEY_RING;
  let entries = [];
  if (ringRaw) {
    try {
      entries = JSON.parse(ringRaw);
      if (!Array.isArray(entries)) entries = [];
    } catch {
      entries = [];
    }
  }
  const privOnly = !ringRaw && process.env.EVAL_CERT_PRIVATE_KEY;
  if (privOnly && process.env.EVAL_CERT_PUBLIC_KEY) {
    entries.push({
      keyId: process.env.EVAL_CERT_KEY_ID || 'v1',
      privateKey: undefined,
      publicKey: process.env.EVAL_CERT_PUBLIC_KEY.replace(/\\n/g, '\n'),
    });
  }

  let seeded = 0;
  for (const e of entries) {
    if (!e?.keyId || !e.publicKey) continue;
    const pubNormalized = e.publicKey.replace(/\\n/g, '\n').trim();
    await client.signingKey.upsert({
      where: { publicKeyId: e.keyId },
      update: { publicKeyPem: pubNormalized },
      create: {
        publicKeyId: e.keyId,
        algorithm: 'Ed25519',
        publicKeyPem: pubNormalized,
      },
    });
    seeded++;
  }

  if (seeded === 0) {
    console.error(
      'لا يوجد مفتاح. اضبط EVAL_CERT_SIGNING_KEY_RING أو EVAL_CERT_PUBLIC_KEY، أو مرّر --public-key=' + '+ --key-id',
    );
    process.exitCode = 1;
    return;
  }
  console.log(`Seeded ${seeded} public signing key(s) into signing_keys.`);
  await client.$disconnect();
}

main().catch((err) => {
  console.error('seed-eval-cert-key error:', err.message);
  process.exitCode = 1;
});