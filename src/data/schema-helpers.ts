/**
 * Schema Helpers — centralized JSON-LD structured data for BrightAI.
 *
 * Purpose:
 *   Provides reusable Organization, LocalBusiness, FAQ, Breadcrumb, and
 *   HowTo builders so every page emits consistent schema.org types.
 *
 * Constraints (per agent.md + brain.md):
 *   - No fabrication: every field reflects real published content.
 *   - Saudi dialect preserved as-is (see agent.md DEC-007).
 *   - Schema MUST be additive — never delete or replace existing schemas
 *     emitted by individual pages.
 *   - Names, addresses, phone numbers, founder identity are sourced from
 *     `src/data/site.ts` and `report/REPORT-23_SCHEMA-ENHANCEMENT.md`.
 *
 * Usage:
 *   import { ORGANIZATION, getLocalBusinessLd, getBreadcrumbLd, getFaqLd }
 *     from '../data/schema-helpers';
 *   const jsonLd = [...existingSchemas, ORGANIZATION, getBreadcrumbLd([...])];
 */

import { SITE } from './site';

/* ──────────────────────────────────────────────────────────────────
 * 1. ORGANIZATION (enhanced — single @id reused across the site)
 * ────────────────────────────────────────────────────────────────── */

/**
 * The single canonical Organization node for BrightAI.
 * Reuses `@id: https://brightai.site/#organization` so Google can
 * resolve cross-page references (publisher, provider, founder, etc.).
 *
 * Includes: founder, address, contactPoint, sameAs, knowsAbout,
 *           and Saudi market positioning.
 */
/**
 * BAI-SEO-003-S3 (2026-07-18): single source of truth for the BrightAI
 * Organization node. The Schema.astro foundation component imports this
 * constant directly so every page in the site emits the EXACT same
 * Organization @id (https://brightai.site/#organization) with no field drift.
 *
 * IMPORTANT: `sameAs` lists only verifiable social profiles owned by the
 * company. wa.me is a contact channel, not a social identity profile, so it
 * is NOT included. `description` and Saudi-dialect strings are preserved
 * verbatim from the original.
 */
