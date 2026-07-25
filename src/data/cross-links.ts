/**
 * cross-links.ts — Bidirectional blog ↔ solution cross-link map
 *
 * BAI-LINK-05: Every blog post links to related solutions ("حلول ذات صلة"),
 * and every solution page links to related blog posts ("مقالات ذات صلة").
 *
 * This file is the single source of truth. To add a cross-link:
 *   1. Add the blog slug to the solution's `blog` array in solutions.ts
 *   2. This file is generated to reflect that mapping
 *
 * The map is built by reversing the solution → blog relationship from
 * solutions.ts, so the two stay in sync automatically.
 */
import { solutions } from './solutions';

/** Strip the /blog/ prefix and trailing slash from a blog path */
function blogSlugFromPath(path: string): string | null {
  const m = path.match(/^\/blog\/([^/]+)\//);
  return m ? m[1] : null;
}

/**
 * Map: blog slug → SolutionData[]
 * Built by reversing each solution's `blog` field.
 */
const _blogToSolutionMap: Map<string, typeof solutions[number][]> = new Map();

for (const sol of solutions) {
  for (const bPath of sol.blog ?? []) {
    const bSlug = blogSlugFromPath(bPath);
    if (!bSlug) continue;
    const existing = _blogToSolutionMap.get(bSlug) ?? [];
    existing.push(sol);
    _blogToSolutionMap.set(bSlug, existing);
  }
}

/**
 * Get related solutions for a blog post slug.
 * Returns solutions that list this blog post in their `blog` field.
 */
export function getRelatedSolutionsForBlog(blogSlug: string): typeof solutions {
  return _blogToSolutionMap.get(blogSlug) ?? [];
}

/**
 * Get the blog slugs that a solution links to.
 * This mirrors the `blog` field from SolutionData.
 */
export function getRelatedBlogSlugs(solutionSlug: string): string[] {
  const sol = solutions.find((s) => s.slug === solutionSlug);
  if (!sol?.blog) return [];
  return sol.blog
    .map((p) => blogSlugFromPath(p))
    .filter((s): s is string => s !== null);
}

export type { SolutionData } from './solutions';
