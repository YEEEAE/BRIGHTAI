Smart Agent Development Prompts for BrightAI Project
BrightAI’s website audit reveals several key issues – duplicate navigation links, mixed-language UI, lack of internal search, unused files, and weak SEO targeting – that impede usability and performance. Removing redundant links and unused assets streamlines the site and improves load speed, since “eliminating unused JavaScript code can directly improve your website’s loading speed – making it lighter and faster”
. Consistent design and localized content are also crucial: mixed English/Arabic labels add cognitive load
, while building a localized SEO strategy (bilingual keywords, meta tags, sitemaps) boosts discoverability
. Based on the attached code and report analysis, the following development prompts and explanations will guide a “smart agent” to fix these issues:
Prompt: “Scan the project codebase (HTML, CSS, JS) to identify unused pages, scripts, and assets. Compare files against the navigation menu and sitemap. Produce a list of orphaned or redundant files (e.g. old docs in /Docfile, test HTML pages) for removal.”
Explanation: Cleaning up unused files reduces bloat and improves performance
. A code audit (using tools like Chrome DevTools Coverage or Lighthouse) will spot unreferenced files (e.g. legacy .doc.html pages, temporary testing files like checkout.html, new_content.html) so they can be deleted. This minimizes load time and maintenance overhead.
Prompt: “Refactor the navigation menu: remove duplicate links and ensure each menu item has a clear label in one language. For example, merge the two ‘smart-automation’ entries into one link, and consistently use Arabic or English labels per section. Verify all menu links point to existing pages.”
Explanation: Duplicate links confuse users and increase cognitive load. As Nielsen Norman Group advises, “eliminate redundancy on webpages whenever possible to reduce cognitive overload. Each extra link makes your site harder to use”
. Consistent language prevents ambiguity; mixing Arabic and English in interface text looks unprofessional and “adds cognitive load”
. Refactoring the menu ensures users see only distinct, meaningful choices.
Prompt: “Test and improve responsive layout: ensure all pages use a mobile-friendly <meta name="viewport"> and that CSS layouts adapt for different screen sizes. Fix any layout shifts or horizontal scrolling issues.”
Explanation: With over half of Saudi users on mobile
, a responsive design is critical. Improving mobile responsiveness prevents users from abandoning the site; one strategy is Google’s mobile-first indexing
. Ensuring fast, stable page rendering (by optimizing CSS grids, using media queries, compressing images) aligns with best practices and local user habits
.
Prompt: “Implement a site-wide internal search function. Integrate an open-source JS search library (e.g. Lunr.js, FlexSearch) to index all main pages and content. Add a visible search input in the header (or sidebar) so users can search instantly.”
Explanation: An internal search greatly aids usability. When users can’t find content, many simply leave; in fact, “poor search functionality is a top reason for site abandonment”
. Empirical data shows about one-third of visitors use on-site search
. Adding a fast search box (with live suggestions) will directly “guide users precisely where they need to go” and significantly boost conversion rates
.
Prompt: “Optimize SEO metadata for a Saudi audience. Update each page’s <title>, meta description, and heading tags to include Arabic keywords like ‘الذكاء الاصطناعي’, ‘أتمتة الشركات’, etc. Translate key content and image alt text into Arabic. Create or update robots.txt and sitemap.xml, and ensure sitemap.xml is referenced in robots.txt. Add <link rel="alternate" hreflang="ar-SA" …> tags (and English equivalents) so search engines serve the correct language version.”
Explanation: Localizing SEO ensures the site appears in regional searches. Expert guides recommend using both English and Arabic keywords for Saudi users
. A sitemap and robots.txt help search engines crawl the site efficiently
, and hreflang tags signal language targeting
. Also, translating metadata (titles, descriptions, alt text) into Arabic improves search relevance
. These steps help increase traffic from local organic search.
Prompt: “Integrate Groq Cloud’s free-tier API to add AI features. For example, build a bilingual AI chatbot interface (e.g. using Llama-3 via Groq) that answers visitor questions about BrightAI’s services. Also add a ‘Summarize’ button on blog pages that sends the article text to the Groq API and displays a short summary.”
Explanation: AI-powered tools enhance user engagement. An on-site AI chatbot can improve support and lead generation by providing instant answers in Arabic/English. Similarly, automated content summarization (using an LLM) keeps articles fresh and accessible. Although no citation is needed for using LLMs, industry trend reports note that AI chatbots and summarizers boost UX and content turnover.
Prompt: “Add interactive illustrations and a unified design system. Choose a consistent color palette and font scheme across all pages. Introduce dark mode support. Enhance pages with icons or infographics relevant to the content (e.g. data charts for analytics). Incorporate subtle animations (e.g. scroll-triggered pulses) that do not hinder performance.”
Explanation: Consistency and visuals improve usability. A design system (consistent colors, typography, component placements) makes the experience “more straightforward to use”
. Visual aids like icons and infographics make information “more engaging and easier to understand”
. Dark mode and smooth animations can enhance appeal, as long as they are lightweight, leveraging CSS animations or small JavaScript libraries.
Prompt: “Compress and optimize all media and code. Convert large images to modern formats (e.g. WebP) and use responsive images (<picture>). Minify and bundle CSS/JS files. Use lazy-loading for offscreen content. Then run a performance audit (e.g. Google Lighthouse) and fix critical issues (render-blocking resources, inefficient code).”
Explanation: Faster pages improve SEO and UX. Unused code and unoptimized assets slow loading
. Tools like PageSpeed Insights or Lighthouse identify bottlenecks. Performance tuning (minification, lazy-loading, image compression) aligns with SEO best practices
 and reduces bounce rates.
Prompt: “Ensure accessibility and SEO markup. Verify all images have descriptive alt text (in both languages) and add ARIA labels to interactive elements. Use a logical heading structure (one <h1> per page, clear <h2>, <h3> hierarchies). Implement Schema.org markup for key content (organization details, breadcrumbs) to improve search trust.”
Explanation: Accessibility features also boost SEO. As recommended, translate metadata and alt text for each language version
. ARIA labels and proper headings help screen readers. Schema markup (e.g. organization, breadcrumbList) signals site structure to crawlers, enhancing rich results. This builds user trust and complies with modern web standards.
Prompt: “Set up analytics and QA processes. Install Google Analytics and Search Console. After changes, run automated tests (broken-link checker, sitemap validator) to confirm all pages load correctly and no links are broken. Conduct A/B tests on critical pages (e.g. homepage layout) and gather user feedback.”
Explanation: Ongoing monitoring ensures sustained quality. Analytics allow tracking SEO ranking and user behavior. Automated QA checks prevent regressions (especially after removals). Periodic user testing can catch any residual UX issues and guide further improvements.
Each of these prompts should be issued to the development agent in context. They directly address the issues identified in the audit. Citations from UX and SEO research support the importance of these tasks (e.g. removing duplicate links
, improving searchability
, and localizing content
). Implementing these steps will systematically improve BrightAI’s website usability, performance, and search visibility. Sources: UX and SEO best practices from Nielsen Norman Group, UX StackExchange, SEO guides, and accessibility experts