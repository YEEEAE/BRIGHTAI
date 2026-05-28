const { all, get } = require('../config/database');

/**
 * AR: جلب الأدوار المسندة لمستخدم معين
 * EN: Get roles assigned to a user
 */
async function getUserRoles(userId) {
  const query = `
    SELECT r.id, r.name, r.description 
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `;
  return all(query, [userId]);
}

/**
 * AR: جلب الصلاحيات الإجمالية المسندة لمستخدم معين بناءً على أدواره
 * EN: Get aggregate permissions assigned to a user based on their roles
 */
async function getUserPermissions(userId) {
  const query = `
    SELECT DISTINCT p.name 
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = ?
  `;
  const rows = await all(query, [userId]);
  return rows.map(r => r.name);
}

/**
 * AR: التحقق من امتلاك مستخدم لصلاحية معينة
 * EN: Verify if a user holds a specific permission
 */
async function hasPermission(userId, permissionName) {
  // AR: الحساب الفائق له جميع الصلاحيات تلقائياً
  // EN: Super Admin has all permissions implicitly
  const roles = await getUserRoles(userId);
  if (roles.some(r => r.name === 'Super yazeed QC')) {
    return true;
  }

  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionName);
}

/**
 * AR: التحقق من امتلاك مستخدم لدور معين
 * EN: Verify if a user holds a specific role
 */
async function hasRole(userId, roleName) {
  const roles = await getUserRoles(userId);
  return roles.some(r => r.name === roleName);
}

/**
 * AR: جلب كافة الأدوار المتاحة بالنظام
 * EN: Get all available roles
 */
async function getAllRoles() {
  return all('SELECT * FROM roles ORDER BY created_at ASC');
}

/**
 * AR: جلب كافة الصلاحيات المتاحة بالنظام
 * EN: Get all available permissions
 */
async function getAllPermissions() {
  return all('SELECT * FROM permissions ORDER BY id ASC');
}

module.exports = {
  getUserRoles,
  getUserPermissions,
  hasPermission,
  hasRole,
  getAllRoles,
  getAllPermissions
};
