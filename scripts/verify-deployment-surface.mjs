#!/usr/bin/env node
/**
 * Verifies the standalone Astro artifact exposes only its intended HTTP surface.
 *
 * Starts dist/server/entry.mjs on a loopback-only dedicated port, then checks
 * the root route and deployment-artifact paths that must never be public.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const entry = path.join(root, 'dist', 'server', 'entry.mjs');
const port = 4317;
const baseUrl = `http://127.0.0.1:${port}`;
const checks = [
  ['/', 200],
  ['/client/index.html', 404],
  ['/frontend/server.js', 404],
];

if (!existsSync(entry)) {
  console.error('[verify-deployment-surface] dist/server/entry.mjs is missing. Run pnpm build first.');
  process.exit(1);
}

const child = spawn(process.execPath, [entry], {
  cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: 'ignore',
});

function stopServer() {
  if (!child.killed) child.kill('SIGTERM');
}

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`, { method: 'HEAD' });
      if (response.status > 0) return;
    } catch {
      // The process may still be binding its listener.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('standalone server did not become ready within 10 seconds');
}

try {
  await waitForServer();
  for (const [route, expectedStatus] of checks) {
    const response = await fetch(`${baseUrl}${route}`, { method: 'HEAD', redirect: 'manual' });
    if (response.status !== expectedStatus) {
      throw new Error(`${route} returned ${response.status}; expected ${expectedStatus}`);
    }
    console.log(`[verify-deployment-surface] ${route} -> ${response.status}`);
  }
} catch (error) {
  console.error(`[verify-deployment-surface] ${error.message}`);
  process.exitCode = 1;
} finally {
  stopServer();
}