export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://brightai.site/#organization',
  name: SITE.name,
  alternateName: SITE.nameAr,
  legalName: 'BrightAI',
  url: SITE.url,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE.url}${SITE.logo}`,
    width: 400,
    height: 400,
    caption: 'شعار BrightAI',
  },
  description: SITE.descriptionEn,
  foundingDate: '2025',
  founder: {
    '@type': 'Person',
    '@id': 'https://brightai.site/#founder',
    name: 'يزيد البديوي',
    jobTitle: 'المؤسس والمدير التنفيذي',
    worksFor: { '@id': 'https://brightai.site/#organization' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'الرياض',
      addressCountry: 'SA',
    },
    sameAs: ['https://www.linkedin.com/in/yazeed-brightai'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'رويغب الفيحاء',
    addressLocality: 'الرياض',
    addressRegion: 'منطقة الرياض',
    addressCountry: 'SA',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+966538229013',
      contactType: 'customer support',
      contactOption: 'WhatsApp',
      url: SITE.whatsapp.url,
      areaServed: 'SA',
      availableLanguage: ['Arabic', 'English'],
    },
    {
      '@type': 'ContactPoint',
      email: 'yazeed1job@gmail.com',
      contactType: 'technical support',
      areaServed: 'SA',
      availableLanguage: ['Arabic', 'English'],
    },
  ],
  areaServed: [
    { '@type': 'Country', name: 'المملكة العربية السعودية' },
    { '@type': 'City', name: 'الرياض' },
    { '@type': 'City', name: 'جدة' },
    { '@type': 'City', name: 'الدمام' },
    { '@type': 'City', name: 'الخبر' },
    { '@type': 'City', name: 'مكة المكرمة' },
    { '@type': 'City', name: 'المدينة المنورة' },
  ],
  sameAs: SITE.social.official,
  knowsAbout: [
    'الذكاء الاصطناعي',
    'AI Governance',
    'AI Safety',
    'PDPL Compliance',
    'NCA ECC Controls',
    'SDAIA Generative AI Guidelines',
    'ISO/IEC 42001',
    'ISO/IEC 27001',
    'SFDA Medical Quality',
    'ZATCA',
    'SAMA',
    'حوكمة الذكاء الاصطناعي في السعودية',
  ],
  knowsLanguage: ['ar-SA', 'en-SA'],
  slogan: SITE.tagline,
  brand: {
    '@type': 'Brand',
    name: SITE.name,
    slogan: SITE.tagline,
  },
} as const;

/* ──────────────────────────────────────────────────────────────────
 * 2. LOCAL BUSINESS — per Saudi city
 * ────────────────────────────────────────────────────────────────── */

interface LocalBusinessInput {
  cityEn: 'Riyadh' | 'Jeddah' | 'Dammam' | 'Khobar' | 'Mecca' | 'Madinah';
  cityAr: string;
  regionAr: string;
  geoLat: number;
  geoLng: number;
  /**
   * Absolute path (under SITE.url) of the live city page that this
   * LocalBusiness node represents. Must point to an existing built page
   * — `/solutions/<city>/` alone returns 404, so we pin each city to its
   * actual sector landing (e.g. `/solutions/banking-ai-governance/riyadh/`).
   */
  href: string;
  wikidataId?: string;
}

/**
 * Build a LocalBusiness node for a specific Saudi city.
 * Each city gets its own @id, GeoCoordinates, and GeoCircle serviceArea.
 * Schema.org expects `LocalBusiness` (not `Service`) for local presence —
 * we merge both types via array.
 *
 * `href` must be the path of an existing built page. If you change which
 * sector landing owns a city, update the `href` for that city in
 * `LOCAL_BUSINESS_BY_CITY` below — never fabricate a non-existent URL.
 */
export function getLocalBusinessLd(input: LocalBusinessInput) {
  const { cityEn, cityAr, regionAr, geoLat, geoLng, wikidataId, href } = input;
  const canonical = `${SITE.url}${href}`;
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Service'],
    '@id': `${canonical}#localbusiness`,
    name: `BrightAI — حوكمة AI في ${cityAr}`,
    description: `خدمات BrightAI لحوكمة وأمان الذكاء الاصطناعي في ${cityAr}، المملكة العربية السعودية. يدعم جاهزية الامتثال وفق PDPL وNCA ECC ولا يُعد استشارة قانونية.`,
    url: canonical,
    telephone: '+966538229013',
    image: `${SITE.url}/assets/images/og/og-solutions.webp`,
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'رويغب الفيحاء',
      addressLocality: cityAr,
      addressRegion: regionAr,
      addressCountry: 'SA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: geoLat,
      longitude: geoLng,
    },
    areaServed: {
      '@type': 'City',
      name: cityAr,
      ...(wikidataId ? { '@id': `https://www.wikidata.org/wiki/${wikidataId}` } : {}),
    },
    provider: { '@id': 'https://brightai.site/#organization' },
    parentOrganization: { '@id': 'https://brightai.site/#organization' },
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: geoLat,
        longitude: geoLng,
      },
      geoRadius: '100 km',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    currenciesAccepted: 'SAR',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    knowsAbout: [
      'AI Governance',
      'AI Safety',
      'PDPL Compliance',
      'NCA ECC Controls',
      'حوكمة الذكاء الاصطناعي في السعودية',
    ],
  };
}

/**
 * Pre-built LocalBusiness nodes for the six Saudi cities mentioned on the
 * site (الرياض، جدة، الدمام، الخبر، مكة، المدينة).
 * Geo coordinates are sourced from public knowledge of Saudi city centres.
 */
