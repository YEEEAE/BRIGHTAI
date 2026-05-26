const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const { get, run } = require('../config/database');
const { isSessionActive, revokeSession, createSession } = require('../services/authService');
const { getUserPermissions, getUserRoles } = require('../services/rbacService');
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
  const roles = await getUserRoles(user.id);
  const roleNames = roles.map((role) => role.name);
  const payload = { sub: user.id, name: user.name, email: user.email, roles: roleNames, permissions };
  
  const accessToken = signAccessToken(payload);
  const { token: refreshToken, jti } = signRefreshToken({ sub: user.id, roles: roleNames });

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

function sendUnauthorized(req, res, message) {
  if (req.accepts(['html', 'json']) === 'html') {
    return res.redirect('/login');
  }
  return res.status(401).json({ success: false, message });
}

/**
 * AR: برمجية وسيطة للتحقق من هوية المستخدم وجلسته النشطة في SQLite
 * EN: Middleware to verify user authentication and active DB session
 */
async function requireAuth(req, res, next) {
  const accessToken = req.cookies[ACCESS_COOKIE];
  const refreshToken = req.cookies[REFRESH_COOKIE];

  // 1. إذا كان توكن الوصول (Access Token) مفقوداً تماماً من المتصفح
  if (!accessToken) {
    // محاولة التجديد التلقائي الصامت فوراً إذا كان توكن التجديد (Refresh Token) موجوداً وصالحاً
    if (refreshToken) {
      try {
        await handleTokenRefresh(req, res);
        return next();
      } catch (err) {
        clearAuthCookies(res);
        return sendUnauthorized(req, res, 'انتهت صلاحية جلسة العمل الفعالة. يرجى تسجيل الدخول مجدداً.');
      }
    }
    return sendUnauthorized(req, res, 'المصادقة مطلوبة للوصول لهذا المورد.');
  }

  try {
    const payload = verifyToken(accessToken);
    req.user = payload;
    
    // جلب الصلاحيات والأدوار الفورية والمحدثة لضمان الدقة الكاملة
    req.user.roles = (await getUserRoles(payload.sub)).map((role) => role.name);
    req.user.permissions = await getUserPermissions(payload.sub);
    return next();
  } catch (err) {
    // 2. إذا انتهت صلاحية توكن الوصول (TokenExpiredError) وكان توكن التجديد متاحاً
    if (err.name === 'TokenExpiredError' && refreshToken) {
      try {
        await handleTokenRefresh(req, res);
        return next();
      } catch (refreshErr) {
        clearAuthCookies(res);
        return sendUnauthorized(req, res, 'انتهت جلستك الحالية تماماً. يرجى إعادة تسجيل الدخول.');
      }
    }
    
    // إبطال الكوكيز في حال وجود أي خطأ فني أو تلاعب بالتوكن
    clearAuthCookies(res);
    return sendUnauthorized(req, res, 'توكن الوصول غير صالح أو منتهي الصلاحية.');
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
  const roles = (await getUserRoles(user.id)).map((role) => role.name);
  req.user = { sub: user.id, name: user.name, email: user.email, roles, permissions };
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
