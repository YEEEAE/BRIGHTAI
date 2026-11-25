import { isApiSurface, normalizePath, resolveRoute } from '../src/server/api/routes.mjs';
import { apiBoundary } from '../src/server/api/boundary.mjs';
import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { applySecurityPolicy } from '../src/server/observability/security-policy.mjs';
import { publicRedirectForRequest } from '../src/server/seo/redirects.mjs';
import { liveResponse } from '../src/server/kernel/liveness.mjs';
import { probeResponse } from '../src/server/kernel/probe-response.mjs';
import { readyResponse, failureReport } from '../src/server/kernel/health-endpoint.mjs';

// The standalone adapter serves /page/index.html from disk before Astro
// middleware. Apply only the explicit public redirect table before that handler.
const previousAutostart = process.env.ASTRO_NODE_AUTOSTART;
process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler, options } = await import('../dist/server/entry.mjs');
if (previousAutostart === undefined) delete process.env.ASTRO_NODE_AUTOSTART;
else process.env.ASTRO_NODE_AUTOSTART = previousAutostart;

// CVE-2026-102984 (@astrojs/node <= 11.1.2): the adapter builds the request URL
// from the Host header and throws `TypeError: Invalid URL` for a malformed port
// (for example `example.com:65536`), answering 500 before any route runs. Reject
// a Host that is not a single hostname[:port] with a valid port. The upstream fix
// is @astrojs/node >= 11.1.3; see docs/DEPENDENCY-SECURITY-2026-11-10.md.
const HOST_HEADER = /^(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9._-]+)(?::(\d{1,5}))?$/;

function hostHeaderIsWellFormed(value) {
  if (typeof value !== 'string') return false;
  const match = HOST_HEADER.exec(value);
  if (match === null) return false;
  return match[2] === undefined || Number(match[2]) <= 65535;
}

const badRequest = response => {
  response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  response.end('Bad request.');
};

// GHSA-r557-wffq-wvrc (@astrojs/node >= 8.1.0 < 11.0.2): the trailing-slash
// redirect echoes the request path, so a raw backslash reaches the client as
// `Location: /\evil.example/x/`, which a browser resolves protocol-relative to
// `//evil.example/x/`. No valid path contains a raw backslash; reject it.
const hasUnsafeRequestPath = target => (target.split('?')[0] ?? '').includes('\\');

const listener = (request, response) => {
  if (!hostHeaderIsWellFormed(request.headers.host) || hasUnsafeRequestPath(request.url ?? '/')) {
    badRequest(response);
    return;
  }
  let url;
  try {
    // Keep the request target as a path, including double leading slashes.
    const target = request.url ?? '/';
    url = new URL(`http://localhost${target.startsWith('/') ? target : `/${target}`}`);
    decodeURI(url.pathname);
  } catch {
    badRequest(response);
    return;
  }
  // Prerendered HTML bypasses Astro middleware. Apply the same runtime policy
  // before the adapter writes headers, including redirects and error responses.
  const security = new Headers();
  const privateSurface = /^\/+(?:app|auth)(?:\/|$)/.test(decodeURI(url.pathname));
  const forwardedProto = request.headers['x-forwarded-proto']?.split(',')[0]?.trim();
  applySecurityPolicy(security, privateSurface, {
    secureTransport: Boolean(request.socket.encrypted || forwardedProto === 'https'),
    confidential: /^\/+app\/secure-chat(?:\/|$)/.test(decodeURI(url.pathname)),
  });
  for (const [name, value] of security) response.setHeader(name, value);
  // The adapter serves prerendered 404.html as a normal file on explicit access.
  // Serve that artifact with its real status, including the directory-style URL.
  if (['/404', '/404/', '/404.html'].includes(url.pathname) && ['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, follow' });
    response.end(request.method === 'HEAD' ? undefined : readFileSync(new URL('../dist/client/404.html', import.meta.url)));
    return;
  }
  const redirect = publicRedirectForRequest(request.method, url.pathname, url.search);
  if (redirect) {
    response.writeHead(redirect.status, { Location: redirect.location, 'X-Content-Type-Options': 'nosniff' });
    response.end();
    return;
  }
  const apiPath = normalizePath(url.pathname);
  if (isApiSurface(apiPath) && !resolveRoute(apiPath)) {
    apiBoundary({ url: url.href, method: request.method }, apiPath, () => {
      throw new Error('Unregistered API route');
    }).then(async result => {
      const body = await result.text();
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(body);
    }).catch(() => response.destroy());
    return;
  }
  // Bypass Astro's canonical redirect for both spellings of each probe.
  if (/^\/(?:healthz|readyz)\/?$/.test(url.pathname)) {
    const method = request.method;
    const probe = url.pathname.startsWith('/healthz') ? liveResponse : readyResponse;
    const send = async result => {
      const body = await result.text();
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(body);
    };
    const boundaryRequest = { url: url.href, method };
    apiBoundary(boundaryRequest, url.pathname, async () => {
      try { return await probe(method); }
      catch { return probeResponse(method, 503, failureReport('HEALTH_RESPONSE_FAILED')); }
    }).then(send).catch(() => response.destroy());
    return;
  }
  // A rejected render must not become an unhandled rejection: that terminates
  // the process (CWE-248) instead of failing this one request.
  const handled = handler(request, response);
  if (handled && typeof handled.then === 'function') {
    handled.catch(() => {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
      response.end('Internal Error.');
    });
  }
};

const server = process.env.SERVER_CERT_PATH && process.env.SERVER_KEY_PATH
  ? httpsServer({ key: readFileSync(process.env.SERVER_KEY_PATH), cert: readFileSync(process.env.SERVER_CERT_PATH) }, listener)
  : httpServer(listener);
const port = Number(process.env.PORT ?? options.port ?? 8080);
// A hosting container reaches the process over its network interface, so the
// default must be all interfaces: binding loopback makes the platform report
// "no open ports" while the process looks healthy in its own logs.
// HOST=127.0.0.1 opts back in to loopback for local-only use.
const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, () => console.log(`BRIGHTAI listening on ${host}:${server.address().port}`));
server.on('error', error => { console.error(error); process.exitCode = 1; });
