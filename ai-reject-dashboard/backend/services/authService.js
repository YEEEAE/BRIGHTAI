const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { run, get, all } = require('../config/database');
const { logAction } = require('./auditService');

const LOCKOUT_LIMIT = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // AR: 15 دقيقة قفل مؤقت
const PASSWORD_HISTORY_LIMIT = 3;

/**
 * AR: التحقق من قوة وصحة كلمة المرور المستهدفة
 * EN: Verify strength of password based on strict security policy
 */
function validatePasswordStrength(password) {
  if (password.length < 12) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);

  return hasUppercase && hasLowercase && hasNumbers && hasSymbols;
}

/**
 * AR: التحقق من مصداقية حساب وكلمة المرور وتحديث المحاولات الفاشلة وسياسة القفل
 * EN: Authenticate user, update failed attempts and manage Lockout policy
 */
async function authenticate(email, password, context = {}) {
  const { ipAddress = '127.0.0.1', userAgent = 'Unknown' } = context;
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);

  if (!user) {
    // AR: تسجيل محاولة دخول فاشلة لمستخدم غير مسجل دون الكشف عن التفاصيل للعميل
    // EN: Log failed attempt for unknown user
    await logAction({
      ipAddress,
      userAgent,
      action: 'login',
      resource: 'users',
      status: 'failure',
      details: `محاولة دخول فاشلة لبريد غير مسجل: ${email}`
    });
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  }

  const now = Date.now();

  // AR: التحقق من القفل المؤقت للحساب
  // EN: Check temporary account lockout
  if (user.status === 'locked' && user.lockout_until && user.lockout_until > now) {
    const minutesLeft = Math.ceil((user.lockout_until - now) / (60 * 1000));
    
    await logAction({
      userId: user.id,
      userName: user.name,
      ipAddress,
      userAgent,
      action: 'login',
      resource: 'users',
      status: 'failure',
      details: `محاولة دخول لحساب مقفل مؤقتاً: ${email}`
    });
    throw new Error(`هذا الحساب مقفل مؤقتاً بسبب محاولات خاطئة متكررة. يرجى المحاولة بعد ${minutesLeft} دقيقة.`);
  }

  // AR: إعادة تفعيل الحساب إذا انتهت مدة القفل تلقائياً
  // EN: Unlock account automatically if lockout duration has passed
  if (user.status === 'locked' && user.lockout_until && user.lockout_until <= now) {
    await run("UPDATE users SET status = 'active', failed_attempts = 0, lockout_until = NULL WHERE id = ?", [user.id]);
    user.status = 'active';
    user.failed_attempts = 0;
  }

  if (user.status !== 'active') {
    throw new Error('هذا الحساب معطل أو غير نشط حالياً. يرجى مراجعة إدارة النظام.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    const newAttempts = (user.failed_attempts || 0) + 1;
    
    if (newAttempts >= LOCKOUT_LIMIT) {
      const lockoutTime = now + LOCKOUT_DURATION;
      await run("UPDATE users SET status = 'locked', failed_attempts = ?, lockout_until = ? WHERE id = ?", [newAttempts, lockoutTime, user.id]);
      
      await logAction({
        userId: user.id,
        userName: user.name,
        ipAddress,
        userAgent,
        action: 'lockout',
        resource: 'users',
        status: 'failure',
        details: `تم قفل وتجميد الحساب تلقائياً بعد تجاوز محاولات الدخول الخاطئة: ${email}`
      });
      throw new Error(`تم قفل حسابك مؤقتاً لمدة 15 دقيقة بعد 5 محاولات خاطئة متتالية.`);
    } else {
      await run("UPDATE users SET failed_attempts = ? WHERE id = ?", [newAttempts, user.id]);
      
      await logAction({
        userId: user.id,
        userName: user.name,
        ipAddress,
        userAgent,
        action: 'login',
        resource: 'users',
        status: 'failure',
        details: `محاولة دخول بكلمة مرور خاطئة (محاولة رقم ${newAttempts}): ${email}`
      });
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
  }

  // AR: تصفير عداد المحاولات الفاشلة بعد الدخول الناجح
  // EN: Reset failed attempts counter after successful login
  await run("UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = ?", [user.id]);

  return user;
}

/**
 * AR: إنشاء جلسة جديدة نشطة لجهاز العميل في قاعدة البيانات
 * EN: Create a new active session for a client device
 */
async function createSession(userId, tokenJti, context = {}, expiresAt) {
  const { ipAddress = '127.0.0.1', userAgent = 'Unknown' } = context;
  const id = 'sess_' + crypto.randomUUID();
  const now = Date.now();

  await run(
    `INSERT INTO sessions (id, user_id, token_jti, ip_address, user_agent, is_active, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, userId, tokenJti, ipAddress, userAgent, expiresAt, now]
  );

  return id;
}

/**
 * AR: فحص والتحقق من صلاحية الجلسة بالـ jti
 * EN: Verify if session is still active by jti
 */
async function isSessionActive(tokenJti) {
  const sess = await get('SELECT is_active, expires_at FROM sessions WHERE token_jti = ?', [tokenJti]);
  if (!sess) return false;
  if (!sess.is_active) return false;
  if (sess.expires_at < Date.now()) return false;
  return true;
}

/**
 * AR: إلغاء وتعطيل جلسة معينة (تسجيل خروج جهاز)
 * EN: Revoke specific session (logout a device)
 */
async function revokeSession(tokenJti) {
  await run('UPDATE sessions SET is_active = 0 WHERE token_jti = ?', [tokenJti]);
}

/**
 * AR: إلغاء كافة الجلسات لمستخدم معين (فرض تسجيل خروج لجميع الأجهزة)
 * EN: Revoke all sessions for a user (force logout all devices)
 */
async function revokeAllUserSessions(userId) {
  await run('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [userId]);
}

/**
 * AR: جلب الجلسات النشطة التاريخية للمستخدم الحالي
 * EN: Get active sessions for a user
 */
async function getUserActiveSessions(userId) {
  const query = `
    SELECT id, ip_address, user_agent, created_at, expires_at 
    FROM sessions 
    WHERE user_id = ? AND is_active = 1 AND expires_at > ?
    ORDER BY created_at DESC
  `;
  return all(query, [userId, Date.now()]);
}

/**
 * AR: تغيير كلمة مرور المستخدم مع فحص سجل الكلمات السابقة لمنع التكرار
 * EN: Change password, verifying against password history
 */
async function changePassword(userId, newPassword) {
  if (!validatePasswordStrength(newPassword)) {
    throw new Error('كلمة المرور لا تطابق سياسة الحماية الصارمة (12 حرفاً على الأقل، أحرف كبيرة وصغيرة، أرقام، ورموز).');
  }

  // AR: جلب كلمات المرور السابقة
  // EN: Get password history
  const history = await all(
    'SELECT password_hash FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, PASSWORD_HISTORY_LIMIT]
  );

  // AR: التحقق من عدم استخدام كلمات مرور مستخدمة مسبقاً
  // EN: Ensure password was not used recently
  for (const record of history) {
    const isSame = await bcrypt.compare(newPassword, record.password_hash);
    if (isSame) {
      throw new Error(`لا يمكنك إعادة استخدام كلمات المرور الـ ${PASSWORD_HISTORY_LIMIT} الأخيرة لتأمين حسابك.`);
    }
  }

  const now = Date.now();
  const newHash = await bcrypt.hash(newPassword, 12);

  // تحديث كلمة المرور في جدول المستخدمين
  await run('UPDATE users SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE id = ?', [newHash, now, now, userId]);

  // إدراج الكلمة القديمة في السجل التاريخي
  const historyId = 'pwd_' + crypto.randomUUID();
  await run('INSERT INTO password_history (id, user_id, password_hash, created_at) VALUES (?, ?, ?, ?)', [historyId, userId, newHash, now]);
}

module.exports = {
  authenticate,
  createSession,
  isSessionActive,
  revokeSession,
  revokeAllUserSessions,
  getUserActiveSessions,
  changePassword,
  validatePasswordStrength
};
