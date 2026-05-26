function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') return sanitizeObject(value);
  if (typeof value === 'string') return value.replace(/[<>]/g, '');
  return value;
}

function sanitizeObject(input) {
  const clean = {};
  Object.keys(input || {}).forEach((key) => {
    // AR: منع مفاتيح Mongo/NoSQL الخطرة مثل $where و user.name.
    // EN: Block dangerous Mongo/NoSQL operator keys such as $where and user.name.
    if (key.startsWith('$') || key.includes('.')) return;
    clean[key] = sanitizeValue(input[key]);
  });
  return clean;
}

function sanitizeRequest(req, res, next) {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
}

module.exports = { sanitizeRequest, sanitizeObject };
