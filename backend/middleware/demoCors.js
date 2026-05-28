const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://brightai.site',
  'https://www.brightai.site'
]);

function demoCors(req, res, next) {
  const origin = req.headers.origin;
  if (origin && DEFAULT_ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Demo-Client, X-Request-Id');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
}

module.exports = {
  demoCors,
  DEFAULT_ALLOWED_ORIGINS
};
