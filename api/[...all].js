const { EventEmitter } = require('events');
const { handleRequest } = require('../backend/server');

function toRawBody(event) {
  if (!event || !event.body) return '';
  if (event.isBase64Encoded) {
    try {
      return Buffer.from(event.body, 'base64').toString('utf8');
    } catch (_error) {
      return '';
    }
  }
  return String(event.body);
}

function toRequestUrl(event) {
  const path = event?.path || '/';
  const rawQuery = event?.rawQuery ? String(event.rawQuery) : '';
  return rawQuery ? `${path}?${rawQuery}` : path;
}

exports.handler = async (event) => {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = event?.httpMethod || 'GET';
    req.url = toRequestUrl(event);
    req.headers = event?.headers || {};
    req.socket = {
      remoteAddress: req.headers['x-forwarded-for'] || '127.0.0.1'
    };
    req.connection = req.socket;

    const statusAndHeaders = {
      statusCode: 200,
      headers: {}
    };
    let done = false;

    const res = {
      headersSent: false,
      writeHead(code, headers = {}) {
        statusAndHeaders.statusCode = Number(code) || 200;
        statusAndHeaders.headers = { ...statusAndHeaders.headers, ...headers };
        this.headersSent = true;
      },
      setHeader(name, value) {
        statusAndHeaders.headers[name] = value;
      },
      end(payload = '') {
        if (done) return;
        done = true;
        const body = Buffer.isBuffer(payload)
          ? payload.toString('utf8')
          : String(payload || '');
        resolve({
          statusCode: statusAndHeaders.statusCode,
          headers: statusAndHeaders.headers,
          body
        });
      }
    };

    handleRequest(req, res).catch(() => {
      if (done) return;
      done = true;
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'خطأ داخلي' })
      });
    });

    process.nextTick(() => {
      const method = String(req.method || '').toUpperCase();
      const hasBody = event && Object.prototype.hasOwnProperty.call(event, 'body') && event.body != null;
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || !hasBody) {
        req.emit('end');
        return;
      }
      const rawBody = toRawBody(event);
      if (rawBody) {
        req.emit('data', Buffer.from(rawBody));
      }
      req.emit('end');
    });
  });
};
