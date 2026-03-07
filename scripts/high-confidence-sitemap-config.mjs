const CORE_MARKETING_FILES = [
  "index.html",
  "about/index.html",
  "services/index.html",
  "contact/index.html",
  "blog/index.html",
  "ai-bots/index.html",
  "case-studies/index.html",
  "partners/index.html",
  "what-is-ai/index.html"
];

export const SITEMAP_REQUIRED_SERVICE_PAGE_FILES = [
  "smart-automation/index.html",
  "data-analysis/index.html",
  "ai-agent/index.html",
  "consultation/index.html",
  "machine-learning/index.html"
];

export const HIGH_CONFIDENCE_SECTOR_FILES = [];

export const HIGH_CONFIDENCE_BLOG_FILES = [
  "frontend/pages/blogger/ai-guide-saudi-business.html",
  "frontend/pages/blogger/choose-ai-company-saudi.html",
  "frontend/pages/blogger/vision-2030-ai-opportunities.html",
  "frontend/pages/blogger/top-ai-tools-saudi-2025.html",
  "frontend/pages/blogger/ai-implementation-cost-guide.html",
  "frontend/pages/blogger/hr-automation-case-study.html",
  "frontend/pages/blogger/chatgpt-vs-claude-vs-gemini-arabic.html",
  "frontend/pages/blogger/nca-ai-compliance-saudi.html",
  "frontend/pages/blogger/ai-healthcare-saudi.html",
  "frontend/pages/blogger/ai-innovation-saudi-arabia.html",
  "frontend/pages/blogger/ai-generative-content-industry-saudi-arabia.html",
  "frontend/pages/blogger/saudi-bank-fraud-detection.html",
  "frontend/pages/blogger/saudi-logistics-route-optimization.html",
  "frontend/pages/blogger/saudi-energy-predictive-maintenance.html",
  "frontend/pages/blogger/saudi-manufacturing-predictive-maintenance.html",
  "frontend/pages/blogger/saudi-ecommerce-ai-growth.html",
  "frontend/pages/blog/automation/hr-automation-saudi.html",
  "frontend/pages/blog/data-analytics/power-bi-saudi-guide.html"
];

export const HIGH_CONFIDENCE_CORE_FILES = [
  ...CORE_MARKETING_FILES,
  ...SITEMAP_REQUIRED_SERVICE_PAGE_FILES
];

export const HIGH_CONFIDENCE_SITEMAP_FILES = [
  ...new Set([
    ...HIGH_CONFIDENCE_CORE_FILES,
    ...HIGH_CONFIDENCE_SECTOR_FILES,
    ...HIGH_CONFIDENCE_BLOG_FILES
  ])
].sort((first, second) => first.localeCompare(second, "en"));
