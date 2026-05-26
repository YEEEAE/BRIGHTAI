/**
 * Documentation:
 * - docs/02-data/realtime-updates.md
 * - docs/06-testing/excel-update-test.md
 */
const chokidar = require('chokidar');
const fs = require('fs');
const config = require('../config/env');
const { getRejects, invalidateCache, getDataState } = require('../services/dataService');
const { loadExcelData, getDataHash, recordChange } = require('../services/excelService');
const { invalidateAiCache } = require('../services/aiService');
const { logger } = require('../utils/logger');

let notificationService = null;
function getNotificationService() {
  if (!notificationService) {
    try { notificationService = require('../services/notificationService'); } catch (e) { /* silent */ }
  }
  return notificationService;
}

function makeCompositeKey(r) {
  const code = String(r.item_code || '').trim();
  const batch = String(r.batch_number || '').trim();
  const mfg = String(r.manufacturing_date || '').trim();
  const exp = String(r.expiry_date || '').trim();
  return `${code}||${batch}||${mfg}||${exp}`;
}

function diffRecordCounts(oldRecords, newRecords) {
  const oldKeys = new Set(oldRecords.map(r => makeCompositeKey(r)));
  const newKeys = new Set(newRecords.map(r => makeCompositeKey(r)));

  let added = 0;
  let removed = 0;
  let changed = 0;

  newKeys.forEach(key => {
    if (!oldKeys.has(key)) {
      added++;
    } else {
      const oldRec = oldRecords.find(r => makeCompositeKey(r) === key);
      const newRec = newRecords.find(r => makeCompositeKey(r) === key);
      if (oldRec && newRec && JSON.stringify(oldRec) !== JSON.stringify(newRec)) {
        changed++;
      }
    }
  });

  oldKeys.forEach(key => {
    if (!newKeys.has(key)) {
      removed++;
    }
  });

  return { added, changed, removed };
}

function startExcelWatcher(io) {
  let debounceTimer = null;
  let lastHash = getDataHash(config.excelFilePath);
  let previousRecordCount = 0;
  let previousRecords = [];
  
  // تعبئة اللقطة الافتتاحية للمخزون فور تشغيل الخدمة
  (async () => {
    try {
      const excelPayload = await loadExcelData({ force: false });
      const newRecords = await getRejects('excel');
      previousRecordCount = excelPayload.records.length;
      previousRecords = newRecords.slice();
      logger.info('excel_watcher_initial_snapshot_loaded', { record_count: previousRecordCount });
    } catch (err) {
      logger.warn('excel_watcher_initial_snapshot_failed', { message: err.message });
    }
  })();

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
      const newRecords = await getRejects('excel');
      const state = getDataState();

      const fileModifiedAt = fs.existsSync(config.excelFilePath)
        ? fs.statSync(config.excelFilePath).mtime.toISOString()
        : new Date().toISOString();

      const diff = previousRecords.length
        ? diffRecordCounts(previousRecords, newRecords)
        : { added: newRecords.length, changed: 0, removed: 0 };

      const change = {
        event: 'data:updated',
        source: 'excel',
        old_hash: lastHash,
        new_hash: newHash || excelPayload.hash,
        record_count: excelPayload.records.length,
        sheet_count: excelPayload.sheet_names.length,
        file_size: excelPayload.file_size,
        added: diff.added,
        changed: diff.changed,
        removed: diff.removed,
        timestamp: new Date().toISOString()
      };

      lastHash = newHash || excelPayload.hash;
      recordChange(change);
      logger.info('excel_data_updated', change);

      if (io) {
        io.emit('data:updated', {
          old_hash: change.old_hash,
          new_hash: change.new_hash,
          record_count: change.record_count,
          added_count: diff.added,
          removed_count: diff.removed,
          changed_count: diff.changed,
          file_modified_at: fileModifiedAt,
          sheet_count: excelPayload.sheet_names.length,
          metrics: excelPayload.metrics,
          status: state.excel
        });
      }

      /* Always update the snapshot so diffs remain correct even when
         notificationService is unavailable. */
      previousRecordCount = excelPayload.records.length;
      previousRecords = newRecords.slice();

      const ns = getNotificationService();
      if (ns) {
        ns.create({
          event: 'data:updated',
          type: 'success',
          priority: 'medium',
          title: 'تم تحديث بيانات Excel',
          message: `تم اكتشاف ${diff.added} سجل جديد، ${diff.changed} معدّل، ${diff.removed} محذوف`,
          target: 'broadcast',
          metadata: {
            record_count: excelPayload.records.length,
            sheet_count: excelPayload.sheet_names.length,
            added: diff.added,
            changed: diff.changed,
            removed: diff.removed,
            file_size: excelPayload.file_size
          }
        });

        if (diff.added > 0 && previousRecordCount > 0) {
          ns.create({
            event: 'stock:new',
            type: 'warning',
            priority: diff.added >= 5 ? 'high' : 'medium',
            title: `${diff.added} سجل مخزون جديد`,
            message: `تم اكتشاف ${diff.added} سجل جديد في آخر تحديث لبيانات المخزون. يرجى المراجعة.`,
            target: 'broadcast',
            metadata: { added: diff.added, changed: diff.changed, removed: diff.removed }
          });
        }
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

  if (!config.excelFilePath || !fs.existsSync(config.excelFilePath)) {
    logger.warn('excel_watcher_skipped', { reason: 'Excel file path not set or file not found', path: config.excelFilePath });
    return null;
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
