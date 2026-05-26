/**
 * notificationService.js — Enterprise Notification Engine
 * AR: محرك الإشعارات المركزي مع تخزين In-Memory، تجميع ذكي، وأولويات متدرجة.
 * EN: Central notification engine with in-memory store, smart bundling, and priority scoring.
 */
const crypto = require('crypto');
const { logger } = require('../utils/logger');

// AR: التخزين الأساسي — Map<userId, Notification[]>.
// EN: Primary store — Map<userId, Notification[]>.
const store = new Map();

// AR: تيار الأنشطة العامة — آخر N نشاط.
// EN: Global activity feed — last N activities.
const activityFeed = [];
const MAX_ACTIVITY_FEED = 50;

// AR: تفضيلات المستخدمين — Map<userId, Preferences>.
// EN: User preferences — Map<userId, Preferences>.
const preferencesStore = new Map();

// AR: الحد الأقصى للإشعارات لكل مستخدم.
// EN: Max notifications per user.
const MAX_PER_USER = 500;

// AR: مدة صلاحية الإشعارات بالمللي ثانية (30 يوم افتراضي).
// EN: Notification TTL in ms (30 days default).
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

// AR: مرجع io — يُمرر عند التهيئة.
// EN: Socket.io instance — set on init.
let ioRef = null;

/**
 * AR: تهيئة المحرك مع مرجع Socket.io.
 * EN: Initialize engine with Socket.io reference.
 */
function init(io) {
  ioRef = io;
  logger.info('notification_service_initialized');

  // AR: تنظيف دوري للإشعارات المنتهية (كل ساعة).
  // EN: Periodic cleanup of expired notifications (every hour).
  setInterval(cleanupExpired, 60 * 60 * 1000);
}

/**
 * AR: توليد معرّف فريد للإشعار.
 * EN: Generate unique notification ID.
 */
