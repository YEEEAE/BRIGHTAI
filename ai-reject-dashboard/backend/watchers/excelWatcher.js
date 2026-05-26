const chokidar = require('chokidar');
const config = require('../config/env');
const { invalidateCache } = require('../services/dataService');
const { logger } = require('../utils/logger');

function startExcelWatcher(io) {
  const watcher = chokidar.watch(config.excelFilePath, {
    ignoreInitial: true,
    awaitWriteFinish: true
  });

  watcher.on('change', () => {
    // AR: عند تحديث ملف Excel نمسح الكاش ونبلغ الواجهة عبر Socket.IO.
    // EN: On Excel updates, clear cache and notify clients through Socket.IO.
    invalidateCache('excel file changed');
    if (io) io.emit('data:changed', { source: 'excel', timestamp: new Date().toISOString() });
  });

  watcher.on('error', (error) => logger.warn('excel_watcher_error', { message: error.message }));
  return watcher;
}

module.exports = { startExcelWatcher };
