// Shared sitemap/build policy. HTML robots remains an additional mandatory gate.
export const publicSite = 'https://brightai.live';
export function isPublicIndexPath(pathname) {
  if (/^\/(?:docs\/design-system|404\.html)\/?$/i.test(pathname)) return false;
  return pathname.startsWith('/') && !/^\/products\/[^/]+\/complaint\/?$/i.test(pathname) && !/^\/(?:app|auth|api|private|demo|healthz|readyz|request-access|status|404|README)(?:\/|$)/i.test(pathname);
}
