#!/usr/bin/env node
/**
 * scripts/generate-eval-cert-key.mjs — EVAL-CERT-010.
 *
 * يُنتج مفتاح Ed25519 جديداً لعملية التوقيع على شهادات تقييم Kernel ، ويرجع
 * سطر env جاهزاً (EVAL_CERT_SIGNING_KEY_RING) يمكن لصقه في بيئة الخادم.
 *
 * تجاوزات:
 *   node scripts/generate-eval-cert-key.mjs
 *   node scripts/generate-eval-cert-key.mjs --key-id v2
 *
 * لا يُكتب أي سر في Git — يُطبع فقط. المفتاح غير متداول في المتصفح/client.
 */

import { generateKeyPairSync } from 'node:crypto';

const keyId = process.argv[2] === '--key-id' ? process.argv[3] : 'v1';
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

const ring = [{ keyId, privateKey: privPem, publicKey: pubPem }];

console.log(`# EVAL-CERT signing key (Ed25519) — keyId=${keyId}`);
console.log('# Add this to .env (or the hosting dashboard). Keep private key secret.');
console.log('# To support rotation, include prior { keyId, publicKey } entries (no privateKey).');
const ringJson = JSON.stringify(ring).replace(/\\n/g, '\\n');
console.log(`EVAL_CERT_SIGNING_KEY_RING=${ringJson}`);
console.log('');
console.log('# Or flat env (single key):');
console.log(`EVAL_CERT_KEY_ID=${keyId}`);
console.log(`EVAL_CERT_PUBLIC_KEY=${pubPem.replace(/\n/g, '\\n')}`);
console.log('# EVAL_CERT_PRIVATE_KEY=<private PEM — keep secret>');