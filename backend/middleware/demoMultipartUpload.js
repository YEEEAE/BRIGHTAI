const { createHttpError } = require('../utils/httpErrors');
const { sanitizeObject, sanitizeText } = require('../utils/inputSanitizer');
const { isSupportedDemoType } = require('../services/demoPromptRegistry');
const { assertSafeDemoInput } = require('../services/demoSafetyFilter');

const MAX_DEMO_FILE_BYTES = Number(process.env.DEMO_FILE_MAX_BYTES) || 8 * 1024 * 1024;
const ALLOWED_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const ALLOWED_MEDICAL_ARCHIVE_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain'
]);

function parseContentDisposition(value = '') {
  const result = {};
  for (const part of String(value).split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    const key = rawKey?.trim();
    if (!key) continue;
    result[key] = rawValue.join('=').trim().replace(/^"|"$/g, '');
  }
  return result;
}

function splitMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const chunks = [];
  let start = buffer.indexOf(delimiter);
  while (start !== -1) {
    const next = buffer.indexOf(delimiter, start + delimiter.length);
    if (next === -1) break;
    let chunk = buffer.subarray(start + delimiter.length, next);
    if (chunk.subarray(0, 2).toString() === '\r\n') chunk = chunk.subarray(2);
    if (chunk.subarray(-2).toString() === '\r\n') chunk = chunk.subarray(0, -2);
    if (chunk.length && chunk.toString('utf8', 0, 2) !== '--') chunks.push(chunk);
    start = next;
  }
  return chunks;
}

function parseMultipartBuffer(buffer, boundary) {
  const fields = {};
  let file = null;
  for (const chunk of splitMultipart(buffer, boundary)) {
    const headerEnd = chunk.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;
    const headerText = chunk.subarray(0, headerEnd).toString('utf8');
    const body = chunk.subarray(headerEnd + 4);
    const headers = Object.fromEntries(
      headerText.split('\r\n').map(line => {
        const index = line.indexOf(':');
        if (index === -1) return null;
        return [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()];
      }).filter(Boolean)
    );
    const disposition = parseContentDisposition(headers['content-disposition']);
    if (!disposition.name) continue;
    if (disposition.filename) {
      file = {
        fieldName: disposition.name,
        filename: sanitizeText(disposition.filename, 160),
        mimeType: sanitizeText(headers['content-type'], 120),
        buffer: body
      };
    } else {
      fields[disposition.name] = body.toString('utf8').trim();
    }
  }
  return { fields, file };
}

function readRequestBuffer(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(createHttpError('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function parseDemoMultipartUpload(req, _res, next) {
  try {
    const contentType = String(req.headers['content-type'] || '');
    const boundary = contentType.match(/boundary=([^;]+)/i)?.[1];
    if (!contentType.includes('multipart/form-data') || !boundary) {
      return next(createHttpError('VALIDATION_ERROR'));
    }

    const raw = await readRequestBuffer(req, MAX_DEMO_FILE_BYTES + 64 * 1024);
    const { fields, file } = parseMultipartBuffer(raw, boundary);
    const demoType = sanitizeText(fields.demoType, 80);
    if (!isSupportedDemoType(demoType)) return next(createHttpError('UNSUPPORTED_DEMO_TYPE'));
    if (!['smart-hiring-system', 'smart-medical-archive'].includes(demoType)) return next(createHttpError('UNSUPPORTED_DEMO_TYPE'));
    if (!file || !file.buffer?.length) return next(createHttpError('VALIDATION_ERROR'));
    if (file.buffer.length > MAX_DEMO_FILE_BYTES) return next(createHttpError('PAYLOAD_TOO_LARGE'));
    const allowedMimeTypes = demoType === 'smart-medical-archive' ? ALLOWED_MEDICAL_ARCHIVE_MIME_TYPES : ALLOWED_FILE_MIME_TYPES;
    if (!allowedMimeTypes.has(file.mimeType)) {
      return next(createHttpError('VALIDATION_ERROR', {
        userMessage: 'صيغة الملف غير مدعومة. ارفع صورة أو PDF أو DOCX أو TXT فقط.'
      }));
    }

    let inputSource = {};
    try {
      inputSource = JSON.parse(fields.input || '{}');
    } catch {
      return next(createHttpError('VALIDATION_ERROR'));
    }
    const input = sanitizeObject(inputSource);
    input.scenarioId = sanitizeText(input.scenarioId, 120);
    input.message = sanitizeText(input.message || '', 3000);
    input.locale = sanitizeText(input.locale, 8);
    if (!input.scenarioId || !/^[A-Za-z0-9-]+$/.test(input.scenarioId) || !['ar-SA', 'en-SA'].includes(input.locale)) {
      return next(createHttpError('VALIDATION_ERROR'));
    }

    req.demoRequest = {
      demoType,
      input,
      file: {
        filename: file.filename,
        mimeType: file.mimeType,
        base64: file.buffer.toString('base64'),
        size: file.buffer.length
      },
      safety: assertSafeDemoInput(demoType, input)
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  ALLOWED_FILE_MIME_TYPES,
  ALLOWED_MEDICAL_ARCHIVE_MIME_TYPES,
  MAX_DEMO_FILE_BYTES,
  parseDemoMultipartUpload
};