function generateId() {
  return 'ntf_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

/**
 * AR: حساب درجة الأولوية الذكية.
 * EN: Calculate smart priority score (0-100).
 */
function calculatePriorityScore(notification) {
  const weights = { critical: 100, high: 75, medium: 50, low: 25 };
  let score = weights[notification.priority] || 50;

  // AR: زيادة الأولوية حسب النوع.
  if (notification.type === 'critical') score = Math.min(100, score + 15);
  if (notification.type === 'error') score = Math.min(100, score + 10);

  // AR: زيادة للأحداث المالية عالية القيمة.
  if (notification.metadata && notification.metadata.cost > 20000) score = Math.min(100, score + 10);

  // AR: زيادة للمرفوضات الجديدة الحرجة.
  if (notification.event === 'reject:new' && notification.priority === 'critical') score = 100;

  return score;
}

/**
 * AR: التحقق من إمكانية تجميع الإشعار مع إشعار موجود.
 * EN: Check if notification can be bundled with an existing one.
 */
function findBundleTarget(userId, notification) {
  const userNotifs = store.get(userId) || [];
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;

  return userNotifs.find((n) =>
    n.event === notification.event &&
    n.type === notification.type &&
    n.created_at > fiveMinAgo &&
    !n.read
  );
}

/**
 * AR: إنشاء إشعار جديد وإرساله فورياً.
 * EN: Create a new notification and emit it in real-time.
 *
 * @param {Object} options
 * @param {string} options.event     — 'data:updated', 'reject:new', 'approval:pending', etc.
 * @param {string} options.type      — 'info', 'success', 'warning', 'error', 'critical'
 * @param {string} options.priority  — 'low', 'medium', 'high', 'critical'
 * @param {string} options.title     — عنوان الإشعار
 * @param {string} options.message   — رسالة الإشعار
 * @param {string} [options.target]  — 'broadcast', 'role:admin', 'user:xxx'
 * @param {Object} [options.metadata]— بيانات إضافية (cost, department, item, etc.)
 * @param {boolean} [options.persistent] — لا يختفي تلقائياً
 * @returns {Object} الإشعار المُنشأ
 */
function create(options) {
  const notification = {
    id: generateId(),
    event: options.event || 'system',
    type: options.type || 'info',
    priority: options.priority || 'medium',
    title: options.title || '',
    message: options.message || '',
    target: options.target || 'broadcast',
    metadata: options.metadata || {},
    persistent: options.persistent || false,
    read: false,
    acknowledged: false,
    priority_score: 0,
    bundle_count: 1,
    created_at: Date.now(),
    expires_at: Date.now() + TTL_MS
  };

  notification.priority_score = calculatePriorityScore(notification);

  // AR: تحديد المستخدمين المستهدفين.
  // EN: Determine target users.
  const targets = resolveTargets(notification.target);

  targets.forEach((userId) => {
    // AR: التحقق من تفضيلات المستخدم (ساعات الهدوء مثلاً).
    if (shouldSuppressForUser(userId, notification)) return;

    // AR: محاولة التجميع.
    const bundleTarget = findBundleTarget(userId, notification);
    if (bundleTarget) {
      bundleTarget.bundle_count += 1;
      bundleTarget.message = `${notification.message} (${bundleTarget.bundle_count} تحديث)`;
      bundleTarget.created_at = Date.now();

      // AR: إرسال التحديث.
      emitToUser(userId, 'notification:updated', bundleTarget);
      return;
    }

    // AR: إضافة الإشعار.
    if (!store.has(userId)) store.set(userId, []);
    const userNotifs = store.get(userId);
    userNotifs.unshift(notification);

    // AR: تقليم القائمة.
    if (userNotifs.length > MAX_PER_USER) {
      userNotifs.splice(MAX_PER_USER);
    }

    // AR: إرسال فوري عبر Socket.io.
    emitToUser(userId, 'notification:new', notification);
  });

  // AR: إضافة لتيار الأنشطة.
  addToActivityFeed(notification);

  // AR: إرسال عبر Socket.io broadcast للنوع الحرج.
  if (notification.type === 'critical' && ioRef) {
    ioRef.to('broadcast').emit('alert:critical', notification);
  }

  logger.info('notification_created', {
    id: notification.id,
    event: notification.event,
    type: notification.type,
    priority: notification.priority,
    target: notification.target,
    targets_count: targets.length
  });

  return notification;
}

/**
 * AR: تحليل الهدف وإرجاع قائمة الـ userIds.
 * EN: Resolve target to list of user IDs.
 */
function resolveTargets(target) {
  if (target === 'broadcast') {
    // AR: جميع المستخدمين المسجلين + 'anonymous' كافتراضي.
    const users = new Set(store.keys());
    users.add('anonymous');
    return Array.from(users);
  }

  if (target.startsWith('user:')) {
    return [target.replace('user:', '')];
  }

  if (target.startsWith('role:')) {
    // AR: في النظام الحالي بدون DB، نرسل لكل من في الـ store.
    const users = new Set(store.keys());
    users.add('anonymous');
    return Array.from(users);
  }

  return ['anonymous'];
}

/**
 * AR: التحقق من وجوب كتم الإشعار لمستخدم معين.
 * EN: Check if notification should be suppressed for a user.
 */
function shouldSuppressForUser(userId, notification) {
  const prefs = preferencesStore.get(userId);
  if (!prefs) return false;

  // AR: ساعات الهدوء.
  if (prefs.quiet_hours && prefs.quiet_hours.enabled) {
    const now = new Date();
    const hour = now.getHours();
    const from = prefs.quiet_hours.from || 22;
    const to = prefs.quiet_hours.to || 7;

    const isQuiet = from > to
      ? (hour >= from || hour < to)
      : (hour >= from && hour < to);

    // AR: التنبيهات الحرجة لا تُكتم أبداً.
    if (isQuiet && notification.priority !== 'critical') return true;
  }

  // AR: التحقق من القنوات المفعّلة.
  if (prefs.channels && prefs.channels.in_app === false && notification.type !== 'critical') {
    return true;
  }

  return false;
}

/**
 * AR: إرسال إشعار لمستخدم عبر Socket.io.
 * EN: Emit notification to a specific user via Socket.io.
 */
function emitToUser(userId, event, data) {
  if (!ioRef) return;
  ioRef.to(`user:${userId}`).emit(event, data);

  // AR: إرسال تحديث عدد غير المقروءة.
  const unreadCount = getUnreadCount(userId);
  ioRef.to(`user:${userId}`).emit('notification:count', { count: unreadCount });
}

/**
 * AR: إضافة نشاط لتيار الأنشطة العامة.
 * EN: Add activity to global activity feed.
 */
function addToActivityFeed(notification) {
  const activity = {
    id: notification.id,
    event: notification.event,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority,
    metadata: notification.metadata,
    created_at: notification.created_at
  };

  activityFeed.unshift(activity);
  if (activityFeed.length > MAX_ACTIVITY_FEED) {
    activityFeed.splice(MAX_ACTIVITY_FEED);
  }

  // AR: بث النشاط للجميع.
  if (ioRef) {
    ioRef.to('broadcast').emit('activity:new', activity);
  }
}

/**
 * AR: جلب إشعارات مستخدم مع فلاتر.
 * EN: Get user notifications with optional filters.
 */
function getNotifications(userId, filters) {
  let notifs = store.get(userId) || [];
  filters = filters || {};

  if (filters.type) notifs = notifs.filter((n) => n.type === filters.type);
  if (filters.read !== undefined) notifs = notifs.filter((n) => n.read === filters.read);
  if (filters.priority) notifs = notifs.filter((n) => n.priority === filters.priority);
  if (filters.event) notifs = notifs.filter((n) => n.event === filters.event);

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));
  const start = (page - 1) * limit;

  return {
    notifications: notifs.slice(start, start + limit),
    total: notifs.length,
    unread: notifs.filter((n) => !n.read).length,
    page,
    limit,
    pages: Math.ceil(notifs.length / limit)
  };
}

