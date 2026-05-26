const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('./env');

// AR: مسار قاعدة البيانات - سيتم إنشاؤه في backend/data/reject_dashboard.sqlite
// EN: Database file path - to be created in backend/data/reject_dashboard.sqlite
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'reject_dashboard.sqlite');
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');

// AR: التأكد من وجود مجلد البيانات
// EN: Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance = null;

/**
 * AR: تهيئة وفتح اتصال قاعدة البيانات SQLite
 * EN: Initialize and open SQLite database connection
 */
function getDatabase() {
  if (dbInstance) return dbInstance;

  dbInstance = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Failed to connect to SQLite database:', err.message);
    } else {
      console.log('🔌 Connected to SQLite database successfully at:', DB_PATH);
    }
  });

  return dbInstance;
}

/**
 * AR: تشغيل استعلام SQL مع الوعود
 * EN: Promise wrapper for db.run
 */
function run(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

/**
 * AR: جلب استعلام SQL فردي مع الوعود
 * EN: Promise wrapper for db.get
 */
function get(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * AR: جلب استعلام SQL متعدد مع الوعود
 * EN: Promise wrapper for db.all
 */
function all(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * AR: تشغيل ملف الـ Schema لتأسيس الجداول وتعبئتها
 * EN: Execute Schema file to construct and seed tables
 */
async function initializeDatabase() {
  const db = getDatabase();
  
  try {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    // AR: تقسيم الملف لتشغيل كل أمر SQL على حدة لقيد SQLite
    // EN: Split file to run each SQL statement individually
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await run(statement);
    }

    console.log('✅ SQLite Tables verified and initialized successfully.');
    
    // AR: تشغيل تعبئة البيانات التلقائية (Seeding)
    // EN: Run Seeding process
    await seedDatabase();
  } catch (err) {
    console.error('❌ Database Initialization failed:', err.message);
    throw err;
  }
}

/**
 * AR: تعبئة البيانات التجريبية والأدوار والصلاحيات
 * EN: Seeding sample data, roles, and permissions
 */
async function seedDatabase() {
  const now = Date.now();

  // 1. إدراج الصلاحيات الـ 17 (Permissions)
  const permissions = [
    { id: 'p1', name: 'view:dashboard', desc: 'عرض لوحة القيادة الرئيسية' },
    { id: 'p2', name: 'view:executive', desc: 'عرض منظور الإدارة التنفيذية' },
    { id: 'p3', name: 'view:finance', desc: 'عرض منظور التحليلات المالية' },
    { id: 'p4', name: 'view:quality', desc: 'عرض منظور إدارة الجودة والـ CAPA' },
    { id: 'p5', name: 'view:production', desc: 'عرض منظور الإنتاج والعمليات MES' },
    { id: 'p6', name: 'view:workflow', desc: 'عرض مسارات العمل والاعتمادات' },
    { id: 'p7', name: 'view:technical', desc: 'عرض منظور البنية التحتية والガイド IT' },
    { id: 'p8', name: 'view:audit', desc: 'عرض ومراقبة سجلات التدقيق والمراجعة' },
    { id: 'p9', name: 'approve:level1', desc: 'الموافقة على مرفوضات المستوى 1 (< 5 آلاف ريال)' },
    { id: 'p10', name: 'approve:level2', desc: 'الموافقة على مرفوضات المستوى 2 (5-50 ألف ريال)' },
    { id: 'p11', name: 'approve:level3', desc: 'الموافقة على مرفوضات المستوى 3 (> 50 ألف ريال)' },
    { id: 'p12', name: 'generate:reports', desc: 'توليد وجدولة التقارير الدورية الفاخرة' },
    { id: 'p13', name: 'export:data', desc: 'تصدير البيانات بصيغ Excel/PDF/PowerPoint' },
    { id: 'p14', name: 'manage:users', desc: 'إدارة الموظفين والحسابات والأدوار' },
    { id: 'p15', name: 'manage:settings', desc: 'تعديل إعدادات النظام الحساسة' },
    { id: 'p16', name: 'use:ai', desc: 'استخدام تشات المساعد الذكي وحلول AI' },
    { id: 'p17', name: 'view:sensitive', desc: 'عرض البيانات السرية للغاية وهوامش الربح' }
  ];

  for (const p of permissions) {
    await run(
      'INSERT OR IGNORE INTO permissions (id, name, description) VALUES (?, ?, ?)',
      [p.id, p.name, p.desc]
    );
  }

  // 2. إدراج الأدوار الـ 9 (Roles)
  const roles = [
    { id: 'r1', name: 'Super yazeed QC', desc: 'مدير الجودة الفائق والمشرف العام على المنصة وكافة الإعدادات' },
    { id: 'r2', name: 'Executive', desc: 'أعضاء الإدارة العليا ورؤساء مجالس الإدارة (CEO/COO)' },
    { id: 'r3', name: 'Finance Manager', desc: 'المدير المالي وفريق المحاسبة والتحكم في الهدر (CFO)' },
    { id: 'r4', name: 'Quality Manager', desc: 'مدراء الجودة ومراقبة الامتثال الطبي وخطط الـ CAPA' },
    { id: 'r5', name: 'Production Manager', desc: 'مدراء خطوط الإنتاج والورديات والآلات وتشغيل MES' },
    { id: 'r6', name: 'QC Inspector', desc: 'مفتشو الجودة والملاحظون الميدانيون في خطوط التصنيع' },
    { id: 'r7', name: 'Warehouse Operator', desc: 'مشغلو المستودعات وأمناء batch المواد الطبية' },
    { id: 'r8', name: 'Auditor', desc: 'المدققون الخارجيون وهيئة الغذاء والدواء SFDA ورصد الامتثال' },
    { id: 'r9', name: 'Viewer', desc: 'حسابات استعراضية بسيطة للمؤشرات العامة فقط دون تفاعل' }
  ];

  for (const r of roles) {
    await run(
      'INSERT OR IGNORE INTO roles (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      [r.id, r.name, r.desc, now]
    );
  }

  // 3. إدراج العلاقات بين الأدوار والصلاحيات (Role-Permissions)
  const rolePermissionsMapping = {
    'r1': ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17'], // Super yazeed QC (الكل)
    'r2': ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p8', 'p10', 'p11', 'p12', 'p13', 'p16', 'p17'], // Executive
    'r3': ['p1', 'p3', 'p6', 'p9', 'p10', 'p11', 'p12', 'p13', 'p16', 'p17'], // Finance Manager
    'r4': ['p1', 'p4', 'p6', 'p9', 'p10', 'p12', 'p13', 'p16'], // Quality Manager
    'r5': ['p1', 'p5', 'p6', 'p9', 'p12', 'p13', 'p16'], // Production Manager
    'r6': ['p1', 'p4', 'p16'], // QC Inspector
    'r7': ['p1', 'p5'], // Warehouse Operator
    'r8': ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p8', 'p12', 'p13'], // Auditor
    'r9': ['p1'] // Viewer
  };

  for (const [roleId, permIds] of Object.entries(rolePermissionsMapping)) {
    for (const permId of permIds) {
      await run(
        'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        [roleId, permId]
      );
    }
  }

  // 4. إدراج المشرف الفائق الافتراضي (yazeed@brightai.site)
  const adminEmail = 'yazeed@brightai.site';
  const existingAdmin = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);

  if (!existingAdmin) {
    const adminId = 'usr_super_yazeed';
    const rawPass = 'BrightAI@2026!';
    const passwordHash = await bcrypt.hash(rawPass, 12);
    
    // إدراج المستخدم الفائق
    await run(
      `INSERT INTO users (id, email, password_hash, name, avatar, status, password_changed_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [adminId, adminEmail, passwordHash, 'Super yazeed QC', '👑', 'active', now, now, now]
    );

    // ربط بالدور الفائق r1
    await run(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [adminId, 'r1']
    );

    // إدراج التفضيلات الافتراضية
    await run(
      `INSERT INTO user_preferences (user_id, language, theme, channels_in_app, updated_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, 'ar', 'dark', 1, now]
    );

    console.log('👤 Seeding default Super Admin user (yazeed@brightai.site) completed.');
  }
}

module.exports = {
  getDatabase,
  run,
  get,
  all,
  initializeDatabase
};
