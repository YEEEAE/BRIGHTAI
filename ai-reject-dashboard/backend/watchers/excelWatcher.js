const chokidar = require('chokidar');
const config = require('../config/env');
const { getRejects, invalidateCache, getDataState } = require('../services/dataService');
const { loadExcelData, getDataHash, recordChange } = require('../services/excelService');
const { invalidateAiCache } = require('../services/aiService');
const { logger } = require('../utils/logger');

// AR: محرك الإشعارات — يُستورد بشكل كسول لتجنب الاعتماد الدائري.
// EN: Notification engine — lazy-loaded to avoid circular dependency.
let notificationService = null;
function getNotificationService() {
  if (!notificationService) {
    try { notificationService = require('../services/notificationService'); } catch (e) { /* silent */ }
  }
  return notificationService;
}

function startExcelWatcher(io) {
  let debounceTimer = null;
  let lastHash = getDataHash(config.excelFilePath);
  let previousRecordCount = 0;

  async function handleExcelChange(eventName) {
    try {
      const newHash = getDataHash(config.excelFilePath);
      if (newHash && newHash === lastHash) {
        logger.info('excel_change_ignored_same_hash', { eventName, hash: newHash });
        return;
      }

      invalidateCache(`excel ${eventName}`);
      invalidateAiCache(`excel ${eventName}`);
      const excelPayload = await loadExcelData({ force: true });
      await getRejects('excel');
      const state = getDataState();
      const change = {
        event: 'data:updated',
        source: 'excel',
        old_hash: lastHash,
        new_hash: newHash || excelPayload.hash,
        record_count: excelPayload.records.length,
        sheet_count: excelPayload.sheet_names.length,
        file_size: excelPayload.file_size,
        timestamp: new Date().toISOString()
      };

      lastHash = newHash || excelPayload.hash;
      recordChange(change);
      logger.info('excel_data_updated', change);

      if (io) {
        io.emit('data:updated', {
          ...change,
          metrics: excelPayload.metrics,
          status: state.excel
        });
      }

      // AR: إنشاء إشعار تحديث البيانات عبر محرك الإشعارات.
      // EN: Create data update notification via notification engine.
      const ns = getNotificationService();
      if (ns) {
        const newRecords = excelPayload.records.length - previousRecordCount;

        ns.create({
          event: 'data:updated',
          type: 'success',
          priority: 'medium',
          title: 'تم تحديث بيانات Excel',
          message: `تم تحميل ${excelPayload.records.length} سجل من ${excelPayload.sheet_names.length} ورقة عمل.${newRecords > 0 ? ' (' + newRecords + ' سجل جديد)' : ''}`,
          target: 'broadcast',
          metadata: {
            record_count: excelPayload.records.length,
            sheet_count: excelPayload.sheet_names.length,
            new_records: newRecords > 0 ? newRecords : 0,
            file_size: excelPayload.file_size
          }
        });

        // AR: إنشاء إشعارات للمرفوضات الجديدة إذا زاد العدد.
        // EN: Create notifications for new rejects if count increased.
        if (newRecords > 0 && previousRecordCount > 0) {
          ns.create({
            event: 'reject:new',
            type: 'warning',
            priority: newRecords >= 5 ? 'high' : 'medium',
            title: `${newRecords} مرفوض جديد`,
            message: `تم اكتشاف ${newRecords} حالة رفض جديدة في آخر تحديث للبيانات. يرجى المراجعة.`,
            target: 'broadcast',
            metadata: { new_count: newRecords }
          });
        }

        previousRecordCount = excelPayload.records.length;
      }
    } catch (err) {
      logger.error('excel_watcher_reload_failed', {
        eventName,
        message: err.message,
        code: err.code
      });
      if (io) {
        io.emit('data:update_failed', {
          source: 'excel',
          message: 'Excel reload failed. Last valid cache remains active.',
          timestamp: new Date().toISOString()
        });
      }

      // AR: إشعار فشل التحديث.
      // EN: Notify about update failure.
      const ns = getNotificationService();
      if (ns) {
        ns.create({
          event: 'alert:critical',
          type: 'critical',
          priority: 'critical',
          title: 'فشل تحديث بيانات Excel',
          message: `فشل تحميل ملف Excel: ${err.message}. يتم استخدام آخر نسخة صالحة من البيانات.`,
          target: 'broadcast',
          persistent: true,
          metadata: { error: err.message, event_name: eventName }
        });
      }
    }
  }

  function debounce(eventName) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleExcelChange(eventName);
    }, 1500);
  }

  const watcher = chokidar.watch(config.excelFilePath, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 250
    }
  });

  watcher.on('change', () => debounce('change'));
  watcher.on('add', () => debounce('add'));
  watcher.on('unlink', () => debounce('unlink'));

  watcher.on('error', (error) => logger.warn('excel_watcher_error', { message: error.message }));
  logger.info('excel_watcher_started', { path: config.excelFilePath });
  return watcher;
}

module.exports = { startExcelWatcher };

