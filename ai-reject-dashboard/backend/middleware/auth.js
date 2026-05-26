const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const refreshTokenStore = new Map();

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
  refreshTokenStore.set(jti, { sub: payload.sub, createdAt: Date.now() });
  return token;
}

function setAuthCookies(res, user) {
  const payload = { sub: user.id, role: user.role || 'admin' };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // AR: الكوكي HttpOnly لا يقرأها JavaScript، وهذا يحمي التوكن من XSS.
  // EN: HttpOnly cookies are not readable by JavaScript, reducing XSS token theft.
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

function requireAuth(req, res, next) {
  if (!config.dashboardToken && !config.dashboardPasswordHash) return next();

  const token = req.cookies[ACCESS_COOKIE];
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
}

function refreshAccessToken(req, res) {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token is missing' });

  try {
    const payload = verifyToken(token);
    if (!payload.jti || !refreshTokenStore.has(payload.jti)) {
      return res.status(401).json({ success: false, message: 'Refresh token has been revoked' });
    }

    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
    res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
    return res.json({ success: true, message: 'Access token refreshed' });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
}

function revokeRefreshToken(req) {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) return;

  try {
    const payload = verifyToken(token);
    if (payload.jti) refreshTokenStore.delete(payload.jti);
  } catch (err) {
    // AR: لا نكشف تفاصيل التوكن للعميل أثناء تسجيل الخروج.
    // EN: Do not expose token details during logout.
  }
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  requireAuth,
  setAuthCookies,
  clearAuthCookies,
  refreshAccessToken,
  revokeRefreshToken
};
