const { logAction } = require('../services/auditService');

/**
 * AR: وسيط للتسجيل التلقائي لعمليات تصدير وتعديل البيانات الحساسة
 * EN: Middleware to automatically log exports and sensitive mutations
 */
function logActivity(action, resource) {
  return async (req, res, next) => {
    // AR: التقاط البيانات بعد معالجة الطلب للتأكد من نجاح العملية
    // EN: Intercept response to verify success status
    const originalJson = res.json;
    
    res.json = function (data) {
      res.json = originalJson;
      
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      
      // تشغيل التسجيل في الخلفية لتفادي تأخير استجابة المستخدم
      setTimeout(async () => {
        try {
          const userId = req.user ? req.user.sub : null;
          const userName = req.user ? req.user.name : 'Guest';
          const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          const userAgent = req.headers['user-agent'] || 'Unknown';

          await logAction({
            userId,
            userName,
            ipAddress,
            userAgent,
            action: action || req.method.toLowerCase(),
            resource: resource || req.baseUrl.replace('/api/', ''),
            status: isSuccess ? 'success' : 'failure',
            details: `العملية: ${req.method} على المسار ${req.originalUrl}. الاستجابة: ${res.statusCode}`
          });
        } catch (err) {
          console.error('❌ Failed to auto-log activity:', err.message);
        }
      }, 0);

      return originalJson.call(this, data);
    };

    next();
  };
}

module.exports = {
  logActivity
};
