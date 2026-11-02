import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const hostGrotesk = await readFile(join(root, 'fonts', 'host-grotesk-latin.woff2'))
const fragmentMono = await readFile(join(root, 'fonts', 'fragment-mono-latin.woff2'))
let source = await readFile(join(root, 'src', 'client.template.js'), 'utf8')

source = source
  .replaceAll('__HOST_GROTESK_WOFF2__', hostGrotesk.toString('base64'))
  .replaceAll('__FRAGMENT_MONO_WOFF2__', fragmentMono.toString('base64'))

await writeFile(join(root, 'client.js'), source)
console.log(`Built client.js (${Buffer.byteLength(source)} bytes)`)
