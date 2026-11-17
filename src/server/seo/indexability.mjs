// Shared sitemap/build policy. HTML robots remains an additional mandatory gate.
export const publicSite = 'https://brightai.live';
export function isPublicIndexPath(pathname) {
  return pathname.startsWith('/') && !/^\/products\/[^/]+\/complaint\/?$/i.test(pathname) && !/^\/(?:app|auth|api|private|demo|healthz|404|README)(?:\/|$)/i.test(pathname);
}
