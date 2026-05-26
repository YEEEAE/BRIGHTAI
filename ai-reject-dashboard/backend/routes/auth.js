const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { get, run } = require('../config/database');
const { requireAuth, setAuthCookies, clearAuthCookies, REFRESH_COOKIE } = require('../middleware/auth');
const authService = require('../services/authService');
const twoFactorService = require('../services/twoFactorService');
const { logAction } = require('../services/auditService');

const router = express.Router();

// AR: مخزن مؤقت لرموز استعادة كلمة المرور (Reset Tokens)
// EN: Temporary memory store for password reset tokens
const passwordResetStore = new Map();

/**
 * POST /api/auth/login
 * AR: تسجيل الدخول والتحقق من كلمة المرور والـ 2FA
 */
router.post('/auth/login', async (req, res) => {
  const { email, password, twoFactorToken } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  const context = {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  try {
    const user = await authService.authenticate(email, password, context);

    // التحقق من تفعيل 2FA للمستخدم
    if (user.two_factor_enabled) {
      if (!twoFactorToken) {
        // AR: مطالبة المستخدم برمز الـ 2FA دون إتمام الدخول
        // EN: Require 2FA token without finalizing login
        return res.json({ 
          success: true, 
          require2FA: true, 
          message: 'رمز التحقق الثنائي (2FA) مطلوب لإتمام تسجيل الدخول.' 
        });
      }

      const verified = twoFactorService.verifyToken(user.two_factor_secret, twoFactorToken);
      if (!verified) {
        await logAction({
          userId: user.id,
          userName: user.name,
          ...context,
          action: 'login',
          resource: 'users',
          status: 'failure',
          details: `فشل التحقق من رمز الـ 2FA للمستخدم: ${email}`
        });
        return res.status(400).json({ success: false, message: 'رمز التحقق الثنائي غير صحيح أو منتهي الصلاحية.' });
      }
    }

    // إعداد الكوكيز وتسجيل الجلسة
    await setAuthCookies(res, user, context);

    await logAction({
      userId: user.id,
      userName: user.name,
      ...context,
      action: 'login',
      resource: 'users',
      status: 'success',
      details: `تسجيل دخول ناجح للمستخدم: ${email}`
    });

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });

  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * AR: تسجيل الخروج وإبطال الجلسة النشطة
 */
router.post('/auth/logout', requireAuth, async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  const context = {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  try {
    if (token) {
      const jwt = require('jsonwebtoken');
      const config = require('../config/env');
      const decoded = jwt.verify(token, config.jwtSecret, { issuer: 'ai-reject-dashboard', ignoreExpiration: true });
      if (decoded && decoded.jti) {
        await authService.revokeSession(decoded.jti);
      }
    }

    clearAuthCookies(res);

    await logAction({
      userId: req.user.sub,
      userName: req.user.name,
      ...context,
      action: 'logout',
      resource: 'users',
      status: 'success',
      details: 'تسجيل خروج ناجح وإبطال الجلسة'
    });

    return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
  } catch (err) {
    clearAuthCookies(res);
    return res.json({ success: true, message: 'Logged out with warnings' });
  }
});

/**
 * POST /api/auth/refresh
 * AR: تجديد توكن الوصول يدوياً (في حال تعذر وسيط الحماية التلقائي)
 */
router.post('/auth/refresh', async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token is missing' });

  try {
    const jwt = require('jsonwebtoken');
    const config = require('../config/env');
    const payload = jwt.verify(token, config.jwtSecret, { issuer: 'ai-reject-dashboard' });

    const active = await authService.isSessionActive(payload.jti);
    if (!active) {
      await run('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [payload.sub]);
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Session compromised. Re-authentication required.' });
    }

    // تدوير التوكن
    await authService.revokeSession(payload.jti);

    const user = await get('SELECT * FROM users WHERE id = ?', [payload.sub]);
    if (!user || user.status !== 'active') {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Account is locked or suspended' });
    }

    const context = {
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    await setAuthCookies(res, user, context);
    return res.json({ success: true, message: 'Access token refreshed successfully.' });

  } catch (err) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

/**
 * GET /api/auth/me
 * AR: جلب تفاصيل الموظف الحالي وتفضيلاته وجلساته
 */
router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await get('SELECT id, email, name, avatar, status, two_factor_enabled FROM users WHERE id = ?', [req.user.sub]);
    const prefs = await get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.sub]);
    const sessions = await authService.getUserActiveSessions(req.user.sub);
    const tokens = await all('SELECT id, name, created_at, expires_at, is_active FROM user_api_tokens WHERE user_id = ? AND is_active = 1', [req.user.sub]);

    return res.json({
      success: true,
      data: {
        user,
        preferences: prefs,
        activeSessions: sessions,
        apiTokens: tokens
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile info' });
  }
});

/**
 * PUT /api/auth/me
 * AR: تحديث البيانات الشخصية والاسم والتفضيلات
 */
router.put('/auth/me', requireAuth, async (req, res) => {
  const { name, avatar, language, theme, channels, quietHours } = req.body;
  const userId = req.user.sub;
  const now = Date.now();

  try {
    // 1. تحديث الاسم والأفاتار
    if (name) {
      await run('UPDATE users SET name = ?, avatar = ?, updated_at = ? WHERE id = ?', [name, avatar || '👤', now, userId]);
    }

    // 2. تحديث التفضيلات
    if (language || theme || channels || quietHours) {
      await run(
        `UPDATE user_preferences 
         SET language = ?, theme = ?, channels_in_app = ?, channels_email = ?, channels_push = ?, 
             quiet_hours_enabled = ?, quiet_hours_from = ?, quiet_hours_to = ?, updated_at = ?
         WHERE user_id = ?`,
        [
          language || 'ar',
          theme || 'light',
          channels?.in_app ? 1 : 0,
          channels?.email ? 1 : 0,
          channels?.push ? 1 : 0,
          quietHours?.enabled ? 1 : 0,
          quietHours?.from || 22,
          quietHours?.to || 7,
          now,
          userId
        ]
      );
    }

    return res.json({ success: true, message: 'تم تحديث البيانات الشخصية والتفضيلات بنجاح.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

/**
 * POST /api/auth/change-password
 * AR: تغيير كلمة المرور والتحقق من الشروط الأمنية والتاريخ
 */
router.post('/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.sub;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new passwords.' });
  }

  try {
    const user = await get('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة.' });
    }

    await authService.changePassword(userId, newPassword);

    await logAction({
      userId,
      userName: req.user.name,
      action: 'change-password',
      resource: 'users',
      status: 'success',
      details: 'تم تغيير كلمة المرور بنجاح للمستخدم وتحديث السجل التاريخي لمنع التكرار'
    });

    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Failed to change password' });
  }
});

/**
 * POST /api/auth/2fa/setup
 * AR: إعداد التحقق الثنائي وتوليد كود الـ QR
 */
router.post('/auth/2fa/setup', requireAuth, async (req, res) => {
  const email = req.user.email;

  try {
    const { otpauthUrl, base32 } = twoFactorService.generateSecret(email);
    const qrCodeUrl = await twoFactorService.generateQRCodeUrl(otpauthUrl);

    // حفظ مؤقت للسر بالذاكرة أو قاعدة البيانات حتى التأكيد
    await run('UPDATE users SET two_factor_secret = ? WHERE id = ?', [base32, req.user.sub]);

    return res.json({
      success: true,
      data: {
        qrCodeUrl,
        secret: base32
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to setup 2FA' });
  }
});

/**
 * POST /api/auth/2fa/enable
 * AR: تأكيد وتفعيل التحقق الثنائي للمستخدم
 */
router.post('/auth/2fa/enable', requireAuth, async (req, res) => {
  const { token } = req.body;
  const userId = req.user.sub;

  if (!token) {
    return res.status(400).json({ success: false, message: 'الرمز مطلوب لإتمام التفعيل.' });
  }

  try {
    const user = await get('SELECT two_factor_secret FROM users WHERE id = ?', [userId]);
    if (!user.two_factor_secret) {
      return res.status(400).json({ success: false, message: 'يرجى تهيئة إعدادات 2FA أولاً وتوليد كود QR.' });
    }

    const verified = twoFactorService.verifyToken(user.two_factor_secret, token);
    if (!verified) {
      return res.status(400).json({ success: false, message: 'رمز التحقق الثنائي غير صحيح. حاول مجدداً.' });
    }

    await run('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [userId]);

    await logAction({
      userId,
      userName: req.user.name,
      action: 'enable-2fa',
      resource: 'users',
      status: 'success',
      details: 'تم تفعيل التحقق الثنائي (2FA) بنجاح لتأمين الحساب'
    });

    return res.json({ success: true, message: 'تم تفعيل التحقق الثنائي (2FA) بنجاح.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to enable 2FA' });
  }
});

/**
 * POST /api/auth/2fa/disable
 * AR: إلغاء تفعيل التحقق الثنائي للمستخدم
 */
router.post('/auth/2fa/disable', requireAuth, async (req, res) => {
  const { password } = req.body;
  const userId = req.user.sub;

  if (!password) {
    return res.status(400).json({ success: false, message: 'تأكيد كلمة المرور مطلوب لإلغاء تفعيل 2FA.' });
  }

  try {
    const user = await get('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'كلمة المرور غير صحيحة.' });
    }

    await run('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?', [userId]);

    await logAction({
      userId,
      userName: req.user.name,
      action: 'disable-2fa',
      resource: 'users',
      status: 'success',
      details: 'تم إلغاء تفعيل التحقق الثنائي (2FA)'
    });

    return res.json({ success: true, message: 'تم إلغاء تفعيل التحقق الثنائي (2FA) بنجاح.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
  }
});

/**
 * POST /api/auth/sessions/:id/revoke
 * AR: إنهاء جلسة معينة للمستخدم (تسجيل خروج جهاز مخصص)
 */
router.delete('/auth/sessions/:id', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.sub;

  try {
    const sess = await get('SELECT token_jti FROM sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
    if (!sess) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    await authService.revokeSession(sess.token_jti);

    await logAction({
      userId,
      userName: req.user.name,
      action: 'revoke-session',
      resource: 'sessions',
      resourceId: sessionId,
      status: 'success',
      details: `تم فرض تسجيل الخروج لجهاز وجلسة معينة: ${sessionId}`
    });

    return res.json({ success: true, message: 'تم إنهاء الجلسة بنجاح.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to revoke session' });
  }
});

/**
 * POST /api/auth/forgot-password
 * AR: طلب استعادة كلمة المرور وإرجاع الرمز (للمحاكاة)
 */
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Please provide email.' });

  try {
    const user = await get('SELECT id, name FROM users WHERE email = ?', [email]);
    if (!user) {
      // AR: حماية الخصوصية: لا نكشف عما إذا كان البريد مسجلاً أم لا
      // EN: Privacy preservation: do not leak email registration status
      return res.json({ success: true, message: 'إذا كان البريد مسجلاً، فستصلك تعليمات استعادة الحساب.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 ساعة صلاحية

    passwordResetStore.set(resetToken, { userId: user.id, expiresAt });

    // محاكاة إرسال البريد
    console.log(`✉️ Reset link for ${email}: http://localhost:3000/pages/reset-password.html?token=${resetToken}`);

    return res.json({
      success: true,
      message: 'تم إرسال رابط استعادة كلمة المرور بنجاح (يرجى مراجعة سجلات الخادم Console للرابط الفعلي للمحاكاة).',
      resetToken: resetToken // إرجاع الرمز للفرونتند لتسهيل التفاعل بالاختبار
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to request reset' });
  }
});

/**
 * POST /api/auth/reset-password
 * AR: إعادة تعيين كلمة المرور برمز الاستعادة
 */
router.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required.' });
  }

  try {
    const record = passwordResetStore.get(token);
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'رمز استعادة كلمة المرور غير صحيح أو منتهي الصلاحية.' });
    }

    await authService.changePassword(record.userId, newPassword);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [record.userId]);
    passwordResetStore.delete(token);

    await logAction({
      userId: record.userId,
      userName: user.name,
      action: 'reset-password',
      resource: 'users',
      status: 'success',
      details: 'تمت إعادة تعيين كلمة المرور بنجاح عبر بريد الاستعادة المعتمد'
    });

    return res.json({ success: true, message: 'تم تعيين كلمة المرور الجديدة بنجاح.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Reset failed' });
  }
});

/**
 * POST /api/auth/api-tokens
 * AR: توليد API integration token للمستخدم
 */
router.post('/auth/api-tokens', requireAuth, async (req, res) => {
  const { name, expiresDays } = req.body;
  const userId = req.user.sub;

  if (!name) return res.status(400).json({ success: false, message: 'API Token name is required' });

  try {
    const rawToken = 'br_' + crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const id = 'tok_' + crypto.randomUUID();
    const expiresAt = expiresDays ? Date.now() + expiresDays * 24 * 60 * 60 * 1000 : null;
    const now = Date.now();

    await run(
      `INSERT INTO user_api_tokens (id, user_id, name, token_hash, created_at, expires_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [id, userId, name, tokenHash, now, expiresAt]
    );

    await logAction({
      userId,
      userName: req.user.name,
      action: 'generate-api-token',
      resource: 'api_tokens',
      resourceId: id,
      status: 'success',
      details: `تم إصدار وتوليد مفتاح تكامل برمجيات خارجي: ${name}`
    });

    return res.json({
      success: true,
      message: 'تم توليد مفتاح الـ API بنجاح. يرجى حفظه الآن لأنه لن يظهر مجدداً.',
      token: rawToken
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate API token' });
  }
});

module.exports = router;
