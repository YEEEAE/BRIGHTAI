const CORE_MARKETING_FILES = [
  "index.html",
  "about/index.html",
  "services/index.html",
  "contact/index.html",
  "pricing/index.html",
  "privacy-cookies/index.html",
  "demo/index.html",
  "privacy-policy/index.html",
  "en/privacy-policy/index.html",
  "terms/index.html",
  "en/terms/index.html",
  "cookie-policy/index.html",
  "en/cookie-policy/index.html",
  "pdpl-statement/index.html",
  "en/pdpl-statement/index.html",
  "data-processing-agreement/index.html",
  "en/data-processing-agreement/index.html"
];

const CANONICAL_DEMO_TARGET_FILES = [
  "demo/ai-tenders-analysis/index.html",
  "demo/ai-tenders-analysis/landing.html",
  "demo/ai-tenders-analysis/compare.html",
  "demo/ai-tenders-analysis/dashboard.html",
  "demo/ai-tenders-analysis/reports.html",
  "demo/ai-tenders-analysis/settings.html",
  "demo/ai-tenders-analysis/templates.html",
];

export const SITEMAP_REQUIRED_SERVICE_PAGE_FILES = [
];

export const HIGH_CONFIDENCE_SECTOR_FILES = [
];

export const HIGH_CONFIDENCE_BLOG_FILES = [
];

export const RECOVERY_SITEMAP_CORE_FILES = [
  "index.html",
  "about/index.html",
  "services/index.html",
  "contact/index.html",
  "pricing/index.html",
  "privacy-cookies/index.html",
  "demo/index.html",
  ...CANONICAL_DEMO_TARGET_FILES
];

export const RECOVERY_SITEMAP_BLOG_FILES = [
];

export const RECOVERY_SITEMAP_SECTOR_FILES = [
];

export const RECOVERY_SITEMAP_REQUIRED_FILES = [
  ...RECOVERY_SITEMAP_CORE_FILES,
  ...RECOVERY_SITEMAP_BLOG_FILES,
  ...RECOVERY_SITEMAP_SECTOR_FILES
];

export const HIGH_CONFIDENCE_CORE_FILES = [
  ...CORE_MARKETING_FILES,
  ...CANONICAL_DEMO_TARGET_FILES,
  ...SITEMAP_REQUIRED_SERVICE_PAGE_FILES,
];

export const HIGH_CONFIDENCE_SITEMAP_FILES = [
  ...new Set([
    ...HIGH_CONFIDENCE_CORE_FILES,
    ...HIGH_CONFIDENCE_SECTOR_FILES,
    ...HIGH_CONFIDENCE_BLOG_FILES
  ])
].sort((first, second) => first.localeCompare(second, "en"));
