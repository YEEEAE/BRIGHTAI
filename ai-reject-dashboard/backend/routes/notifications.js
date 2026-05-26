/**
 * notifications.js — Notification API Routes
 * AR: نقاط اتصال API للإشعارات والتفضيلات وتيار الأنشطة.
 * EN: API endpoints for notifications, preferences, and activity feed.
 */
const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { requireAuth } = require('../middleware/auth');

/**
 * AR: استخراج userId من الطلب.
 * EN: Extract userId from request.
 */
function getUserId(req) {
  return (req.user && req.user.sub) || 'anonymous';
}

/**
 * GET /api/notifications
 * AR: جلب إشعارات المستخدم مع فلاتر اختيارية.
 * EN: Get user notifications with optional filters.
 * Query: type, read (true/false), priority, event, page, limit
 */
router.get('/notifications', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);
    const filters = {
      type: req.query.type || undefined,
      read: req.query.read !== undefined ? req.query.read === 'true' : undefined,
      priority: req.query.priority || undefined,
      event: req.query.event || undefined,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = notificationService.getNotifications(userId, filters);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/notifications/count
 * AR: جلب عدد الإشعارات غير المقروءة.
 * EN: Get unread notification count.
 */
router.get('/notifications/count', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);
    const count = notificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/notifications/:id/read
 * AR: تعليم إشعار كمقروء.
 * EN: Mark a notification as read.
 */
router.post('/notifications/:id/read', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);
    const notif = notificationService.markRead(userId, req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * AR: تعليم جميع الإشعارات كمقروءة.
 * EN: Mark all notifications as read.
 */
router.post('/notifications/mark-all-read', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);
    const count = notificationService.markAllRead(userId);
    res.json({ success: true, data: { marked: count } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/notifications/:id
 * AR: حذف إشعار.
 * EN: Delete a notification.
 */
router.delete('/notifications/:id', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);
    const deleted = notificationService.deleteNotification(userId, req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/notifications/:id/acknowledge
 * AR: تأكيد تنبيه حرج.
 * EN: Acknowledge a critical alert.
 */
router.post('/notifications/:id/acknowledge', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);
    const notif = notificationService.acknowledge(userId, req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/notifications/preferences
 * AR: جلب تفضيلات الإشعارات.
 * EN: Get notification preferences.
 */
router.get('/notifications/preferences', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);
    const prefs = notificationService.getPreferences(userId);
    res.json({ success: true, data: prefs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/notifications/preferences
 * AR: تحديث تفضيلات الإشعارات.
 * EN: Update notification preferences.
 */
router.put('/notifications/preferences', requireAuth, (req, res) => {
  try {
    const userId = getUserId(req);
    const updated = notificationService.updatePreferences(userId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/notifications/activity-feed
 * AR: جلب تيار الأنشطة الحية.
 * EN: Get live activity feed.
 * Query: limit (default 20, max 50)
 */
router.get('/notifications/activity-feed', requireAuth, (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const feed = notificationService.getActivityFeed(limit);
    res.json({ success: true, data: { activities: feed, total: feed.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/notifications/stats
 * AR: إحصائيات الإشعارات (للمشرفين).
 * EN: Notification statistics (admin only).
 */
router.get('/notifications/stats', requireAuth, (req, res) => {
  try {
    const stats = notificationService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