export const LOCAL_BUSINESS_BY_CITY = {
  riyadh: getLocalBusinessLd({
    cityEn: 'Riyadh',
    cityAr: 'الرياض',
    regionAr: 'منطقة الرياض',
    geoLat: 24.7136,
    geoLng: 46.6753,
    href: '/solutions/banking-ai-governance/riyadh/',
    wikidataId: 'Q3674',
  }),
  jeddah: getLocalBusinessLd({
    cityEn: 'Jeddah',
    cityAr: 'جدة',
    regionAr: 'منطقة مكة المكرمة',
    geoLat: 21.4858,
    geoLng: 39.1925,
    href: '/solutions/healthcare-ai-governance/jeddah/',
    wikidataId: 'Q39547',
  }),
  dammam: getLocalBusinessLd({
    cityEn: 'Dammam',
    cityAr: 'الدمام',
    regionAr: 'المنطقة الشرقية',
    geoLat: 26.4207,
    geoLng: 50.0888,
    href: '/solutions/government-ai-governance/dammam/',
    wikidataId: 'Q41630',
  }),
  khobar: getLocalBusinessLd({
    cityEn: 'Khobar',
    cityAr: 'الخبر',
    regionAr: 'المنطقة الشرقية',
    geoLat: 26.2794,
    geoLng: 50.2083,
    href: '/solutions/banking-ai-governance/khobar/',
    wikidataId: 'Q810482',
  }),
  mecca: getLocalBusinessLd({
    cityEn: 'Mecca',
    cityAr: 'مكة المكرمة',
    regionAr: 'منطقة مكة المكرمة',
    geoLat: 21.3891,
    geoLng: 39.8579,
    href: '/solutions/healthcare-ai-governance/mecca/',
    wikidataId: 'Q35484',
  }),
  madinah: getLocalBusinessLd({
    cityEn: 'Madinah',
    cityAr: 'المدينة المنورة',
    regionAr: 'منطقة المدينة المنورة',
    geoLat: 24.4686,
    geoLng: 39.6142,
    href: '/solutions/government-ai-governance/madinah/',
    // BAI-SEO-003-S3 (2026-07-18): correct Wikidata Q-ID. The previous value
    // Q35484 was Mecca (a duplicate from the `mecca` entry above). Madinah's
    // correct Q-ID per Wikidata is Q334084.
    wikidataId: 'Q334084',
  }),
} as const;

/* ──────────────────────────────────────────────────────────────────
 * 3. BREADCRUMB LIST
 * ────────────────────────────────────────────────────────────────── */

export interface Crumb {
  name: string;
  href: string; // absolute or path; if path, prepended with SITE.url
}

/**
 * Build a BreadcrumbList node from a flat list of crumbs.
 * The last crumb (current page) must have href equal to the page's
 * canonical, but no href is required for the final item by Google —
 * it is optional. We include it for completeness.
 */
export function getBreadcrumbLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.href.startsWith('http') ? c.href : `${SITE.url}${c.href}`,
    })),
  };
}

/* ──────────────────────────────────────────────────────────────────
 * 4. FAQ PAGE
 * ────────────────────────────────────────────────────────────────── */

export interface FaqItem {
  q: string;
  a: string; // plain text (HTML stripped by caller)
}

/**
 * Build a FAQPage node from {q, a} pairs.
 * If items is empty, returns null — caller should not append.
 */
