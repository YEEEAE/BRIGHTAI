const CORE_MARKETING_FILES = [
  "index.html",
  "about/index.html",
  "services/index.html",
  "contact/index.html",
  "blog/index.html",
  "tools/index.html",
  "ai-bots/index.html",
  "case-studies/index.html",
  "partners/index.html",
  "what-is-ai/index.html"
];

const EN_CORE_MARKETING_FILES = [
  "en/index.html",
  "en/about/index.html",
  "en/services/index.html",
  "en/contact/index.html",
  "en/ai-bots/index.html",
  "en/tools/index.html",
];

const DOCS_PUBLIC_FILES = [
  "docs/ai-agent.html",
  "docs/ai-agent-en.html",
  "docs/ai-bots.html",
  "docs/ai-bots-en.html",
  "docs/consultation.html",
  "docs/consultation-en.html",
  "docs/contact.html",
  "docs/contact-en.html",
  "docs/data-analysis.html",
  "docs/data-analysis-en.html",
  "docs/faq.html",
  "docs/faq-en.html",
  "docs/openapi.html",
  "docs/services-overview.html",
  "docs/services-overview-en.html",
  "docs/smart-automation.html",
  "docs/smart-automation-en.html",
  "docs/solutions-bi.html",
  "docs/solutions-bi-en.html",
  "docs/solutions-crm.html",
  "docs/solutions-crm-en.html",
  "docs/solutions-finance.html",
  "docs/solutions-finance-en.html",
  "docs/solutions-healthcare.html",
  "docs/solutions-healthcare-en.html",
  "docs/solutions-hr.html",
  "docs/solutions-hr-en.html",
  "docs/solutions-interview.html",
  "docs/solutions-interview-en.html",
  "docs/solutions-logistics.html",
  "docs/solutions-logistics-en.html",
  "docs/solutions-ocr.html",
  "docs/solutions-ocr-en.html",
  "docs/solutions-retail.html",
  "docs/solutions-retail-en.html",
  "docs/solutions-supply-chain.html",
  "docs/solutions-supply-chain-en.html",
];

const CANONICAL_DEMO_TARGET_FILES = [
  "demo/smart-medical-archive/index.html",
  "demo/ai-tenders-analysis/index.html",
  "demo/ai-tenders-analysis/landing.html",
  "demo/ai-tenders-analysis/compare.html",
  "en/tenders/landing.html",
  "en/tenders/compare.html",
  "en/demo/ai-tenders-analysis/index.html",
  "demo/smart-hiring-system/index.html",
  "en/demo/smart-hiring-system/index.html",
];

export const SITEMAP_REQUIRED_SERVICE_PAGE_FILES = [
  "smart-automation/index.html",
  "data-analysis/index.html",
  "ai-agent/index.html",
  "consultation/index.html",
  "machine-learning/index.html",
  "ai-workflows/index.html",
  "health/index.html",
  "en/smart-automation/index.html",
  "en/data-analysis/index.html",
  "en/ai-agent/index.html",
  "en/consultation/index.html",
  "en/ai-workflows/index.html",
  "en/health/index.html",
  "demo/smart-hiring-system/index.html",
  "en/demo/smart-hiring-system/index.html"
];

export const HIGH_CONFIDENCE_SECTOR_FILES = [
  "sectors/ecommerce.html",
  "sectors/ecommerce-en.html",
  "sectors/energy.html",
  "sectors/energy-en.html",
  "sectors/finance.html",
  "sectors/finance-en.html",
  "sectors/healthcare.html",
  "sectors/healthcare-en.html",
  "sectors/logistics.html",
  "sectors/logistics-en.html",
  "sectors/manufacturing.html",
  "sectors/manufacturing-en.html",
];

export const HIGH_CONFIDENCE_BLOG_FILES = [
  "blog/ai-guide-saudi-business.html",
  "blog/choose-ai-company-saudi.html",
  "blog/vision-2030-ai-opportunities.html",
  "blog/top-ai-tools-saudi-2025.html",
  "blog/ai-implementation-cost-guide.html",
  "blog/hr-automation-case-study.html",
  "blog/chatgpt-vs-claude-vs-gemini-arabic.html",
  "blog/nca-ai-compliance-saudi.html",
  "blog/ai-healthcare-saudi.html",
  "blog/ai-innovation-saudi-arabia.html",
  "blog/ai-generative-content-industry-saudi-arabia.html",
  "blog/saudi-bank-fraud-detection.html",
  "blog/saudi-logistics-route-optimization.html",
  "blog/saudi-energy-predictive-maintenance.html",
  "blog/saudi-manufacturing-predictive-maintenance.html",
  "blog/saudi-ecommerce-ai-growth.html",
  "blog/automation/hr-automation-saudi/index.html",
  "blog/data-analytics/power-bi-saudi-guide/index.html"
];

export const HIGH_CONFIDENCE_CORE_FILES = [
  ...CORE_MARKETING_FILES,
  ...EN_CORE_MARKETING_FILES,
  ...CANONICAL_DEMO_TARGET_FILES,
  ...SITEMAP_REQUIRED_SERVICE_PAGE_FILES,
  ...DOCS_PUBLIC_FILES,
];

export const HIGH_CONFIDENCE_SITEMAP_FILES = [
  ...new Set([
    ...HIGH_CONFIDENCE_CORE_FILES,
    ...HIGH_CONFIDENCE_SECTOR_FILES,
    ...HIGH_CONFIDENCE_BLOG_FILES
  ])
].sort((first, second) => first.localeCompare(second, "en"));
