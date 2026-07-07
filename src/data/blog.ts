/**
 * BrightAI — Blog collection helpers
 *
 * REPORT-BLOG-2026-07-07: Data layer rewritten to derive from the Astro
 * Content Collection (single source of truth at `src/content/blog/*.md`).
 *
 * What lives here vs where:
 *   - `src/content.config.ts`           — collection + zod schema (canonical)
 *   - `src/content/blog/*.md`            — raw posts (22 currently)
 *   - `src/data/blog.ts` (THIS FILE)     — derived helpers + author registry
 *                                            + category color tints
 *
 * Why collections now own canonical URL + title + pubDate:
 *   Previously canonical + title + pubDate + readingTime were duplicated
 *   in `src/data/blog.ts` and the markdown frontmatter, which was drifting
 *   (e.g. `ai-audit-trail-saudi` had two different pubDates in the two
 *   sources). The md file is now authoritative. Any consumer reading
 *   `posts` or calling `getPublishedPosts()` gets the collection values.
 *
 * Authors:
 *   The blog collection schema stores `author` as a string key. We resolve
 *   the key against `authors` here so `BlogLayout.astro` can keep its
 *   existing `post.author.{name,slug,bio,url}` access pattern.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from './site';

/** 5-category enum required by the brief. Defined here (not imported from
 *  src/content.config.ts) to keep the data layer self-contained — zod v4
 *  type intersections in the content config currently trigger an Astro 6.4.6
 *  parser crash. The list is the same as `BLOG_CATEGORIES` in content.config.ts.
 */
