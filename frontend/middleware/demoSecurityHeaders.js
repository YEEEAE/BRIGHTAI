function demoSecurityHeaders(_req, res, next) {
  res.setHeader('Content-Language', 'ar-SA');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Robots-Tag', 'noindex');
  return next();
}

module.exports = {
  demoSecurityHeaders
};
