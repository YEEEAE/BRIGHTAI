const { hasPermission, hasRole } = require('../services/rbacService');

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
      if (req.user.role === 'Super yazeed QC') {
        return next();
      }

      const permitted = await hasPermission(req.user.sub, permission);
      if (!permitted) {
        return res.status(403).json({ 
          success: false, 
          message: 'Permission denied. You do not hold the required access rights.' 
        });
      }

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
      if (req.user.role === 'Super yazeed QC') {
        return next();
      }

      const isAuthorized = await hasRole(req.user.sub, role);
      if (!isAuthorized) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Exclusive role required.' 
        });
      }

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