export function getFaqLd(items: FaqItem[]) {
  if (!items || items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
}

/* ──────────────────────────────────────────────────────────────────
 * 5. SOFTWARE APPLICATION (Kernel product)
 * ────────────────────────────────────────────────────────────────── */

/**
 * BAI-SEO-003-S3 (2026-07-18): AggregateRating was previously hard-coded
 * with `ratingValue: "4.8"` and `ratingCount: "47"` but no source-backed
 * review data exists for BrightAI Kernel — those numbers were fabricated.
 * Google explicitly penalises unbacked AggregateRating in Search Quality
 * guidelines (Product Reviews update 2024+). The field is removed here and
 * will be re-added only when real, source-cited reviews are available
 * (e.g. a verified G2 / Capterra listing or a public Trustpilot widget).
 */
export const KERNEL_PRODUCT = {
  '@context': 'https://schema.org',
  '@type': ['SoftwareApplication', 'WebApplication'],
  '@id': 'https://brightai.site/#product',
  name: 'BrightAI Kernel',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'AI Governance Platform',
  operatingSystem: 'Cloud, Hybrid, On-Premise, Air-Gapped',
  description:
    'نواة حوكمة الذكاء الاصطناعي للمنشآت السعودية — تدعم جاهزية الامتثال وتشغيل AI Firewall وسجل التدقيق والموافقات البشرية وملفات الأدلة. ليست استشارة قانونية.',
  url: 'https://brightai.site/kernel/',
  provider: { '@id': 'https://brightai.site/#organization' },
  featureList: [
    'AI Firewall — فحص الطلبات ومنع تسريب البيانات',
    'PII Redaction — إخفاء البيانات الشخصية تلقائياً',
    'Audit Trail — سجل تدقيق غير قابل للتعديل',
    'Human Approval Layer — موافقات بشرية للقرارات عالية المخاطر',
    'AI Evidence File — ملفات أدلة PDF موقّعة رقمياً',
    'Risk Scoring — تصنيف مخاطر كل طلب',
    'Compliance Packs — حزم امتثال PDPL وNCA وSFDA وSAMA',
    'Policy Editor — محرر سياسات بدون تعقيد تقني',
    'Enterprise Connectors — ربط آمن مع ERP وCRM وHIS',
    'Statistics Dashboard — مؤشرات تشغيلية ورؤية شاملة',
  ],
  offers: {
    '@type': 'Offer',
    priceCurrency: 'SAR',
    price: 0,
    availability: 'https://schema.org/InStock',
    url: 'https://brightai.site/contact/',
    description: 'تواصل عبر /contact/ للحصول على عرض سعر مخصص لحجم المنشأة',
  },
  inLanguage: 'ar-SA',
} as const;

/* ──────────────────────────────────────────────────────────────────
 * 6. WEB PAGE (generic)
 * ────────────────────────────────────────────────────────────────── */

export function getWebPageLd(opts: {
  canonical: string;
  name: string;
  description: string;
  inLanguage?: string;
  breadcrumbs?: Crumb[];
}) {
  const { canonical, name, description, inLanguage = 'ar-SA', breadcrumbs } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name,
    description,
    inLanguage,
    isPartOf: { '@id': 'https://brightai.site/#website' },
    about: { '@id': 'https://brightai.site/#organization' },
    publisher: { '@id': 'https://brightai.site/#organization' },
    ...(breadcrumbs ? { breadcrumb: getBreadcrumbLd(breadcrumbs) } : {}),
  };
}

/* ──────────────────────────────────────────────────────────────────
 * 8. KERNEL SUB-PAGE JSON-LD  (SEMRUSH-FIX-2026-07-08 #45)
 * ────────────────────────────────────────────────────────────────
 *
 * Each /kernel/<slug>/ page used to emit a STRAY standalone WebApplication
 * node missing SoftwareApplication parent + aggregateRating + offers.
 * This helper produces a single KERNEL_PRODUCT node (with @type as ARRAY
 * ["SoftwareApplication", "WebApplication"] and all REQUIRED/RECOMMENDED
 * fields including aggregateRating and offers), plus optional page-specific
 * overrides (per-unit label/url/description).
 *
 * Returned as an array, since `array` is what BaseLayout.flattenGraphNodes
 * RECOGNIZES for merging into the foundation @graph.
 *
 * Usage:
 *   import { getKernelSubPageJsonLd } from '../../data/schema-helpers';
 *   const unit = getKernelUnit('stats');
 *   const jsonLd = getKernelSubPageJsonLd(unit);
 */
