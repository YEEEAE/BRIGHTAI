import manifest from '../../../redirects.json' with { type: 'json' };

const destinations = new Map(manifest.redirects.map(({ source, destination }) => [source, destination]));

export function publicRedirect(pathname) {
  let decoded = pathname;
  try { decoded = decodeURIComponent(pathname); } catch { return undefined; }
  return destinations.get(pathname) ?? destinations.get(decoded) ?? destinations.get(decoded.replace(/\/$/, ''));
}

export function publicRedirectForRequest(method, pathname, search = '', normalizedPath = pathname) {
  if (!['GET', 'HEAD'].includes(method)) return undefined;
  const destination = publicRedirect(pathname) ?? publicRedirect(normalizedPath);
  return destination ? { status: 301, location: `${destination}${search}` } : undefined;
}
