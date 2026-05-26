const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const { get, run } = require('../config/database');
const { isSessionActive, revokeSession, createSession } = require('../services/authService');
const { getUserPermissions } = require('../services/rbacService');
const { requirePermission, requireRole } = require('./rbac');

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge
  };
}

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: ACCESS_TTL, issuer: 'ai-reject-dashboard' });
}

function signRefreshToken(payload) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, config.jwtSecret, {
    expiresIn: REFRESH_TTL,
    issuer: 'ai-reject-dashboard'
  });
  return { token, jti };
}

async function setAuthCookies(res, user, context = {}) {
  const permissions = await getUserPermissions(user.id);
  const payload = { sub: user.id, name: user.name, email: user.email, role: user.role || 'admin', permissions };
  
  const accessToken = signAccessToken(payload);
  const { token: refreshToken, jti } = signRefreshToken({ sub: user.id, role: user.role || 'admin' });

  // حفظ الجلسة في SQLite
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  await createSession(user.id, jti, context, expiresAt);

  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { issuer: 'ai-reject-dashboard' });
}

/**
 * AR: برمجية وسيطة للتحقق من هوية المستخدم وجلسته النشطة في SQLite
 * EN: Middleware to verify user authentication and active DB session
 */
async function requireAuth(req, res, next) {
  const accessToken = req.cookies[ACCESS_COOKIE];

  if (!accessToken) {
    // AR: محاولة تجديد التوكن تلقائياً إذا كان الـ Access انتهى والـ Refresh موجود
    // EN: Attempt auto-refresh if Access token is missing but Refresh is present
    const refreshToken = req.cookies[REFRESH_COOKIE];
    if (refreshToken) {
      try {
        await handleTokenRefresh(req, res);
        return next();
      } catch (err) {
        clearAuthCookies(res);
        return res.status(401).json({ success: false, message: 'Authentication session expired. Please sign in again.' });
      }
    }
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const payload = verifyToken(accessToken);
    req.user = payload;
    
    // جلب وحفظ الصلاحيات الحية لـ req.user لضمان الفحص الأحدث
    req.user.permissions = await getUserPermissions(payload.sub);
    return next();
  } catch (err) {
    // Access token expired, attempt auto-refresh
    const refreshToken = req.cookies[REFRESH_COOKIE];
    if (refreshToken) {
      try {
        await handleTokenRefresh(req, res);
        return next();
      } catch (refreshErr) {
        clearAuthCookies(res);
        return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
      }
    }
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
}

/**
 * AR: معالجة تدوير توكن التجديد (Token Rotation) للحماية المطلقة
 * EN: Handle Refresh Token Rotation for absolute security
 */
async function handleTokenRefresh(req, res) {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) throw new Error('Refresh token is missing');

  const payload = verifyToken(token);
  
  // التحقق من أن الجلسة نشطة في SQLite
  const active = await isSessionActive(payload.jti);
  if (!active) {
    // AR: كشف خرق أمني محتمل! إبطال كافة جلسات المستخدم
    // EN: Detect potential breach! Revoke all sessions for this user
    await run('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [payload.sub]);
    throw new Error('Refresh token has been compromised');
  }

  // إبطال الجلسة القديمة (تدوير)
  await revokeSession(payload.jti);

  // جلب المستخدم من قاعدة البيانات
  const user = await get('SELECT * FROM users WHERE id = ?', [payload.sub]);
  if (!user || user.status !== 'active') {
    throw new Error('User account is locked or suspended');
  }

  // تعيين الكوكيز وتدوير التوكن
  const context = {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };
  
  await setAuthCookies(res, user, context);
  
  // إعادة تعيين req.user
  const permissions = await getUserPermissions(user.id);
  req.user = { sub: user.id, name: user.name, email: user.email, role: user.role || 'admin', permissions };
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  requireAuth,
  requirePermission,
  requireRole,
  setAuthCookies,
  clearAuthCookies,
  verifyToken
};