export function getKernelSubPageJsonLd(
  unit: {
    canonical: string;
    label: string;
    description?: string;
  },
  extras: Array<Record<string, unknown>> = [],
): Array<Record<string, unknown>> {
  const overrideDescription =
    unit.description ?? KERNEL_PRODUCT.description;
  return [
    {
      ...KERNEL_PRODUCT,
      name: `BrightAI Kernel - ${unit.label}`,
      url: unit.canonical,
      description: overrideDescription,
    },
    ...extras,
  ];
}

/* ──────────────────────────────────────────────────────────────────
 * 7. HOW TO (for procedural / step-by-step docs)
 * ────────────────────────────────────────────────────────────────── */

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

export function getHowToLd(opts: {
  canonical: string;
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration, e.g. "P30D"
}) {
  const { canonical, name, description, steps, totalTime } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${canonical}#howto`,
    name,
    description,
    ...(totalTime ? { totalTime } : {}),
    inLanguage: 'ar-SA',
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

/* ──────────────────────────────────────────────────────────────────
 * 8. UTILITY: wrap an array into @graph
 * ────────────────────────────────────────────────────────────────── */

/**
 * Combines multiple schema nodes into a single @graph object.
 * Filters out null/undefined values.
 */
export function toGraph(nodes: Array<Record<string, unknown> | null | undefined>) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter((n): n is Record<string, unknown> => Boolean(n)),
  };
}

/**
 * Returns a fresh array (without mutating input) of nodes, useful
 * for pages that already use the `jsonLd = [...]` array pattern.
 */
export function appendLd(
  existing: Array<Record<string, unknown>>,
  additions: Array<Record<string, unknown> | null | undefined>,
): Array<Record<string, unknown>> {
  return [...existing, ...additions.filter((n): n is Record<string, unknown> => Boolean(n))];
}

/* ──────────────────────────────────────────────────────────────────
 * 9. EVENT (BAI-SEO-003-S3, 2026-07-18)
 * ────────────────────────────────────────────────────────────────
 *
 * Google requires `name`, `startDate`, and `location` for an Event node
 * to be eligible for rich results. `eventStatus`, `organizer`, and
 * `offers` are RECOMMENDED. Do NOT call this helper without verified
 * startDate + venue — fabricated dates violate Google spam policies.
 *
 * BAI-SEO-003-S3 removed the previously-emitted Event nodes on the
 * three /events/* pages because none had a confirmed startDate or
 * physical venue at the time. Use this helper to add Event rich-result
 * eligibility when a confirmed date + venue exist.
 */
export interface EventInput {
  canonical: string;
  name: string;
  description: string;
  startDate: string; // ISO 8601, e.g. "2026-09-15T18:00"
  endDate?: string;
  /** Physical Place (OfflineEvent) or VirtualLocation (OnlineEvent). */
  location:
    | {
        type: 'Place';
        name: string;
        streetAddress?: string;
        addressLocality: string;
        addressRegion?: string;
        addressCountry: string;
      }
    | {
        type: 'VirtualLocation';
        url: string;
        name?: string;
      };
  eventAttendanceMode:
    | 'https://schema.org/OfflineEventAttendanceMode'
    | 'https://schema.org/OnlineEventAttendanceMode'
    | 'https://schema.org/MixedEventAttendanceMode';
  eventStatus?:
    | 'https://schema.org/EventScheduled'
    | 'https://schema.org/EventCancelled'
    | 'https://schema.org/EventPostponed'
    | 'https://schema.org/EventRescheduled';
  /** Free-form ticket offer (e.g. SAR price + URL). */
  offers?: {
    price: number;
    priceCurrency: string;
    url: string;
    availability: string;
    validFrom?: string;
  };
  inLanguage?: string;
}

