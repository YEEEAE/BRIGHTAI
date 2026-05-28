const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { get, run, all } = require('../config/database');
const { requireAuth, requireRole, requirePermission } = require('../middleware/auth');
const { logAction, getAuditLogs } = require('../services/auditService');

const router = express.Router();

/**
 * GET /api/admin/users
 * AR: جلب قائمة الموظفين بالكامل مع أدوارهم وتفضيلاتهم وفلاترهم
 */
router.get('/admin/users', requireAuth, requirePermission('manage:users'), async (req, res) => {
  const { status, role, search } = req.query;
  let query = `
    SELECT u.id, u.email, u.name, u.avatar, u.status, u.created_at, u.updated_at, r.name as role_name 
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND u.status = ?';
    params.push(status);
  }
  if (role) {
    query += ' AND r.name = ?';
    params.push(role);
  }
  if (search) {
    query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY u.created_at DESC';

  try {
    const users = await all(query, params);
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users list' });
  }
});

/**
 * POST /api/admin/users
 * AR: إضافة مستخدم موظف جديد وتعيين دوره وصلاحياته وتشفير كلمته
 */
router.post('/admin/users', requireAuth, requirePermission('manage:users'), async (req, res) => {
  const { email, password, name, avatar, roleName, language, theme } = req.body;
  const context = {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  if (!email || !password || !name || !roleName) {
    return res.status(400).json({ success: false, message: 'Required fields: email, password, name, roleName' });
  }

  try {
    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'هذا البريد الإلكتروني مسجل بالفعل لموظف آخر.' });
    }

    const { validatePasswordStrength } = require('../services/authService');
    if (!validatePasswordStrength(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'كلمة المرور لا تطابق سياسة الحماية الصارمة (12 حرفاً على الأقل، أحرف كبيرة وصغيرة، أرقام، ورموز).' 
      });
    }

    const userId = 'usr_' + crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const now = Date.now();

    // 1. إضافة للمستخدمين
    await run(
      `INSERT INTO users (id, email, password_hash, name, avatar, status, password_changed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [userId, email, passwordHash, name, avatar || '👤', now, now, now]
    );

    // 2. تعيين الدور
    const role = await get('SELECT id FROM roles WHERE name = ?', [roleName]);
    if (!role) {
      return res.status(400).json({ success: false, message: `Role name '${roleName}' not found` });
    }

    await run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, role.id]);

    // 3. إعداد التفضيلات
    await run(
      `INSERT INTO user_preferences (user_id, language, theme, channels_in_app, updated_at)
       VALUES (?, ?, ?, 1, ?)`,
      [userId, language || 'ar', theme || 'light', now]
    );

    await logAction({
      userId: req.user.sub,
      userName: req.user.name,
      ...context,
      action: 'create-user',
      resource: 'users',
      resourceId: userId,
      status: 'success',
      details: `إضافة موظف وحساب جديد بنجاح: ${email} (الاسم: ${name}، الدور: ${roleName})`,
      afterState: { id: userId, email, name, roleName, status: 'active' }
    });

    return res.json({ success: true, message: 'تمت إضافة الموظف الجديد بنجاح وتعيين الصلاحيات.' });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create user' });
  }
});

/**
 * PUT /api/admin/users/:id
 * AR: تعديل بيانات موظف وتغيير حالته ورتبته
 */
