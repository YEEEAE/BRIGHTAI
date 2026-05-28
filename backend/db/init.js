'use strict';

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let pool = null;

function getDb() {
  if (!pool) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return pool;
}

function generateId(prefix) {
  return prefix + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

async function initializeDatabase() {
  const connectionString = process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    `postgresql://brighttrust:brighttrust@localhost:5432/brighttrust`;

  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (err) => {
    console.error('[BrightTrust Kernel] Unexpected PG pool error:', err.message);
  });

  // Test connection
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('[BrightTrust Kernel] PostgreSQL connected');
  } finally {
    client.release();
  }

  // Run schema
  const schemaPath = path.join(__dirname, 'schema-pg.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);

  await seedDefaultPolicies();

  console.log('[BrightTrust Kernel] PostgreSQL schema initialized');
  return pool;
}

async function seedDefaultPolicies() {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM kernel_policy_rules');
  if (parseInt(rows[0].count) > 0) return;

  const now = Date.now();
  const defaults = [
    ['pr_saudi_id_pdpl', 'Mask Saudi National ID', 'PDPL requires masking national IDs before external processing', 'saudi_id', 'mask', 15, 'pdpl'],
    ['pr_saudi_id_sfda', 'Block Saudi ID in medical context', 'SFDA prohibits unmasked IDs in medical data', 'saudi_id', 'block', 30, 'sfda'],
    ['pr_phone_pdpl', 'Mask phone numbers', 'PDPL phone number masking', 'phone', 'mask', 5, 'pdpl'],
    ['pr_iban_pdpl', 'Block IBAN disclosure', 'IBAN must never leave the organization', 'iban', 'block', 25, 'pdpl'],
    ['pr_iban_nca', 'Block IBAN - NCA', 'NCA financial data protection', 'iban', 'block', 25, 'nca_ecc'],
    ['pr_email_pdpl', 'Mask email addresses', 'PDPL email masking', 'email', 'mask', 5, 'pdpl'],
    ['pr_patient_sfda', 'Block patient IDs - SFDA', 'SFDA patient data protection', 'patient_id', 'block', 30, 'sfda'],
    ['pr_patient_health', 'Block patient IDs - Healthcare', 'Healthcare patient data protection', 'patient_id', 'block', 30, 'healthcare'],
    ['pr_credit_pdpl', 'Block credit cards', 'PDPL financial data protection', 'credit_card', 'block', 20, 'pdpl'],
    ['pr_credit_nca', 'Block credit cards - NCA', 'NCA financial data protection', 'credit_card', 'block', 20, 'nca_ecc'],
    ['pr_passport_pdpl', 'Mask passport numbers', 'PDPL passport masking', 'passport', 'mask', 15, 'pdpl'],
    ['pr_ip_nca', 'Mask IP addresses', 'NCA network data protection', 'ip_address', 'mask', 3, 'nca_ecc'],
  ];

  for (const row of defaults) {
    await pool.query(
      `INSERT INTO kernel_policy_rules (id, name, description, pii_type, action, risk_score_modifier, compliance_pack, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9)`,
      [row[0], row[1], row[2], row[3], row[4], row[5], row[6], now, now]
    );
  }
  console.log(`[BrightTrust Kernel] Seeded ${defaults.length} default policy rules`);
}

module.exports = { getDb, initializeDatabase, generateId };