/**
 * AR: عدد الإشعارات غير المقروءة.
 * EN: Count of unread notifications.
 */
function getUnreadCount(userId) {
  const notifs = store.get(userId) || [];
  return notifs.filter((n) => !n.read).length;
}

/**
 * AR: تعليم إشعار كمقروء.
 * EN: Mark a notification as read.
 */
function markRead(userId, notificationId) {
  const notifs = store.get(userId) || [];
  const notif = notifs.find((n) => n.id === notificationId);
  if (!notif) return null;
  notif.read = true;
  emitToUser(userId, 'notification:count', { count: getUnreadCount(userId) });
  return notif;
}

/**
 * AR: تعليم جميع الإشعارات كمقروءة.
 * EN: Mark all notifications as read.
 */
function markAllRead(userId) {
  const notifs = store.get(userId) || [];
  let count = 0;
  notifs.forEach((n) => { if (!n.read) { n.read = true; count++; } });
  emitToUser(userId, 'notification:count', { count: 0 });
  return count;
}

/**
 * AR: حذف إشعار.
 * EN: Delete a notification.
 */
function deleteNotification(userId, notificationId) {
  const notifs = store.get(userId) || [];
  const idx = notifs.findIndex((n) => n.id === notificationId);
  if (idx === -1) return false;
  notifs.splice(idx, 1);
  emitToUser(userId, 'notification:count', { count: getUnreadCount(userId) });
  return true;
}

/**
 * AR: تأكيد التنبيه الحرج.
 * EN: Acknowledge a critical alert.
 */
function acknowledge(userId, notificationId) {
  const notifs = store.get(userId) || [];
  const notif = notifs.find((n) => n.id === notificationId);
  if (!notif) return null;
  notif.acknowledged = true;
  notif.read = true;
  notif.acknowledged_at = Date.now();
  return notif;
}

/**
 * AR: جلب تفضيلات المستخدم.
 * EN: Get user preferences.
 */
function getPreferences(userId) {
  return preferencesStore.get(userId) || {
    channels: { in_app: true, email: false, browser_push: false, sms: false },
    quiet_hours: { enabled: false, from: 22, to: 7 },
    digest: { enabled: false, frequency: 'daily' },
    types: {
      'data:updated': true,
      'reject:new': true,
      'approval:pending': true,
      'alert:critical': true,
      'capa:overdue': true,
      'anomaly:detected': true,
      'ai:analysis:ready': true
    }
  };
}

/**
 * AR: تحديث تفضيلات المستخدم.
 * EN: Update user preferences.
 */
function updatePreferences(userId, updates) {
  const current = getPreferences(userId);
  const merged = {
    channels: { ...current.channels, ...(updates.channels || {}) },
    quiet_hours: { ...current.quiet_hours, ...(updates.quiet_hours || {}) },
    digest: { ...current.digest, ...(updates.digest || {}) },
    types: { ...current.types, ...(updates.types || {}) }
  };
  preferencesStore.set(userId, merged);
  return merged;
}

/**
 * AR: جلب تيار الأنشطة.
 * EN: Get activity feed.
 */
function getActivityFeed(limit) {
  return activityFeed.slice(0, Math.min(limit || 20, MAX_ACTIVITY_FEED));
}

/**
 * AR: تنظيف الإشعارات المنتهية الصلاحية.
 * EN: Cleanup expired notifications.
 */
function cleanupExpired() {
  const now = Date.now();
  let cleaned = 0;

  store.forEach((notifs, userId) => {
    const before = notifs.length;
    const filtered = notifs.filter((n) => n.expires_at > now);
    if (filtered.length < before) {
      store.set(userId, filtered);
      cleaned += before - filtered.length;
    }
  });

  if (cleaned > 0) {
    logger.info('notifications_cleanup', { removed: cleaned });
  }
}

/**
 * AR: إحصائيات الإشعارات.
 * EN: Notification statistics.
 */
function getStats() {
  let total = 0;
  let unread = 0;
  const byType = {};

  store.forEach((notifs) => {
    total += notifs.length;
    notifs.forEach((n) => {
      if (!n.read) unread++;
      byType[n.type] = (byType[n.type] || 0) + 1;
    });
  });

  return {
    total,
    unread,
    users: store.size,
    activity_feed_size: activityFeed.length,
    by_type: byType
  };
}

module.exports = {
  init,
  create,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  acknowledge,
  getPreferences,
  updatePreferences,
  getActivityFeed,
  getStats
};
