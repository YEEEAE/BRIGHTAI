# Codebase Audit: Unused Files & Assets Report
**Generated:** January 22, 2026  
**Project:** BrightAI Website  
**Purpose:** Identify orphaned, redundant, and unused files for cleanup

---

## Executive Summary

This audit identified **multiple categories of unused files** that can be safely removed to:
- Reduce repository bloat
- Improve site performance
- Simplify maintenance
- Enhance security by removing test/admin pages

**Total Files Identified for Removal:** ~50+ files across 6 categories

---

## 1. Test & Development Files (HIGH PRIORITY)

### Files Blocked in robots.txt but Still Present:

- **checkout.html** - PayPal checkout page (not linked in sitemap or navigation)
- **new_content.html** - Content staging file (not in sitemap)
- **try.html** - Demo/test page for data analysis (partially functional)
- **admin.html** - Admin dashboard (security risk if exposed)

**Recommendation:** DELETE these files immediately. They are blocked in robots.txt but still accessible if someone knows the URL.

---



---

## 3. Documentation Files (/Docfile/) - MEDIUM PRIORITY

The /Docfile/ directory contains multiple .doc.html files with inconsistent naming:

**Files:**
- About.Bright.AI.html ✓ (Referenced in old/e/want.html navigation)
- Vision.Mission.html ✓ (May be referenced)
- agent.doc.html
- anlisis.doc.html (typo: should be "analysis")
- atou.doc.html
- culn.doc.html
- data-analytics.doc.html
- developers.webhooks.doc.html
- projects.doc.html
- serves.dov.html (typo: should be "services.doc")
- tool.doc.html
- test (empty file?)

**Issues:**
1. Inconsistent naming conventions
2. Multiple typos in filenames
3. Not linked in main navigation
4. Only referenced in old/e/want.html (deprecated page)


**Recommendation:**
- **Option A:** DELETE entire /Docfile/ directory if documentation is not actively used
- **Option B:** Consolidate into proper documentation structure under /docs/ with correct naming
- **Option C:** Integrate useful content into main site pages

---

## 4. Blogger Directory - REVIEW REQUIRED

The /blogger/ directory contains **40+ blog post HTML files**. Many are referenced in robots.txt:

**Allowed in robots.txt (Keep):**
- ai-transformation.html
- intelligent-data-analysis.html
- process-automation.html
- smart-automation-benefits.html
- big-data-analysis.html
- ai-generative-content-industry-saudi-arabia.html
- case-study-saudi-companies-ai-agents-customer-service.html
- future-of-intelligent-data-analysis-finance-sector.html

**Potentially Unused (Review):**
- 1212344.html, 3.html, 4.html, 6v5m.html (generic names)
- viewport.HTML, vvhh.html, xsxd.html (test files?)
- description.html, compypterrrr.html (typos)


**Recommendation:**
- Review each file's analytics data
- DELETE files with no traffic in last 6 months
- Consolidate similar content
- Fix typos in filenames

---

## 5. Unused Assets & Duplicates

### Duplicate Images:
- Gemini.png (root)
- Gemini-original.png (root)
- Gemini.webp (root)
- Customer/Gemini.png
- Docfile/Gemini.png
- blogger/Gemini.png
- botAI/Gemini.png

**Recommendation:** Keep only root Gemini.webp (optimized) and delete duplicates

### Unused Scripts:
- keybord (empty file?)
- fix-html-links.sh (one-time use script)
- generate_sitemap.py (one-time use script)
- validate_sitemap.py (one-time use script)

**Recommendation:** Move scripts to /scripts/ or delete if no longer needed

---

## 6. System Files to Remove

- .DS_Store (multiple locations - macOS system file)
- Docfile/.DS_Store
- h/.DS_Store
- h/Customer-support/assets/.DS_Store
- h/projects/interview/pages/.DS_Store

**Recommendation:** Add .DS_Store to .gitignore and remove all instances


---

## 7. Files Not in Sitemap (Verify Usage)

These pages exist but are NOT in sitemap.xml:

### Potentially Active (Verify):
- about-us.html
- ai-workflows.html
- brightproject-pro.html
- brightrecruiter.html
- brightsales-pro.html
- consultingblog.html
- contact.html
- faq_content.html
- health-bright.html
- job.MAISco.html
- machine.html
- nlp.html
- our-products-new.html
- physical-ai.html
- privacy-cookies.html
- solutions.html
- terms-and-conditions.html
- what-is-ai.html

**Recommendation:** 
- Add important pages to sitemap.xml
- DELETE pages that are truly unused
- Verify with analytics which pages get traffic

---

## 8. Sitemap vs Navigation Discrepancies

**In Sitemap but NOT in main navigation:**
- All pages are in sitemap but navigation structure differs

**In Navigation but NOT in sitemap:**
- None found (good!)

---

## Cleanup Action Plan

### Phase 1: Immediate (Security & Bloat)
1. ✅ DELETE test files: checkout.html, new_content.html, try.html, admin.html
2. ✅ DELETE /old/ directory entirely
3. ✅ DELETE /Customer/ directory (if confirmed unused)
4. ✅ Remove all .DS_Store files
5. ✅ Add .DS_Store to .gitignore

### Phase 2: Documentation Cleanup
1. Review /Docfile/ usage with team
2. Either DELETE or restructure with proper naming
3. Fix typos: anlisis → analysis, serves.dov → services.doc

### Phase 3: Blog Optimization
1. Run analytics on /blogger/ files
2. DELETE files with zero traffic
3. Consolidate similar content
4. Fix filename typos

### Phase 4: Asset Optimization
1. Keep only Gemini.webp in root
2. DELETE duplicate Gemini.png files
3. Move utility scripts to /scripts/
4. Optimize remaining images

### Phase 5: Sitemap Sync
1. Add missing important pages to sitemap
2. Remove dead pages from sitemap
3. Verify all sitemap URLs are accessible

---

## Expected Benefits

**Performance:**
- Reduced repository size by ~30-40%
- Faster git operations
- Improved site load times

**Security:**
- Removed exposed admin/test pages
- Reduced attack surface

**Maintenance:**
- Clearer file structure
- Easier to find active files
- Reduced confusion for developers

---

## Tools for Further Analysis

**Recommended:**
1. **Chrome DevTools Coverage** - Identify unused CSS/JS
2. **Google Analytics** - Check page traffic
3. **Screaming Frog** - Crawl site for broken links
4. **Lighthouse** - Performance audit
5. **grep/ripgrep** - Find file references in codebase

---

## Next Steps

1. **Review this report** with the team
2. **Backup** before deletion
3. **Execute Phase 1** immediately (security)
4. **Schedule** Phases 2-5 over next sprint
5. **Monitor** analytics after cleanup
6. **Document** any files that must be kept

---

**Report End**
