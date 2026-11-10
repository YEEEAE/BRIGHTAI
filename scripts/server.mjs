import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { publicRedirect } from '../src/server/seo/redirects.mjs';

// The standalone adapter serves /page/index.html from disk before Astro
// middleware. Apply only the explicit public redirect table before that handler.
const previousAutostart = process.env.ASTRO_NODE_AUTOSTART;
process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler, options } = await import('../dist/server/entry.mjs');
if (previousAutostart === undefined) delete process.env.ASTRO_NODE_AUTOSTART;
else process.env.ASTRO_NODE_AUTOSTART = previousAutostart;

const listener = (request, response) => {
  let url;
  try {
    // Keep the request target as a path, including double leading slashes.
    const target = request.url ?? '/';
    url = new URL(`http://localhost${target.startsWith('/') ? target : `/${target}`}`);
    decodeURI(url.pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request.');
    return;
  }
  const destination = ['GET', 'HEAD'].includes(request.method) && publicRedirect(url.pathname);
  if (destination) {
    response.writeHead(301, { Location: destination + url.search, 'X-Content-Type-Options': 'nosniff' });
    response.end();
    return;
  }
  handler(request, response);
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
server.listen(port, host, () => console.log(`BRIGHTAI listening on ${host ?? 'localhost'}:${port}`));
server.on('error', error => { console.error(error); process.exitCode = 1; });
