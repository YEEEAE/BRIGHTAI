const CORE_MARKETING_FILES = [
  "index.html",
  "about/index.html",
  "services/index.html",
  "contact/index.html",
  "blog/index.html",
  "ai-bots/index.html",
  "case-studies/index.html",
  "partners/index.html",
  "tools/index.html",
  "what-is-ai/index.html",
  "docs.html"
];

export const SITEMAP_REQUIRED_SERVICE_PAGE_FILES = [
  "smart-automation/index.html",
  "data-analysis/index.html",
  "ai-agent/index.html",
  "frontend/pages/smart-medical-archive/index.html",
  "frontend/pages/ai-workflows/index.html",
  "consultation/index.html",
  "machine-learning/index.html",
  "frontend/pages/ai-scolecs/index.html",
  "frontend/pages/docs/services-overview.html",
  "frontend/pages/docs/services-overview-en.html",
  "frontend/pages/docs/consultation.html",
  "frontend/pages/docs/consultation-en.html",
  "frontend/pages/docs/ai-agent.html",
  "frontend/pages/docs/ai-agent-en.html",
  "frontend/pages/docs/smart-automation.html",
  "frontend/pages/docs/smart-automation-en.html",
  "frontend/pages/docs/data-analysis.html",
  "frontend/pages/docs/data-analysis-en.html"
];

export const HIGH_CONFIDENCE_SECTOR_FILES = [
  "frontend/pages/sectors/ecommerce.html",
  "frontend/pages/sectors/energy.html",
  "frontend/pages/sectors/finance.html",
  "frontend/pages/sectors/healthcare.html",
  "frontend/pages/sectors/logistics.html",
  "frontend/pages/sectors/manufacturing.html"
];

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
  "frontend/pages/blogger/digital-health-smart-archive.html",
  "frontend/pages/blogger/saudi-bank-fraud-detection.html",
  "frontend/pages/blogger/saudi-logistics-route-optimization.html",
  "frontend/pages/blogger/saudi-energy-predictive-maintenance.html",
  "frontend/pages/blogger/saudi-manufacturing-predictive-maintenance.html",
  "frontend/pages/blogger/saudi-ecommerce-ai-growth.html",
  "frontend/pages/blog/automation/hr-automation-saudi.html",
  "frontend/pages/blog/data-analytics/kpi-dashboard-guide.html",
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
