const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const { logger } = require('../utils/logger');
const { emitGlobal, emitToRole } = require('./socketService');

// File paths
const NOTIF_DIR = path.join(config.projectRoot, 'data', 'notifications');
const NOTIF_FILE = path.join(NOTIF_DIR, 'notifications.json');
const PREFS_FILE = path.join(NOTIF_DIR, 'preferences.json');

// Ensure directory exists
fs.mkdirSync(NOTIF_DIR, { recursive: true });

// Load notifications list persistently
function getNotifications() {
  try {
    if (!fs.existsSync(NOTIF_FILE)) return getMockInitialNotifications();
    return JSON.parse(fs.readFileSync(NOTIF_FILE, 'utf8'));
  } catch (err) {
    logger.warn('read_notifications_failed', { message: err.message });
    return [];
  }
}

// Save notifications persistently
function saveNotifications(list) {
  try {
    fs.writeFileSync(NOTIF_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    logger.warn('save_notifications_failed', { message: err.message });
  }
}

// Generate some mock notifications if file is missing (to make the UI beautiful at first glance!)
function getMockInitialNotifications() {
  const initial = [
    {
      id: 'notif_mock_1',
      type: 'critical',
      title: '🚨 عيب حرج جداً: ماكينة المكبس 4 تجاوزت الحد المسموح',
      titleEn: '🚨 Critical Defect: Moulding Machine 4 defect threshold exceeded',
      message: 'سجلت ماكينة المكبس 4 نسبة تلف حاد تبلغ 15% خلال الساعة الأخيرة على المادة الخام Resin B. يوصى بجدولة صيانة وقائية فورية.',
      messageEn: 'Moulding Machine 4 defect rate recorded at 15% this hour on batch Resin B. Schedule predictive maintenance immediately.',
      read: false,
      priority: 95,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      link: 'production.html',
      docNo: 'RJT-2026-002'
    },
    {
      id: 'notif_mock_2',
      type: 'warning',
      title: '⏳ إشعار CAPA: اقتراب موعد إغلاق المطابقة للتغذية FEFO',
      titleEn: '⏳ QMS Alert: Overdue CAPA FEFO batch rotation deadline',
      message: 'إجراء التصحيح الوقائي رقم CAPA-2026-04 لتحديث FEFO في المستودع يتبقى له 48 ساعة للإغلاق دون مراجعة مدير تأكيد الجودة QCM.',
      messageEn: 'Preventive CAPA-2026-04 warehouse rotation deadline is approaching in 48 hours. QCM approval required.',
      read: false,
      priority: 70,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      link: 'quality.html'
    },
    {
      id: 'notif_mock_3',
      type: 'success',
      title: '✔️ تم الفهرسة والموافقة التلقائية لسند عدم مطابقة NCR',
      titleEn: '✔️ NCR Document Approved & Auto-locked',
      message: 'سند المرفوضات رقم RJT-2026-001 تم اعتماده بالكامل من المدير المالي وإدارة الجودة، وتم رصد وإغلاق قيد التسوية بنجاح.',
      messageEn: 'Reject voucher RJT-2026-001 approved by CFO and QAM. Transaction is now closed and audit-locked.',
      read: true,
      priority: 50,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yday
      link: 'workflow.html'
    }
  ];
  saveNotifications(initial);
  return initial;
}

// Add a new notification and emit Socket events in real-time
function addNotification(notifData) {
  const list = getNotifications();
  
  const newNotif = {
    id: 'notif_' + Math.random().toString(36).substring(2, 11),
    type: notifData.type || 'info', // info, success, warning, error, critical
    title: notifData.title,
    titleEn: notifData.titleEn || notifData.title,
    message: notifData.message,
    messageEn: notifData.messageEn || notifData.message,
    read: false,
    priority: scorePriority(notifData.type),
    createdAt: new Date().toISOString(),
    link: notifData.link || 'index.html',
    docNo: notifData.docNo || null
  };

  list.unshift(newNotif);
  saveNotifications(list);

  // Emit Socket events dynamically based on the type
  const socketPayload = {
    ...newNotif,
    timestamp: newNotif.createdAt
  };

  // 1. Emit globally
  emitGlobal('notification:new', socketPayload);
  
  // 2. Emit specific event names
  if (newNotif.type === 'critical') {
    emitGlobal('alert:critical', socketPayload);
    emitToRole('QC', 'alert:critical', socketPayload);
  } else if (newNotif.type === 'warning') {
    emitGlobal('capa:overdue', socketPayload);
  } else if (newNotif.type === 'success') {
    emitGlobal('reject:new', socketPayload);
  }

  return newNotif;
}

function scorePriority(type) {
  const priorities = {
    critical: 95,
    error: 80,
    warning: 65,
    success: 45,
    info: 30
  };
  return priorities[type] || 30;
}

// Mark specific notification as read
function markAsRead(id) {
  const list = getNotifications();
  const index = list.findIndex(n => n.id === id);
  if (index !== -1) {
    list[index].read = true;
    saveNotifications(list);
    return true;
  }
  return false;
}

// Mark all notifications as read
function markAllAsRead() {
  const list = getNotifications();
  list.forEach(n => { n.read = true; });
  saveNotifications(list);
  return true;
}

// Delete specific notification
function deleteNotification(id) {
  const list = getNotifications();
  const filtered = list.filter(n => n.id !== id);
  if (filtered.length !== list.length) {
    saveNotifications(filtered);
    return true;
  }
  return false;
}

// Get user preferences settings
function getPreferences(userId) {
  try {
    if (!fs.existsSync(PREFS_FILE)) return getMockDefaultPreferences();
    const allPrefs = JSON.parse(fs.readFileSync(PREFS_FILE, 'utf8'));
    return allPrefs[userId] || getMockDefaultPreferences();
  } catch (e) {
    return getMockDefaultPreferences();
  }
}

// Save preferences
function updatePreferences(userId, prefs) {
  let allPrefs = {};
  try {
    if (fs.existsSync(PREFS_FILE)) {
      allPrefs = JSON.parse(fs.readFileSync(PREFS_FILE, 'utf8'));
    }
  } catch (e) {}

  allPrefs[userId] = {
    ...getMockDefaultPreferences(),
    ...prefs,
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(PREFS_FILE, JSON.stringify(allPrefs, null, 2), 'utf8');
    return allPrefs[userId];
  } catch (err) {
    logger.warn('save_preferences_failed', { message: err.message });
    return getMockDefaultPreferences();
  }
}

function getMockDefaultPreferences() {
  return {
    channels: {
      toast: true,
      banner: true,
      bell: true,
      email: false,
      sms: false,
      browserPush: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '06:00'
    },
    frequency: 'instant', // instant, digest_daily, digest_weekly
    emailDigestEnabled: false
  };
}

module.exports = {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences
};
