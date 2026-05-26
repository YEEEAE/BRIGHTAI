const chokidar = require('chokidar');
const config = require('../config/env');
const { getRejects, invalidateCache, getDataState } = require('../services/dataService');
const { loadExcelData, getDataHash, recordChange } = require('../services/excelService');
const { logger } = require('../utils/logger');

function startExcelWatcher(io) {
  let debounceTimer = null;
  let lastHash = getDataHash(config.excelFilePath);

  async function handleExcelChange(eventName) {
    try {
      const newHash = getDataHash(config.excelFilePath);
      if (newHash && newHash === lastHash) {
        logger.info('excel_change_ignored_same_hash', { eventName, hash: newHash });
        return;
      }

      invalidateCache(`excel ${eventName}`);
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
