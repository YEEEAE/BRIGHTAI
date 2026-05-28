const crypto = require('crypto');
const { run, get, all } = require('../config/database');

/**
 * AR: تسجيل عملية مراجعة وتدقيق في قاعدة البيانات
 * EN: Log audit action to SQLite database
 */
async function logAction(options) {
  const {
    userId = null,
    userName = null,
    ipAddress = '127.0.0.1',
    userAgent = 'System',
    action,
    resource,
    resourceId = null,
    status = 'success',
    details = '',
    beforeState = null,
    afterState = null
  } = options;

  const id = 'aud_' + crypto.randomUUID();
  const timestamp = Date.now();

  const beforeStateStr = beforeState ? JSON.stringify(beforeState) : null;
  const afterStateStr = afterState ? JSON.stringify(afterState) : null;

  try {
    await run(
      `INSERT INTO audit_logs (id, timestamp, user_id, user_name, ip_address, user_agent, action, resource, resource_id, status, details, before_state, after_state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        timestamp,
        userId,
        userName,
        ipAddress,
        userAgent,
        action,
        resource,
        resourceId,
        status,
        details,
        beforeStateStr,
        afterStateStr
      ]
    );
  } catch (err) {
    console.error('❌ Failed to write to audit log:', err.message);
  }
}

/**
 * AR: جلب سجلات التدقيق والمراجعة مع الفلترة
 * EN: Get filtered audit logs for admin review
 */
async function getAuditLogs(filters = {}, limit = 100, offset = 0) {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (filters.userId) {
    query += ' AND user_id = ?';
    params.push(filters.userId);
  }
  if (filters.action) {
    query += ' AND action = ?';
    params.push(filters.action);
  }
  if (filters.resource) {
    query += ' AND resource = ?';
    params.push(filters.resource);
  }
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.search) {
    query += ' AND (user_name LIKE ? OR details LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return all(query, params);
}

module.exports = {
  logAction,
  getAuditLogs
};