export function getEventLd(input: EventInput) {
  const {
    canonical,
    name,
    description,
    startDate,
    endDate,
    location,
    eventAttendanceMode,
    eventStatus,
    offers,
    inLanguage = 'ar-SA',
  } = input;
  const locationNode =
    location.type === 'Place'
      ? {
          '@type': 'Place',
          name: location.name,
          address: {
            '@type': 'PostalAddress',
            ...(location.streetAddress ? { streetAddress: location.streetAddress } : {}),
            addressLocality: location.addressLocality,
            ...(location.addressRegion ? { addressRegion: location.addressRegion } : {}),
            addressCountry: location.addressCountry,
          },
        }
      : {
          '@type': 'VirtualLocation',
          url: location.url,
          ...(location.name ? { name: location.name } : {}),
        };
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${canonical}#event`,
    name,
    description,
    startDate,
    ...(endDate ? { endDate } : {}),
    eventAttendanceMode,
    ...(eventStatus ? { eventStatus } : {}),
    location: locationNode,
    organizer: { '@id': 'https://brightai.site/#organization' },
    inLanguage,
    ...(offers
      ? {
          offers: {
            '@type': 'Offer',
            price: offers.price,
            priceCurrency: offers.priceCurrency,
            url: offers.url,
            availability: offers.availability,
            ...(offers.validFrom ? { validFrom: offers.validFrom } : {}),
          },
        }
      : {}),
  };
}

/* ──────────────────────────────────────────────────────────────────
 * 10. ARTICLE (BAI-SCHEMA-03)
 * ────────────────────────────────────────────────────────────────
 *
 * Article JSON-LD node for blog posts. Adds an `Article` type alongside
 * the existing `BlogPosting` in the @graph. Includes speakable
 * specification pointing to the TL;DR aside and the description.
 *
 * Usage:
 *   import { getArticleLd } from '../../data/schema-helpers';
 *   const articleNode = getArticleLd({
 *     canonical: post.canonical,
 *     headline: post.title,
 *     description: post.description,
 *     image: post.ogImage,
 *     datePublished: post.pubDate,
 *     dateModified: post.updatedDate,
 *     authorName: post.author.name,
 *     authorSlug: post.author.slug,
 *     category: post.category,
 *     tags: post.tags,
 *   });
 */

export interface ArticleLdInput {
  canonical: string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorSlug: string;
  category: string;
  tags: string[];
  inLanguage?: string;
}

export function getArticleLd(input: ArticleLdInput) {
  const {
    canonical,
    headline,
    description,
    image,
    datePublished,
    dateModified,
    authorName,
    authorSlug,
    category,
    tags,
    inLanguage = 'ar-SA',
  } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline,
    description,
    image: {
      '@type': 'ImageObject',
      url: `${SITE.url}${image}`,
      width: 1200,
      height: 630,
    },
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      '@id': `${SITE.url}/authors/${authorSlug}#person`,
      name: authorName,
    },
    publisher: { '@id': 'https://brightai.site/#organization' },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    articleSection: category,
    keywords: tags.join(', '),
    inLanguage,
  };
}

/* ──────────────────────────────────────────────────────────────────
 * 9. SERVICE (BAI-SCHEMA-05)
 * ────────────────────────────────────────────────────────────────
 *
 * Reusable Service node for /solutions/* and /kernel/* pages.
 * Uses ORGANIZATION @id as provider and includes the core fields
 * requested by the ticket: serviceType, areaServed, offers.
 */

export interface ServiceLdInput {
  canonical: string;
  name: string;
  description: string;
  serviceType: string;
  areaServed?: string | Array<string | Record<string, string>>;
  offers?: {
    priceCurrency?: string;
    price?: number;
    availability?: string;
    url: string;
    description?: string;
  };
}

export function getServiceLd(input: ServiceLdInput) {
  const { canonical, name, description, serviceType, areaServed = 'Saudi Arabia', offers } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name,
    description,
    serviceType,
    provider: { '@id': 'https://brightai.site/#organization' },
    areaServed,
    ...(offers
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: offers.priceCurrency ?? 'SAR',
            price: offers.price ?? 0,
            availability: offers.availability ?? 'https://schema.org/InStock',
            url: offers.url,
            ...(offers.description ? { description: offers.description } : {}),
          },
        }
      : {}),
  };
}
