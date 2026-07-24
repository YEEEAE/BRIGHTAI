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
 * BAI-SEO-003-S3 (2026-07-25): the map is now BIDIRECTIONALLY KEYED. Each
 * bilingual pair is registered under TWO keys (the AR URL AND the EN URL)
 * both pointing to the same HreflangPair, so getHreflangPair() can resolve
 * a pair whether the canonical is the AR or the EN side. Before this fix,
 * EN canonicals missed the lookup, fell through to the synthetic AR-only
 * default, and emitted only ar-SA=self + x-default=self — breaking
 * reciprocity and dropping the en-SA self-reference. See audit run output
 * at scripts/hreflang-bidirectional-audit.mjs for the regression fixture
 * (checkEnPageContract) that guards against this shape.
 *
 * Rules enforced by this map (per S2 + S3 acceptance criteria):
 *   - No en-SA is ever emitted for a page whose English counterpart does not
 *     exist as a real, 200-returning route.
 *   - x-default is always present and points to the Arabic URL (the canonical
 *     site language) for AR-only pages, or to the Arabic counterpart for an
 *     EN page.
 *   - canonical === self hreflang URL, literally.
 *   - Every bilingual pair is keyed by BOTH the AR URL and the EN URL.
 *
 * The map is the single source of truth consumed by:
 *   - src/components/SEOHead.astro (renders <head> alternates)
 *   - scripts/generate-sitemap-all-pages.mjs (renders sitemap alternates)
 *   - scripts/seo-ci-check.mjs (seo:gate acceptance)
 *   - scripts/hreflang-bidirectional-audit.mjs (S2 + S3 automated tests)
 *
 * To add a new bilingual pair, add ONE entry to HREFLANG_PAIRS_LIST — do
 * NOT edit SEOHead logic or hand-write alternates in a page. The map is
 * rebuilt bidirectionally by makeBidirectionalEntries() below, so a single
 * entry automatically produces both keys.
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
 * EXPLICIT_HREFLANG_PAIRS — BIDIRECTIONALLY KEYED (BAI-SEO-003-S3, 2026-07-25).
 *
 * Each bilingual pair in HREFLANG_PAIRS_LIST is registered under TWO keys
 * (the AR URL AND the EN URL) both pointing to the same HreflangPair. This
 * makes the map bidirectional:
 *   - getHreflangPair(url('/'))         → full pair (ar + en + xDefault)
 *   - getHreflangPair(url('/en/'))      → same full pair (ar + en + xDefault)
 *
 * Before this fix, the map was keyed only by the AR URL. The audit caught
 * 7 EN pages (the homepage, 5 legal pages, and the sales deck) emitting
 * only ar-SA=self + x-default=self because the EN canonical missed the
 * lookup and fell through to the synthetic AR-only default. The S3
 * regression fixture in scripts/hreflang-bidirectional-audit.mjs
 * (checkEnPageContract) re-asserts the EN page contract on every audit run.
 *
 * The 7 real bilingual pairs:
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
 * getHreflangPair() below (no en-SA emitted — no invented English peer).
 */
function makeBidirectionalEntries(
  pairs: readonly HreflangPair[],
): Array<[string, HreflangPair]> {
  const out: Array<[string, HreflangPair]> = [];
  for (const pair of pairs) {
    out.push([pair.ar, pair]);
    if (pair.en) out.push([pair.en, pair]);
  }
  return out;
}

const HREFLANG_PAIRS_LIST: readonly HreflangPair[] = [
  // Homepage — bilingual anchor
  { ar: url('/'), en: url('/en/'), xDefault: url('/') },

  // Legal pairs (AR ↔ EN)
  { ar: url('/privacy-policy/'), en: url('/en/privacy-policy/'), xDefault: url('/privacy-policy/') },
  { ar: url('/cookie-policy/'), en: url('/en/cookie-policy/'), xDefault: url('/cookie-policy/') },
  { ar: url('/terms/'), en: url('/en/terms/'), xDefault: url('/terms/') },
  { ar: url('/pdpl-statement/'), en: url('/en/pdpl-statement/'), xDefault: url('/pdpl-statement/') },
  { ar: url('/data-processing-agreement/'), en: url('/en/data-processing-agreement/'), xDefault: url('/data-processing-agreement/') },

  // Sales deck — bilingual anchor
  { ar: url('/sales-deck/'), en: url('/en/sales-deck/'), xDefault: url('/sales-deck/') },
];

export const EXPLICIT_HREFLANG_PAIRS: ReadonlyMap<string, HreflangPair> = new Map(
  makeBidirectionalEntries(HREFLANG_PAIRS_LIST),
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
 * The self-reference language is chosen by matching `canonical` against the
 * pair's ar/en URLs (not by a fixed order), so:
 *   - AR page (canonical === pair.ar): ar-SA=self, en-SA=counterpart, x-default=self
 *   - EN page (canonical === pair.en): en-SA=self, ar-SA=counterpart, x-default=counterpart
 *   - AR-only page (not in map): ar-SA=self, x-default=self (no en-SA invented)
 * Self-reference is guaranteed because the self lang always points to `canonical`.
 */
export function getHreflangLinks(canonical: string): HreflangLink[] {
  const pair = getHreflangPair(canonical);
  const links: HreflangLink[] = [];

  if (canonical === pair.ar) {
    // Arabic self page.
    links.push({ lang: 'ar-SA', href: pair.ar });
    if (pair.en) links.push({ lang: 'en-SA', href: pair.en });
    links.push({ lang: 'x-default', href: pair.xDefault });
  } else if (pair.en && canonical === pair.en) {
    // English self page — ar-SA is the return counterpart.
    links.push({ lang: 'en-SA', href: pair.en });
    links.push({ lang: 'ar-SA', href: pair.ar });
    links.push({ lang: 'x-default', href: pair.xDefault });
  } else {
    // AR-only page (not in explicit map, or canonical matches neither side).
    links.push({ lang: 'ar-SA', href: pair.ar });
    links.push({ lang: 'x-default', href: pair.xDefault });
  }

  return links;
}

/**
 * isExplicitBilingualPair — true when the canonical URL has a real en-SA peer.
 */
export function isExplicitBilingualPair(canonical: string): boolean {
  const pair = EXPLICIT_HREFLANG_PAIRS.get(toKey(canonical));
  return Boolean(pair?.en);
}
