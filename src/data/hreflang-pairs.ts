/**
 * hreflang-pairs.ts — Explicit bidirectional hreflang pair map for BrightAI.
 *
 * BAI-SEO-003-S2 (2026-07-18): replaces the implicit `/en/` string-derivation
 * in SEOHead.astro with an explicit, auditable pair map. Every indexable URL
 * has exactly one entry here. For each URL we declare, in one place:
 *   - the ar-SA URL (self when the page is Arabic)
 *   - the en-SA URL (only when a real English counterpart page exists)
 *   - the x-default URL (always present; mirrors the Arabic self for AR-only
 *     pages, or the Arabic counterpart for EN-only pages)
 *
 * Rules enforced by this map (per S2 acceptance criteria):
 *   - No en-SA is ever emitted for a page whose English counterpart does not
 *     exist as a real, 200-returning route.
 *   - x-default is always present and points to the Arabic URL (the canonical
 *     site language) for AR-only pages, or to the Arabic counterpart for an
 *     EN page.
 *   - canonical === self hreflang URL, literally.
 *
 * The map is the single source of truth consumed by:
 *   - src/components/SEOHead.astro (renders <head> alternates)
 *   - scripts/generate-sitemap-all-pages.mjs (renders sitemap alternates)
 *   - scripts/seo-ci-check.mjs (seo:gate acceptance)
 *   - scripts/hreflang-bidirectional-audit.mjs (S2 automated test)
 *
 * To add a new bilingual pair, add ONE entry here — do NOT edit SEOHead logic
 * or hand-write alternates in a page.
 */

import { SITE, type HreflangLink } from './site.ts';

export interface HreflangPair {
  /** Absolute Arabic URL (self for AR pages). */
  ar: string;
  /** Absolute English URL — present ONLY when a real /en/ counterpart exists. */
  en?: string;
  /** Absolute x-default URL. Always present. */
  xDefault: string;
}

const BASE = SITE.url.replace(/\/$/, '');

function url(path: string): string {
  return `${BASE}${path}`;
}

/**
 * EXPLICIT_HREFLANG_PAIRS — keyed by the canonical URL of every indexable page.
 *
 * Only the 7 real bilingual pairs are listed with an `en` field:
 *   - homepage (/ ↔ /en/)
 *   - 5 legal pairs (privacy-policy, cookie-policy, terms, pdpl-statement,
 *     data-processing-agreement)
 *   - sales-deck (/sales-deck/ ↔ /en/sales-deck/)
 *
 * `/privacy-cookies/` is AR-only. BAI-SEO-003-S1 (2026-07-18) removed its
 * bogus en-SA entry because /en/privacy-cookies/ has no real, built page.
 * Per the S1 spec: "لا تضف hreflang لصفحة peer غير موجودة فعليًا" — never
 * emit a hreflang link to a peer that does not 200. Adding the EN peer
 * page is tracked separately (out of scope for the metadata sweep).
 *
 * Every other page is AR-only and resolves to { ar, xDefault: ar } via
 * getHreflangPair() below (no en-SA emitted).
 */
export const EXPLICIT_HREFLANG_PAIRS: ReadonlyMap<string, HreflangPair> = new Map(
  [
    // Homepage — bilingual anchor
    { key: url('/'), pair: { ar: url('/'), en: url('/en/'), xDefault: url('/') } },

    // Legal pairs (AR ↔ EN)
    { key: url('/privacy-policy/'), pair: { ar: url('/privacy-policy/'), en: url('/en/privacy-policy/'), xDefault: url('/privacy-policy/') } },
    { key: url('/cookie-policy/'), pair: { ar: url('/cookie-policy/'), en: url('/en/cookie-policy/'), xDefault: url('/cookie-policy/') } },
    { key: url('/terms/'), pair: { ar: url('/terms/'), en: url('/en/terms/'), xDefault: url('/terms/') } },
    { key: url('/pdpl-statement/'), pair: { ar: url('/pdpl-statement/'), en: url('/en/pdpl-statement/'), xDefault: url('/pdpl-statement/') } },
    { key: url('/data-processing-agreement/'), pair: { ar: url('/data-processing-agreement/'), en: url('/en/data-processing-agreement/'), xDefault: url('/data-processing-agreement/') } },

    // Sales deck — bilingual anchor
    { key: url('/sales-deck/'), pair: { ar: url('/sales-deck/'), en: url('/en/sales-deck/'), xDefault: url('/sales-deck/') } },
  ].map(({ key, pair }) => [key, pair] as const),
);

/**
 * Normalize a canonical URL to the map key form (strip trailing slash except
 * for root, lowercase host, keep path as-is).
 */
function toKey(canonical: string): string {
  try {
    const parsed = new URL(canonical);
    const path = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/+$/, '') + '/';
    return `${parsed.origin}${path}`;
  } catch {
    return canonical;
  }
}

/**
 * getHreflangPair — returns the explicit pair for a canonical URL, or a
 * synthetic AR-only pair ({ ar, xDefault: ar }) when the URL is not in the
 * explicit map. Never invents an en-SA counterpart.
 */
export function getHreflangPair(canonical: string): HreflangPair {
  const key = toKey(canonical);
  const explicit = EXPLICIT_HREFLANG_PAIRS.get(key);
  if (explicit) return explicit;
  // AR-only default: self-reference + x-default pointing to self.
  return { ar: canonical, xDefault: canonical };
}

/**
 * getHreflangLinks — returns the ordered HreflangLink[] for a canonical URL.
 * Order: ar-SA, en-SA (if present), x-default. Self-reference is guaranteed
 * because ar-SA === canonical for AR pages and en-SA === canonical for EN pages.
 */
export function getHreflangLinks(canonical: string): HreflangLink[] {
  const pair = getHreflangPair(canonical);
  const links: HreflangLink[] = [{ lang: 'ar-SA', href: pair.ar }];
  if (pair.en) links.push({ lang: 'en-SA', href: pair.en });
  links.push({ lang: 'x-default', href: pair.xDefault });
  return links;
}

/**
 * isExplicitBilingualPair — true when the canonical URL has a real en-SA peer.
 */
export function isExplicitBilingualPair(canonical: string): boolean {
  const pair = EXPLICIT_HREFLANG_PAIRS.get(toKey(canonical));
  return Boolean(pair?.en);
}
