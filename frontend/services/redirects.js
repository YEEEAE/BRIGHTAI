const STATIC_ROUTE_REDIRECTS = new Map([
  ['/interview', '/demo/smart-hiring-system/'],
  ['/interview/', '/demo/smart-hiring-system/'],
  ['/interview/index.html', '/demo/smart-hiring-system/'],
  ['/interview/pages/supportAI', '/demo/smart-hiring-system/pages/support-ai/'],
  ['/interview/pages/supportAI/', '/demo/smart-hiring-system/pages/support-ai/'],
  ['/interview/pages/supportAI/index.html', '/demo/smart-hiring-system/pages/support-ai/'],
  ['/job.MAISco', '/demo/smart-hiring-system/'],
  ['/job.MAISco/', '/demo/smart-hiring-system/']
]);

const BLOG_SLUG_REDIRECTS = new Map([
  [
    '/blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1',
    '/blog/ai-automation-project-analysis/'
  ],
  [
    '/blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية',
    '/blog/process-automation-ai-efficiency/'
  ],
  [
    '/blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية',
    '/blog/industrial-automation-productivity/'
  ],
  [
    '/blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية',
    '/blog/financial-hr-automation/'
  ],
  [
    '/blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار',
    '/blog/digital-transformation-automation/'
  ],
  [
    '/blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور',
    '/blog/machine-learning-computer-vision/'
  ],
  [
    '/blog/الذكاء-الاصطناعي-و-التسويق',
    '/blog/ai-marketing-guide/'
  ],
  [
    '/blog/تحليل-البيانات',
    '/blog/data-analysis-decision-making/'
  ],
  [
    '/blog/تعلم-الآلة-و-الأعمال',
    '/blog/machine-learning-business/'
  ],
  [
    '/blog/مقال-تحليل',
    '/blog/ai-data-analysis-tools/'
  ],
  [
    '/blog/أتمتة الذكاء الاصطناعي_ حلول مخصصة لتحليل المشاريع وتحسين محركات البحث (1)',
    '/blog/ai-automation-project-analysis/'
  ],
  [
    '/blog/أتمتة العمليات باستخدام الذكاء الاصطناعي_ الطريق إلى تحسين الكفاءة التشغيلية',
    '/blog/process-automation-ai-efficiency/'
  ],
  [
    '/blog/استشارات الذكاء الاصطناعي_ كيف تسهم في تحقيق التحول الرقمي للشركات',
    '/blog/choose-ai-company-saudi/'
  ],
  [
    '/blog/الأتمتة الصناعية وأتمتة المهام المتكررة_ كيفية تحسين الكفاءة الإنتاجية',
    '/blog/industrial-automation-productivity/'
  ],
  [
    '/blog/الأتمتة المالية وأتمتة الموارد البشرية_ حلول مستقبلية للشركات الذكية',
    '/blog/financial-hr-automation/'
  ],
  [
    '/blog/التحول الرقمي وأتمتة العمليات_ كيف يمكن للذكاء الاصطناعي أن يقود الابتكار',
    '/blog/digital-transformation-automation/'
  ],
  [
    '/blog/التعلم الآلي والرؤية الحاسوبية_ مستقبل الذكاء الاصطناعي في معالجة اللغة الطبيعية والتعرف على الصور',
    '/blog/machine-learning-computer-vision/'
  ],
  [
    '/blog/atou.doc',
    '/blog/process-automation-ai-efficiency/'
  ],
  [
    '/blog/astr.doc',
    '/blog/'
  ]
]);

const FOLDER_BLOG_SLUGS = new Set([
  'ai-automation-project-analysis',
  'process-automation-ai-efficiency',
  'industrial-automation-productivity',
  'financial-hr-automation',
  'digital-transformation-automation',
  'machine-learning-computer-vision',
  'ai-marketing-guide',
  'data-analysis-decision-making',
  'machine-learning-business',
  'ai-data-analysis-tools'
]);

function normalizeStaticRedirectSource(pathname) {
  if (!pathname || pathname === '/') {
    return pathname;
  }

  let normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (normalized.endsWith('.html')) {
    normalized = normalized.slice(0, -5);
  }
  return normalized;
}

function getBlogRedirectTarget(pathname) {
  if (!pathname || !pathname.startsWith('/blog/')) {
    return null;
  }

  const folderSlug = pathname.match(/^\/blog\/([A-Za-z0-9-]+)\/?$/);
  if (folderSlug && FOLDER_BLOG_SLUGS.has(folderSlug[1])) {
    return pathname.endsWith('/') ? null : `/blog/${folderSlug[1]}/`;
  }

  const folderSlugHtml = pathname.match(/^\/blog\/([A-Za-z0-9-]+)\.html$/);
  if (folderSlugHtml && FOLDER_BLOG_SLUGS.has(folderSlugHtml[1])) {
    return `/blog/${folderSlugHtml[1]}/`;
  }

  if (pathname === '/blog/production-line' || pathname === '/blog/production-line/' || pathname === '/blog/production-line.html') {
    return '/blog/industrial-automation-productivity/';
  }

  if (
    pathname === '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات' ||
    pathname === '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات/' ||
    pathname === '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات.html'
  ) {
    return '/blog/choose-ai-company-saudi/';
  }

  const candidates = new Set([pathname]);
  try {
    candidates.add(decodeURIComponent(pathname));
  } catch (_error) {
    // نتجاهل المسارات غير القابلة للفك ونكتفي بالقيمة الأصلية.
  }

  for (const candidate of candidates) {
    const normalized = normalizeStaticRedirectSource(candidate);
    if (BLOG_SLUG_REDIRECTS.has(normalized)) {
      return BLOG_SLUG_REDIRECTS.get(normalized);
    }
  }

  return null;
}

function getRedirectTarget(pathname) {
  return STATIC_ROUTE_REDIRECTS.get(pathname) || getBlogRedirectTarget(pathname);
}

module.exports = {
  getRedirectTarget,
  getBlogRedirectTarget,
  normalizeStaticRedirectSource
};
