import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const plugin = path.resolve(here, '..');
const workspace = path.resolve(plugin, '..', '..');

await build({
  entryPoints: [path.join(plugin, 'src', 'client.js')],
  outfile: path.join(plugin, 'client.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome110', 'safari16.4', 'firefox115'],
  minify: true,
  legalComments: 'inline',
  external: ['react'],
  loader: { '.js': 'jsx' },
  jsxFactory: 'h',
  jsxFragment: 'h',
  nodePaths: [
    path.join(workspace, '.cache', 'landmarks-build', 'node_modules'),
    path.join(workspace, 'node_modules'),
  ],
  banner: {
    js: '/*! Transformer Lab — DeepSeek Harness plugin. Three.js is bundled under the MIT license. */',
  },
});

console.log('Built client.js');
