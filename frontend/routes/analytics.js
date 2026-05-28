const { config, isGa4MpConfigured } = require('../config');

const ALLOWED_EVENTS = new Set(['purchase', 'qualify_lead', 'close_convert_lead']);
const MAX_STRING_LENGTH = 150;

function randomClientId() {
  const a = Math.floor(Math.random() * 1_000_000_000);
  const b = Math.floor(Date.now() / 1000);
  return `${a}.${b}`;
}

function sanitizeString(value, maxLength = MAX_STRING_LENGTH) {
  if (value === undefined || value === null) return undefined;
  return String(value).trim().slice(0, maxLength);
}

function sanitizePrimitive(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  return undefined;
}

function sanitizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return undefined;
  const cleaned = rawItems
    .slice(0, 30)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const result = {};
      Object.keys(item).forEach((key) => {
        const value = sanitizePrimitive(item[key]);
        if (value !== undefined) result[key] = value;
      });
      return Object.keys(result).length > 0 ? result : null;
    })
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : undefined;
}

function sanitizeParams(params) {
  const input = params && typeof params === 'object' ? params : {};
  const cleaned = {};

  Object.keys(input).forEach((key) => {
    if (key === 'items') return;
    const safeKey = sanitizeString(key, 40);
    if (!safeKey) return;
    const value = sanitizePrimitive(input[key]);
    if (value !== undefined) cleaned[safeKey] = value;
  });

  const items = sanitizeItems(input.items);
  if (items) cleaned.items = items;

  return cleaned;
}

function getClientId(body) {
  const candidate = sanitizeString(body.clientId || body.client_id);
  if (!candidate) return randomClientId();
  return candidate;
}

function getUserId(body) {
  return sanitizeString(body.userId || body.user_id, 80);
}

function getEventName(body) {
  const name = sanitizeString(body.eventName || body.event_name, 50);
  return name ? name.toLowerCase() : '';
}

function toGa4Endpoint() {
  const base = config.analytics.mpDebug
    ? 'https://www.google-analytics.com/debug/mp/collect'
    : 'https://www.google-analytics.com/mp/collect';
  const query = new URLSearchParams({
    measurement_id: config.analytics.ga4MeasurementId,
    api_secret: config.analytics.ga4ApiSecret
  });
  return `${base}?${query.toString()}`;
}

function isAuthorized(req) {
  const expectedKey = config.analytics.webhookKey;
  if (!expectedKey) return true;
  const provided = req.headers['x-brightai-analytics-key'];
  return typeof provided === 'string' && provided === expectedKey;
}

async function ga4ConversionHandler(req, res) {
  if (!isGa4MpConfigured()) {
    return res.status(503).json({
      error: 'GA4 Measurement Protocol is not configured',
      errorCode: 'GA4_MP_NOT_CONFIGURED'
    });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({
      error: 'Unauthorized analytics webhook call',
      errorCode: 'UNAUTHORIZED_ANALYTICS'
    });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const eventName = getEventName(body);

  if (!ALLOWED_EVENTS.has(eventName)) {
    return res.status(400).json({
      error: 'Unsupported event name',
      errorCode: 'INVALID_EVENT_NAME',
      allowedEvents: Array.from(ALLOWED_EVENTS)
    });
  }

  const clientId = getClientId(body);
  const userId = getUserId(body);
  const rawParams = sanitizeParams(body.params);
  const params = {
    ...rawParams,
    event_source: 'backend_conversion_api',
    value: rawParams.value,
    currency: rawParams.currency || 'SAR'
  };

  const payload = {
    client_id: clientId,
    events: [
      {
        name: eventName,
        params
      }
    ]
  };

  if (userId) payload.user_id = userId;

  try {
    const endpoint = toGa4Endpoint();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let responseBody = null;
    try {
      responseBody = await response.json();
    } catch (error) {
      // Non-JSON response from GA endpoint is acceptable in non-debug mode
    }

    if (!response.ok) {
      return res.status(502).json({
        error: 'Failed to forward event to GA4',
        errorCode: 'GA4_MP_FORWARD_FAILED',
        status: response.status
      });
    }

    const validationMessages = responseBody && Array.isArray(responseBody.validationMessages)
      ? responseBody.validationMessages
      : [];

    return res.status(200).json({
      success: true,
      eventName,
      forwarded: true,
      validationMessages
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Analytics forwarding failed',
      errorCode: 'GA4_MP_REQUEST_ERROR'
    });
  }
}

module.exports = {
  ga4ConversionHandler
};