router.put('/admin/users/:id', requireAuth, requirePermission('manage:users'), async (req, res) => {
  const userId = req.params.id;
  const { name, avatar, status, roleName } = req.body;
  const context = {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const beforeState = { id: user.id, name: user.name, avatar: user.avatar, status: user.status };
    const now = Date.now();

    // 1. تحديث التفاصيل الأساسية
    if (name || avatar || status) {
      await run(
        'UPDATE users SET name = ?, avatar = ?, status = ?, updated_at = ? WHERE id = ?',
        [name || user.name, avatar || user.avatar, status || user.status, now, userId]
      );
    }

    // 2. تحديث الدور
    if (roleName) {
      const role = await get('SELECT id FROM roles WHERE name = ?', [roleName]);
      if (!role) return res.status(400).json({ success: false, message: 'Role not found' });

      // مسح الدور القديم وإسناد الجديد
      await run('DELETE FROM user_roles WHERE user_id = ?', [userId]);
      await run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, role.id]);
      beforeState.roleName = (await get(`SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`, [userId]))?.name;
    }

    const updatedUser = await get('SELECT * FROM users WHERE id = ?', [userId]);
    const afterState = { id: updatedUser.id, name: updatedUser.name, avatar: updatedUser.avatar, status: updatedUser.status, roleName };

    await logAction({
      userId: req.user.sub,
      userName: req.user.name,
      ...context,
      action: 'update-user',
      resource: 'users',
      resourceId: userId,
      status: 'success',
      details: `تحديث بيانات وحالة الموظف: ${user.email}`,
      beforeState,
      afterState
    });

    return res.json({ success: true, message: 'تم تحديث بيانات الموظف وصلاحياته بنجاح.' });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * AR: حظر أو حظر ناعم للموظف (تعطيل الحساب)
 */
router.delete('/admin/users/:id', requireAuth, requirePermission('manage:users'), async (req, res) => {
  const userId = req.params.id;
  const context = {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // تعطيل الحساب لحفظ سجل الرقابة
    await run("UPDATE users SET status = 'inactive', updated_at = ? WHERE id = ?", [Date.now(), userId]);

    // فرض إغلاق كافة الجلسات النشطة للموظف
    const authService = require('../services/authService');
    await authService.revokeAllUserSessions(userId);

    await logAction({
      userId: req.user.sub,
      userName: req.user.name,
      ...context,
      action: 'deactivate-user',
      resource: 'users',
      resourceId: userId,
      status: 'success',
      details: `تعطيل وحظر حساب الموظف وفرض تسجيل الخروج لكافة أجهزته: ${user.email}`,
      beforeState: { id: userId, status: user.status },
      afterState: { id: userId, status: 'inactive' }
    });

    return res.json({ success: true, message: 'تم حظر وتعطيل حساب الموظف بالكامل بنجاح.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate user' });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * AR: تصفير كلمة مرور موظف ووضع كلمة مرور مؤقتة عشوائية
 */
router.post('/admin/users/:id/reset-password', requireAuth, requirePermission('manage:users'), async (req, res) => {
  const userId = req.params.id;
  const context = {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  try {
    const user = await get('SELECT email, name FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // توليد كلمة مرور عشوائية قوية تلبي سياسة الـ 12 حرفاً
    const tempPassword = 'MaisTemp@' + crypto.randomBytes(4).toString('hex') + '9!';
    
    const authService = require('../services/authService');
    await authService.changePassword(userId, tempPassword);

    await logAction({
      userId: req.user.sub,
      userName: req.user.name,
      ...context,
      action: 'reset-password-admin',
      resource: 'users',
      resourceId: userId,
      status: 'success',
      details: `تم تصفير كلمة مرور موظف ووضع كلمة مؤقتة: ${user.email}`
    });

    return res.json({
      success: true,
      message: 'تم تصفير كلمة المرور للموظف بنجاح.',
      tempPassword
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to reset password' });
  }
});

/**
 * GET /api/admin/users/:id/audit
 * AR: جلب سجل أنشطة وتدقيق موظف معين
 */
router.get('/admin/users/:id/audit', requireAuth, requirePermission('view:audit'), async (req, res) => {
  const userId = req.params.id;
  try {
    const logs = await getAuditLogs({ userId }, 50, 0);
    return res.json({ success: true, data: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user audit trail' });
  }
});

/**
 * GET /api/admin/audit-log
 * AR: جلب السجل التدقيق العام للنظام مع الفلاتر والبحث
 */
router.get('/admin/audit-log', requireAuth, requirePermission('view:audit'), async (req, res) => {
  const { userId, action, status, search, limit, offset } = req.query;
  const filters = { userId, action, status, search };

  try {
    const logs = await getAuditLogs(filters, Number(limit) || 100, Number(offset) || 0);
    return res.json({ success: true, data: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch system audit logs' });
  }
});

/**
 * GET /api/admin/roles
 * AR: جلب كافة رتب وأدوار النظام وصلاحياتها
 */
router.get('/admin/roles', requireAuth, requirePermission('manage:users'), async (req, res) => {
  try {
    const roles = await all('SELECT * FROM roles ORDER BY created_at ASC');
    return res.json({ success: true, data: roles });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
});

module.exports = router;
