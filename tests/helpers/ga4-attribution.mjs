import vm from 'node:vm';
import { readFileSync } from 'node:fs';
export const page = 'https://brightai.live/docs/?token=SYNTHETIC_SECRET&utm_source=newsletter&utm_medium=email#SYNTHETIC_SECRET';
export const fixtures = [
  ['google', 'https://www.google.com/search?q=SYNTHETIC_SECRET#SYNTHETIC_SECRET', 'https://www.google.com/'],
  ['google-bare', 'https://google.com/search?q=SYNTHETIC_SECRET', 'https://google.com/'],
  ['bing', 'https://www.bing.com/search?q=SYNTHETIC_SECRET', 'https://www.bing.com/'],
  ['bing-bare', 'https://bing.com/search?q=SYNTHETIC_SECRET', 'https://bing.com/'],
  ['editorial-unapproved', 'https://www.reuters.com/technology/SYNTHETIC_SECRET?email=private@example.test#SYNTHETIC_SECRET', ''],
  ['direct', '', ''],
  ['credentials', 'https://user:SYNTHETIC_SECRET@www.google.com/search', ''],
  ['suffix-attack', 'https://www.google.com.evil.test/SYNTHETIC_SECRET', ''],
  ['subdomain-sensitive', 'https://SYNTHETIC_SECRET.google.com/', ''],
  ['lookalike', 'https://evil-brightai.live/', ''],
  ['script', 'javascript:alert(1)', ''],
  ['local-ip', 'http://127.0.0.1/private', ''],
  ['private-ip', 'https://192.168.1.1/private', ''],
  ['nondefault-port', 'https://www.google.com:8443/private', ''],
  ['relative', '/private', ''],
  ['backslash', 'https://www.google.com\\private', ''],
  ['whitespace', ' https://www.google.com/', ''],
  ['oversized', 'https://www.google.com/' + 'x'.repeat(2048), ''],
  ['internal', 'https://brightai.live/docs/?token=SYNTHETIC_SECRET#SYNTHETIC_SECRET', 'https://brightai.live/docs/'],
  ['internal-private', 'https://brightai.live/auth/callback/SYNTHETIC_SECRET', 'https://brightai.live/auth/'],
];
export function inlineSnippet(source = readFileSync(new URL('../../src/components/GoogleAnalytics.astro', import.meta.url), 'utf8')) {
  return source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
}
export function executeSnippet(inline, href, referrer, repeats = 1) {
  const url = new URL(href);
  const window = { location: { href, origin: url.origin, pathname: url.pathname } };
  const context = vm.createContext({ window, document: { referrer, title: 'Documentation' }, URL, Date });
  for (let i = 0; i < repeats; i++) vm.runInContext(inline, context);
  return JSON.parse(JSON.stringify(window.dataLayer.map(entry => Array.from(entry))));
}
