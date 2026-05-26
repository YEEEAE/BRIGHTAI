/**
 * emailService.js — Enterprise Email Service via Nodemailer
 * AR: خدمة البريد الإلكتروني المؤسسية مع قوالب RTL احترافية.
 * EN: Enterprise email service with professional RTL HTML templates.
 */
const nodemailer = require('nodemailer');
const config = require('../config/env');
const { logger } = require('../utils/logger');

let transporter = null;

/**
 * AR: تهيئة الناقل (Transporter) من إعدادات SMTP.
 * EN: Initialize the SMTP transporter from env config.
 */
function initTransporter() {
  if (!config.smtpHost || !config.smtpUser) {
    logger.info('email_service_disabled', { reason: 'SMTP not configured' });
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    },
    tls: { rejectUnauthorized: config.isProduction }
  });

  logger.info('email_service_initialized', { host: config.smtpHost, port: config.smtpPort });
  return transporter;
}

/**
 * AR: قالب HTML الأساسي للبريد (RTL + داكن/فاتح).
 * EN: Base HTML email template with RTL support.
 */
function baseTemplate(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0; padding: 0;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background-color: #f0f4f8; color: #1a1a2e;
      direction: rtl; text-align: right;
    }
    .email-wrapper {
      max-width: 600px; margin: 24px auto;
      background: #ffffff; border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(135deg, #0F4C81 0%, #00A6A6 100%);
      padding: 24px 32px; color: #ffffff;
    }
    .email-header h1 {
      margin: 0; font-size: 20px; font-weight: 700;
    }
    .email-header p {
      margin: 8px 0 0; font-size: 13px; opacity: 0.85;
    }
    .email-body { padding: 32px; line-height: 1.8; }
    .email-footer {
      background: #f8fafc; padding: 16px 32px;
      font-size: 12px; color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .alert-box {
      padding: 16px 20px; border-radius: 8px; margin: 16px 0;
      border-inline-start: 4px solid;
    }
    .alert-critical { background: #fef2f2; border-color: #E76F51; color: #991b1b; }
    .alert-warning { background: #fffbeb; border-color: #E9C46A; color: #92400e; }
    .alert-info { background: #eff6ff; border-color: #0F4C81; color: #1e40af; }
    .alert-success { background: #f0fdf4; border-color: #2A9D8F; color: #166534; }
    .metric-card {
      display: inline-block; width: 45%; margin: 8px 2%;
      padding: 16px; background: #f8fafc; border-radius: 8px;
      text-align: center; vertical-align: top;
    }
    .metric-value { font-size: 24px; font-weight: 700; color: #0F4C81; }
    .metric-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .btn {
      display: inline-block; padding: 10px 24px;
      background: #0F4C81; color: #ffffff; text-decoration: none;
      border-radius: 8px; font-weight: 600; font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <h1>🏥 BrightAI — MAIS Medical</h1>
      <p>${title}</p>
    </div>
    <div class="email-body">${bodyContent}</div>
    <div class="email-footer">
      <p>هذا البريد مُرسل تلقائياً من نظام إدارة المرفوضات الذكي — BrightAI Dashboard</p>
      <p>© ${new Date().getFullYear()} MAIS for Medical Products. جميع الحقوق محفوظة.</p>
      <p style="color:#94a3b8;font-size:11px;">تنبيه: هذا النظام استشاري فقط ولا يحل محل قرارات ضمان الجودة الرسمية.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * AR: إرسال بريد تنبيه حرج.
 * EN: Send a critical alert email.
 */
async function sendCriticalAlert(to, notification) {
  if (!transporter) return { sent: false, reason: 'SMTP not configured' };

  const body = `
    <div class="alert-box alert-critical">
      <strong>⚠️ تنبيه حرج يتطلب اهتماماً فورياً</strong>
    </div>
    <h2 style="color:#E76F51;margin-top:16px;">${notification.title || 'تنبيه حرج'}</h2>
    <p>${notification.message || ''}</p>
    ${notification.details ? `<div class="alert-box alert-info"><strong>التفاصيل:</strong><br>${notification.details}</div>` : ''}
    <p style="margin-top:24px;">
      <a href="${config.dashboardUrl || 'http://localhost:' + config.port}/pages/index.html" class="btn">فتح لوحة القيادة</a>
    </p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px;">وقت التنبيه: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}</p>
  `;

  try {
    const result = await transporter.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to,
      subject: `⚠️ [حرج] ${notification.title || 'تنبيه من نظام BrightAI'}`,
      html: baseTemplate('تنبيه حرج — يتطلب إجراء فوري', body)
    });
    logger.info('email_critical_sent', { to, messageId: result.messageId });
    return { sent: true, messageId: result.messageId };
  } catch (err) {
    logger.error('email_critical_failed', { to, error: err.message });
    return { sent: false, reason: err.message };
  }
}

/**
 * AR: إرسال ملخص يومي/أسبوعي للإشعارات.
 * EN: Send a daily/weekly notification digest.
 */
async function sendDigest(to, notifications, period) {
  if (!transporter) return { sent: false, reason: 'SMTP not configured' };

  const periodLabel = period === 'daily' ? 'اليومي' : 'الأسبوعي';
  const criticalCount = notifications.filter((n) => n.priority === 'critical').length;
  const warningCount = notifications.filter((n) => n.priority === 'high').length;

  let itemsHTML = notifications.slice(0, 20).map((n) => {
    const typeClass = n.type === 'critical' ? 'alert-critical'
      : n.type === 'warning' ? 'alert-warning'
      : n.type === 'success' ? 'alert-success' : 'alert-info';
    return `<div class="alert-box ${typeClass}" style="margin:8px 0;">
      <strong>${n.title || n.event}</strong><br>
      <span style="font-size:13px;">${n.message || ''}</span>
      <span style="font-size:11px;color:#94a3b8;display:block;margin-top:4px;">${new Date(n.created_at).toLocaleString('ar-SA')}</span>
    </div>`;
  }).join('');

  const body = `
    <h2>📊 ملخص الإشعارات ${periodLabel}</h2>
    <div style="text-align:center;margin:16px 0;">
      <div class="metric-card">
        <div class="metric-value">${notifications.length}</div>
        <div class="metric-label">إجمالي الإشعارات</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" style="color:#E76F51;">${criticalCount}</div>
        <div class="metric-label">حرجة</div>
      </div>
    </div>
    ${criticalCount > 0 ? '<div class="alert-box alert-critical"><strong>⚠️ يوجد ' + criticalCount + ' تنبيه حرج يتطلب مراجعة فورية.</strong></div>' : ''}
    <h3 style="margin-top:24px;">آخر الإشعارات:</h3>
    ${itemsHTML}
    ${notifications.length > 20 ? '<p style="color:#94a3b8;">و ' + (notifications.length - 20) + ' إشعار آخر...</p>' : ''}
    <p style="margin-top:24px;">
      <a href="${config.dashboardUrl || 'http://localhost:' + config.port}/pages/index.html" class="btn">فتح لوحة القيادة</a>
    </p>
  `;

  try {
    const result = await transporter.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to,
      subject: `📊 ملخص BrightAI ${periodLabel} — ${notifications.length} إشعار${criticalCount > 0 ? ' (⚠️ ' + criticalCount + ' حرج)' : ''}`,
      html: baseTemplate(`ملخص الإشعارات ${periodLabel}`, body)
    });
    logger.info('email_digest_sent', { to, period, count: notifications.length, messageId: result.messageId });
    return { sent: true, messageId: result.messageId };
  } catch (err) {
    logger.error('email_digest_failed', { to, period, error: err.message });
    return { sent: false, reason: err.message };
  }
}

/**
 * AR: إرسال إشعار عام بالبريد.
 * EN: Send a general notification email.
 */
async function sendNotification(to, notification) {
  if (!transporter) return { sent: false, reason: 'SMTP not configured' };

  const typeClass = notification.type === 'critical' ? 'alert-critical'
    : notification.type === 'warning' ? 'alert-warning'
    : notification.type === 'success' ? 'alert-success' : 'alert-info';

  const body = `
    <div class="alert-box ${typeClass}">
      <strong>${notification.title || 'إشعار من النظام'}</strong>
    </div>
    <p>${notification.message || ''}</p>
    <p style="margin-top:24px;">
      <a href="${config.dashboardUrl || 'http://localhost:' + config.port}/pages/index.html" class="btn">فتح لوحة القيادة</a>
    </p>
  `;

  try {
    const result = await transporter.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to,
      subject: `${notification.title || 'إشعار من BrightAI'}`,
      html: baseTemplate(notification.title || 'إشعار', body)
    });
    logger.info('email_notification_sent', { to, messageId: result.messageId });
    return { sent: true, messageId: result.messageId };
  } catch (err) {
    logger.error('email_notification_failed', { to, error: err.message });
    return { sent: false, reason: err.message };
  }
}

// AR: تهيئة الناقل عند تحميل الوحدة.
// EN: Initialize transporter on module load.
initTransporter();

module.exports = { sendCriticalAlert, sendDigest, sendNotification, initTransporter };