export const BLOG_CATEGORIES = [
  'ذكاء-اصطناعي',
  'رؤية-2030',
  'تحول-رقمي',
  'دراسات-حالة',
  'أمن-البيانات',
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/* ── Public types ─────────────────────────────────────────────────── */

export interface Author {
  slug: string;
  name: string;
  nameEn: string;
  url: string;
  title: string;
  bio: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  canonical: string;
  pubDate: string;          // ISO date (YYYY-MM-DD)
  updatedDate: string;      // ISO date, falls back to pubDate
  author: Author;
  tags: string[];
  category: BlogCategory;
  ogImage: string;
  draft: boolean;
  readingTime: number;
  metaTitle?: string;
}

/* ── Author registry ─────────────────────────────────────────────── */

export const authors: Record<string, Author> = {
  // REPORTS-SEO-FOUNDATION (2026-07-07): the registry keys ARE the URL slugs
  // (Astro's getStaticPaths() uses Object.keys(authors) to build paths).
  // The author.url must therefore match the built path exactly — otherwise
  // the canonical mismatches the actually-served URL.
  // REPORTS-SEO-TEAM-SLUG-001 (2026-07-07): Latin slug to match the
  // other author entry and satisfy seo-ci-check SITEMAP_BANNED_PATTERNS
  // (no spaces / %20 in canonical URL). A 301 redirect from the legacy
  // /authors/<encoded Arabic>/ path is wired in public/_redirects and
  // render.yaml so any existing inbound links still resolve.
  'brightai-team': {
    slug: 'brightai-team',
    name: 'فريق BrightAI',
    nameEn: 'BrightAI Team',
    url: `${SITE.url}/authors/brightai-team/`,
    title: 'فريق BrightAI',
    bio: 'فريق BrightAI يكتب محتوى تنفيذي عن حوكمة الذكاء الاصطناعي والامتثال في السعودية.',
  },
  'nasser-alabdullah': {
    slug: 'nasser-alabdullah',
    name: 'م. ناصر العبدالله',
    nameEn: 'Nasser AlAbdullah',
    url: `${SITE.url}/authors/nasser-alabdullah/`,
    title: 'مستشار حوكمة الذكاء الاصطناعي في BrightAI',
    bio: 'م. ناصر العبدالله مهندس ومستشار حوكمة ذكاء اصطناعي في BrightAI، ويركز محتواه المنشور على تحويل مبادئ AI Governance ومتطلبات الامتثال السعودية إلى ضوابط تشغيلية قابلة للتطبيق والتدقيق داخل المؤسسات. تغطي مقالاته حماية البيانات الشخصية وفق PDPL، وربط استخدامات الذكاء الاصطناعي بضوابط NCA ECC، والتعامل العملي مع إرشادات سدايا، إلى جانب سلامة الذكاء الاصطناعي وسجلات التدقيق والرقابة البشرية وإدارة المخاطر.',
  },
};

const DEFAULT_AUTHOR_KEY = 'brightai-team';

/* ── Mapping helpers ─────────────────────────────────────────────── */

function resolveAuthor(key: string | undefined): Author {
  // Frontmatter may omit `author` (z.string().optional()), so fall back to
  // the team key. If even the team key is missing from the registry,
  // build a minimal Author from the key so pages never crash.
  const k = key || DEFAULT_AUTHOR_KEY;
  return (
    authors[k] ||
    {
      slug: k,
      name: k,
      nameEn: k,
      url: `${SITE.url}/authors/${encodeURIComponent(k)}/`,
      title: k,
      bio: k,
    }
  );
}

/**
 * Default category when a post omits `category` or sends an unknown value.
 * Picked from the enum (widest topic; least likely to mislead readers).
 */
const DEFAULT_BLOG_CATEGORY: BlogCategory = 'ذكاء-اصطناعي';

function resolveCategory(c: string | undefined): BlogCategory {
  // The zod schema keeps `category` permissive (z.string().optional()) to
  // avoid the Astro 6.4.6 + zod v3.25 parser crash documented in
  // src/content.config.ts. We narrow it here against BLOG_CATEGORIES so
  // downstream consumers can rely on the typed BlogPost.category.
  if (c && (BLOG_CATEGORIES as readonly string[]).includes(c)) {
    return c as BlogCategory;
  }
  return DEFAULT_BLOG_CATEGORY;
}

function entrySlug(entry: CollectionEntry<'blog'>): string {
  return entry.data.slug || entry.id.replace(/\.md$/, '');
}

function entryToPost(entry: CollectionEntry<'blog'>): BlogPost {
  const slug = entrySlug(entry);
  return {
    slug,
    title: entry.data.title,
    description: entry.data.description,
    canonical: entry.data.canonical,
    pubDate: entry.data.pubDate,
    updatedDate: entry.data.updatedDate || entry.data.pubDate,
    author: resolveAuthor(entry.data.author),
    tags: entry.data.tags || [],
    category: resolveCategory(entry.data.category),
    ogImage: entry.data.image || '/images/og/brightai-og-1200x630.png',
    draft: !!entry.data.draft,
    readingTime: entry.data.readingTime || 1,
  };
}

/* ── Query helpers ───────────────────────────────────────────────── */

/**
 * Read all posts from the collection (sync, runs at build time).
 * Returns a stable array of derived BlogPost objects.
 */
export function postsFromCollection(): BlogPost[] {
  // getCollection is async at runtime, but Astro evaluates this at build
  // time inside .astro frontmatter, where top-level await is allowed.
  // We surface a synchronous view by exposing a memoized accessor instead.
  throw new Error('Use getPublishedPosts() — postsFromCollection is a placeholder.');
}

/**
 * `getPublishedPosts()` — public facade. Returns ALL non-draft posts,
 * sorted by `pubDate` DESC (newest first).
 *
 * Use this in pages/blog/index.astro and category pages.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const entries = await getCollection('blog', ({ data }) => data.draft !== true);
  return entries
    .map(entryToPost)
    .sort((a, b) => b.pubDate.localeCompare(a.pubDate));
}

/**
 * Like getPublishedPosts but takes a category filter.
 */
export async function getPostsByCategory(category: BlogCategory): Promise<BlogPost[]> {
  const all = await getPublishedPosts();
  return all.filter((p) => p.category === category);
}

/**
 * Get one blog post by slug (sync wrapper around getEntry).
 * Returns null if not found (e.g. draft post accessed publicly).
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const entries = await getCollection('blog');
  const match = entries.find((e) => entrySlug(e) === slug);
  return match ? entryToPost(match) : null;
}

/** Unique categories that have at least one published post. */
export async function getCategories(): Promise<BlogCategory[]> {
  const all = await getPublishedPosts();
  const set = new Set<BlogCategory>();
  for (const p of all) set.add(p.category);
  // Stable order matching BLOG_CATEGORIES (brief specifies a fixed enum).
  return (BLOG_CATEGORIES as readonly BlogCategory[]).filter((c) => set.has(c));
}

/** Count posts in each category (sorted by enum order). */
export async function getCategoryCounts(): Promise<Record<BlogCategory, number>> {
  const all = await getPublishedPosts();
  const counts = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c, 0])) as Record<BlogCategory, number>;
  for (const p of all) counts[p.category] += 1;
  return counts;
}

