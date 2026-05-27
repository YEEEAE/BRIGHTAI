'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let db = null;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

function generateId(prefix) {
  return prefix + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

function initializeDatabase() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, 'brighttrust.sqlite');
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  seedDefaultPolicies();

  console.log(`[BrightTrust Kernel] SQLite initialized at ${dbPath}`);
  return db;
}

function seedDefaultPolicies() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM kernel_policy_rules').get();
  if (existing.count > 0) return;

  const now = Date.now();
  const insert = db.prepare(`
    INSERT INTO kernel_policy_rules (id, name, description, pii_type, action, risk_score_modifier, compliance_pack, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

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

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(row[0], row[1], row[2], row[3], row[4], row[5], row[6], now, now);
    }
  });
  insertMany(defaults);
  console.log(`[BrightTrust Kernel] Seeded ${defaults.length} default policy rules`);
}

module.exports = { getDb, initializeDatabase, generateId };
