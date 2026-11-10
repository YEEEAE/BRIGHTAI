import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// Records what this build was produced from, next to the server entry point.
// The file is read back by /healthz, so a running process can prove the commit
// and dependency set it was built from instead of trusting a deploy label.
// Non-secret by design: commit, build time, Node version, lockfile digest.
const COMMIT = /^[a-f0-9]{40}$/;

function commitFrom(value) {
  const normalized = (value ?? '').trim().toLowerCase();
  return COMMIT.test(normalized) ? normalized : null;
}

// Render provides RENDER_GIT_COMMIT for git-triggered builds; CI can pass
// AIGAS_RELEASE_SHA explicitly. A local build falls back to the checkout, and a
// missing git binary must not fail the build.
function resolveCommit() {
  for (const candidate of [process.env.AIGAS_RELEASE_SHA, process.env.RENDER_GIT_COMMIT]) {
    const commit = commitFrom(candidate);
    if (commit) return commit;
  }
  try {
    return commitFrom(execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }));
  } catch {
    return null;
  }
}

// The lockfile is the reproducible part of `npm ci`; pinning its digest ties the
// artifact to the exact dependency tree that produced it.
function lockfileDigest() {
  try {
    const raw = readFileSync(new URL('../package-lock.json', import.meta.url));
    return `sha256:${createHash('sha256').update(raw).digest('hex')}`;
  } catch {
    return null;
  }
}

export default function buildVersion() {
  let serverDir;
  return {
    name: 'brightai-build-version',
    hooks: {
      // `astro:build:done` hands the client directory; the server bundle path is
      // the resolved config value, so version.json lands next to entry.mjs.
      'astro:config:done': ({ config }) => { serverDir = config.build.server; },
      'astro:build:done': ({ logger }) => {
        const info = {
          schema: 1,
          commit: resolveCommit(),
          builtAt: new Date().toISOString(),
          node: process.version,
          packageLock: lockfileDigest(),
        };
        writeFileSync(new URL('version.json', serverDir), `${JSON.stringify(info, null, 2)}\n`);
        logger.info(`version.json: ${info.commit ? info.commit.slice(0, 12) : 'commit unknown'}`);
      },
    },
  };
}