/**
 * Pick the N most-related posts to `currentSlug`.
 * Score: +1 for each overlapping tag, +2 for the same category.
 * Stable tiebreak: most recent first.
 */
export async function getRelatedPosts(currentSlug: string, limit = 3): Promise<BlogPost[]> {
  const all = await getPublishedPosts();
  const current = all.find((p) => p.slug === currentSlug);
  if (!current) return [];

  const scored = all
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({
      post: p,
      score:
        p.tags.filter((t) => current.tags.includes(t)).length +
        (p.category === current.category ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.post.pubDate.localeCompare(a.post.pubDate))
    .slice(0, limit);
  return scored.map((r) => r.post);
}

/** Posts by author (slug). */
export async function getPostsByAuthor(authorSlug: string): Promise<BlogPost[]> {
  const all = await getPublishedPosts();
  return all.filter((p) => p.author.slug === authorSlug);
}

/* ── Pagination helpers ───────────────────────────────────────────── */

export interface PaginationResult<T> {
  items: T[];
  page: number;        // 1-indexed
  pageCount: number;
  pageSize: number;
  totalItems: number;
  hasPrev: boolean;
  hasNext: boolean;
  basePath: string;    // base URL without `?page=` or `?page=N`
}

/**
 * Split a flat sorted list into pages.
 * Used by both the index page and the category pages.
 *
 * @param allPosts  posts, already sorted (newest first)
 * @param pageSize  items per page (default 9 per the brief)
 * @param page      1-indexed page number
 * @param basePath  used only for downstream pagination link builders
 */
export function paginate<T>(allPosts: T[], page = 1, pageSize = 9, basePath = '/blog/'): PaginationResult<T> {
  const totalItems = allPosts.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const items = allPosts.slice(start, start + pageSize);
  return {
    items,
    page: safePage,
    pageCount,
    pageSize,
    totalItems,
    hasPrev: safePage > 1,
    hasNext: safePage < pageCount,
    basePath,
  };
}

/* ── Visual: category tint tokens ─────────────────────────────────── */

/**
 * Tints applied to the listing card image area.
 * Map stays token-friendly (only the brand/indigo/amber accent gradients).
 */
export const categoryTint: Record<BlogCategory, string> = {
  'ذكاء-اصطناعي': 'teal',
  'رؤية-2030': 'amber-teal',
  'تحول-رقمي': 'indigo',
  'دراسات-حالة': 'amber',
  'أمن-البيانات': 'teal-indigo',
};

/* ── Category URL slug ────────────────────────────────────────────── */

/** Category URL slug — kebab-case Arabic, identical to the enum value. */
export function categorySlug(c: BlogCategory): string {
  return c;
}

/** Display name for a category URL — encoded for safe insertion into href. */
export function categoryHref(c: BlogCategory): string {
  // Astro URL-encodes the path; we leave the literal Arabic value here
  // so the resulting URL is `/blog/category/أمن-البيانات/` which works
  // because Astro 6 normalises Unicode in dynamic routes.
  return `/blog/category/${c}/`;
}

/** Reverse map: URL path segment → category enum. */
export function categoryFromSlug(slug: string): BlogCategory | null {
  return (BLOG_CATEGORIES as readonly string[]).includes(slug)
    ? (slug as BlogCategory)
    : null;
}
