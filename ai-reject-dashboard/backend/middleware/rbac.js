const { hasPermission, hasRole } = require('../services/rbacService');
const { logAction } = require('../services/auditService');

function getAuditContext(req) {
  return {
    userId: req.user && req.user.sub,
    userName: req.user && req.user.name,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };
}

function hasSuperAdminRole(user) {
  const roles = Array.isArray(user.roles) ? user.roles : [];
  return roles.includes('Super yazeed QC') || user.role === 'Super yazeed QC';
}

/**
 * AR: وسيط التحقق من صلاحية معينة
 * EN: Middleware to enforce a specific permission
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      // المشرف الفائق يمر دائماً
      if (hasSuperAdminRole(req.user)) {
        await logAction({
          ...getAuditContext(req),
          action: 'permission-check',
          resource: 'permissions',
          resourceId: permission,
          status: 'success',
          details: `تم السماح بالصلاحية عبر دور المشرف الفائق: ${permission}`
        });
        return next();
      }

      const permitted = await hasPermission(req.user.sub, permission);
      if (!permitted) {
        await logAction({
          ...getAuditContext(req),
          action: 'permission-check',
          resource: 'permissions',
          resourceId: permission,
          status: 'failure',
          details: `رفض الوصول بسبب عدم امتلاك الصلاحية: ${permission}`
        });
        return res.status(403).json({ 
          success: false, 
          message: 'Permission denied. You do not hold the required access rights.' 
        });
      }

      await logAction({
        ...getAuditContext(req),
        action: 'permission-check',
        resource: 'permissions',
        resourceId: permission,
        status: 'success',
        details: `تم السماح بالصلاحية: ${permission}`
      });
      return next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
}

/**
 * AR: وسيط التحقق من رتبة ودور معين
 * EN: Middleware to enforce a specific role
 */
function requireRole(role) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      if (hasSuperAdminRole(req.user)) {
        await logAction({
          ...getAuditContext(req),
          action: 'role-check',
          resource: 'roles',
          resourceId: role,
          status: 'success',
          details: `تم السماح بالدور عبر المشرف الفائق: ${role}`
        });
        return next();
      }

      const isAuthorized = await hasRole(req.user.sub, role);
      if (!isAuthorized) {
        await logAction({
          ...getAuditContext(req),
          action: 'role-check',
          resource: 'roles',
          resourceId: role,
          status: 'failure',
          details: `رفض الوصول بسبب عدم امتلاك الدور: ${role}`
        });
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Exclusive role required.' 
        });
      }

      await logAction({
        ...getAuditContext(req),
        action: 'role-check',
        resource: 'roles',
        resourceId: role,
        status: 'success',
        details: `تم السماح بالدور: ${role}`
      });
      return next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
}

module.exports = {
  requirePermission,
  requireRole
};
