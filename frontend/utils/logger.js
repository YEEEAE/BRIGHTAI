const crypto = require('crypto');

function hashInput(value) {
  const source = typeof value === 'string' ? value : JSON.stringify(value || {});
  return crypto.createHash('sha256').update(source).digest('hex').slice(0, 24);
}

function hashInputPreview(value) {
  const source = typeof value === 'string' ? value : JSON.stringify(value || {});
  return crypto.createHash('sha256').update(source.slice(0, 16)).digest('hex');
}

function logDemoEvent(event, meta = {}) {
  const safeMeta = { ...meta };
  delete safeMeta.message;
  delete safeMeta.rawInput;
  delete safeMeta.email;
  delete safeMeta.phone;
  delete safeMeta.id;
  delete safeMeta.nationalId;
  console.info(`[demo] ${event}`, safeMeta);
}

function logDemoError(event, error, meta = {}) {
  console.error(`[demo] ${event}`, {
    ...meta,
    code: error?.code || 'INTERNAL_ERROR',
    statusCode: error?.statusCode || 500
  });
}

module.exports = {
  hashInput,
  hashInputPreview,
  logDemoEvent,
  logDemoError
};
