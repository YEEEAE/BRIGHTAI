const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const config = require('../config/env');
const validate = require('../middleware/validate');
const { audit } = require('../utils/logger');
const {
  setAuthCookies,
  clearAuthCookies,
  refreshAccessToken,
  revokeRefreshToken
} = require('../middleware/auth');

const router = express.Router();

const loginSchema = Joi.object({
  token: Joi.string().trim().min(8).max(500).required()
});

async function isValidCredential(token) {
  if (config.dashboardPasswordHash) {
    // AR: bcrypt يحمي كلمة المرور لو تسرب ملف البيئة.
    // EN: bcrypt protects the password if environment configuration leaks.
    return bcrypt.compare(token, config.dashboardPasswordHash);
  }
  if (config.dashboardToken) return token === config.dashboardToken;
  return true;
}

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const valid = await isValidCredential(req.body.token);
    if (!valid) {
      audit('LOGIN_FAILED', req, 'Invalid credential');
      return res.status(401).json({ success: false, message: 'Invalid access token' });
    }

    setAuthCookies(res, { id: 'dashboard-admin', role: 'admin' });
    audit('LOGIN_SUCCESS', req);
    return res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    return next(err);
  }
});

router.post('/refresh', refreshAccessToken);

router.post('/logout', (req, res) => {
  revokeRefreshToken(req);
  clearAuthCookies(res);
  audit('LOGOUT', req);
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
