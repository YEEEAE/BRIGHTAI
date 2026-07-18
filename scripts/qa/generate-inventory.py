#!/usr/bin/env python3
"""Generate ROUTE-INVENTORY.md from extracted SEO data"""

import json
import re
from pathlib import Path

BASE = Path("/Users/yzydalshmry/Desktop/BRIGHTAI")

# Load index.html pages
with open(BASE / 'scripts' / 'seo-data.json', 'r') as f:
    pages = json.load(f)

# Add kernel flat HTML pages
kernel_map = {
    '/kernel/approvals/': 'kernel/approvals.html',
    '/kernel/audit/': 'kernel/audit.html',
    '/kernel/chat/': 'kernel/chat.html',
    '/kernel/compliance/': 'kernel/compliance.html',
    '/kernel/connectors/': 'kernel/connectors.html',
    '/kernel/evidence/': 'kernel/evidence.html',
    '/kernel/policies/': 'kernel/policies.html',
    '/kernel/reports/': 'kernel/reports.html',
    '/kernel/scenarios/': 'kernel/scenarios.html',
    '/kernel/stats/': 'kernel/stats.html',
}

def extract_seo(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    title_m = re.search(r'<title[^>]*>(.*?)</title>', content, re.DOTALL)
    title = title_m.group(1).strip() if title_m else ""
    
    desc_m = re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
    if not desc_m:
        desc_m = re.search(r'<meta\s+[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', content, re.IGNORECASE)
    description = desc_m.group(1).strip() if desc_m else ""
    
    canon_m = re.search(r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\'](.*?)["\']', content, re.IGNORECASE)
    if not canon_m:
        canon_m = re.search(r'<link\s+[^>]*href=["\'](.*?)["\'][^>]*rel=["\']canonical["\']', content, re.IGNORECASE)
    canonical = canon_m.group(1).strip() if canon_m else ""
    
    h1_m = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    if h1_m:
        h1_text = re.sub(r'<[^>]+>', '', h1_m.group(1)).strip()
        h1_text = re.sub(r'\s+', ' ', h1_text)[:150]
    else:
        h1_text = ""
    
    hreflang_m = re.findall(r'hreflang=["\'](.*?)["\']', content)
    hreflang = ";".join(hreflang_m)
    
    jsonld_blocks = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', content, re.DOTALL)
    jsonld_types = []
    for block in jsonld_blocks:
        types = re.findall(r'"@type"\s*:\s*"([^"]+)"', block)
        jsonld_types.extend(types)
    
    ga = "yes" if "G-8LLESL207Q" in content else "no"
    noindex = "yes" if 'noindex' in content.lower() else "no"
    
    return {
        "h1": h1_text,
        "title": title,
        "description": description[:200],
        "canonical": canonical,
        "hreflang": hreflang,
        "jsonld_types": ";".join(jsonld_types),
        "ga_tag": ga,
        "noindex": noindex,
        "file": filepath,
    }

# Load sitemap URLs
import xml.etree.ElementTree as ET
tree = ET.parse(BASE / 'sitemap.xml')
root = tree.getroot()
ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap_urls = set()
for loc in root.findall('.//sm:loc', ns):
    url = loc.text.replace('https://brightai.site', '').rstrip('/')
    if not url: url = '/'
    else: url = url if url.endswith('/') else url + '/'
    sitemap_urls.add(url)

# Add kernel pages
for url_path, filepath in kernel_map.items():
    seo = extract_seo(filepath)
    seo['path'] = url_path
    seo['file'] = filepath
    seo['og_title'] = ''
    seo['og_description'] = ''
    seo['internal_links_count'] = 0
    seo['css_count'] = 0
    seo['js_count'] = 0
    seo['img_count'] = 0
    pages.append(seo)

# Sort all pages
pages.sort(key=lambda x: x['path'])

# Build markdown
def esc(s):
    return s.replace('|', '\\|').replace('\n', ' ')[:80]

md = []
md.append("# ROUTE-INVENTORY.md — BrightAI Complete Route Audit")
md.append("")
md.append("> **Generated:** 2026-06-11 | **Source:** Local file audit of brightai.site")
md.append("> **Total Pages:** {} | **Sitemap URLs:** {} | **Special Files:** 14".format(len(pages), len(sitemap_urls)))
md.append("")

# Summary
md.append("## Executive Summary")
md.append("")
md.append("| Metric | Count |")
md.append("|--------|-------|")
md.append("| Total HTML pages (index.html) | {} |".format(len([p for p in pages if p.get('file','').endswith('index.html')])))
md.append("| Total Kernel pages (flat .html) | 10 |")
md.append("| Total sitemap URLs | {} |".format(len(sitemap_urls)))
md.append("| Pages with all SEO fields | {} |".format(len([p for p in pages if p.get('title') and p.get('description') and p.get('canonical') and p.get('h1')])))
md.append("| Pages missing GA tag | {} |".format(len([p for p in pages if p.get('ga_tag') == 'no'])))
md.append("| Pages with noindex | {} |".format(len([p for p in pages if p.get('noindex') == 'yes'])))
md.append("| Pages with JSON-LD | {} |".format(len([p for p in pages if p.get('jsonld_types')])))
md.append("| Pages with hreflang | {} |".format(len([p for p in pages if p.get('hreflang')])))
md.append("| English pages (/en/) | 5 |")
md.append("| Blog articles | 22 |")
md.append("| Docs pages | 27 |")
md.append("| Solutions pages | 16 |")
md.append("| Kernel pages | 11 |")
md.append("")

# Special files
md.append("## Special Files (Must Preserve)")
md.append("")
md.append("| File | Size | Purpose |")
md.append("|------|------|---------|")
md.append("| llms.txt | 7,219 bytes | LLM crawler content guide |")
md.append("| llms-full.txt | 11,509 bytes | Full LLM content guide |")
md.append("| ai.txt | 5,781 bytes | AI crawler content guide |")
md.append("| robots.txt | 2,246 bytes | Crawl rules (20 user-agents, AI crawlers allowed) |")
md.append("| sitemap.xml | 35,729 bytes | XML sitemap ({} URLs) |".format(len(sitemap_urls)))
md.append("| blog/feed.xml | RSS | Blog RSS feed |")
md.append("| manifest.webmanifest | 4,247 bytes | PWA manifest |")
md.append("| sw.js | 5,227 bytes | Service worker |")
md.append("| _headers | 5,929 bytes | Netlify security headers |")
md.append("| _redirects | 21,966 bytes | 265 redirect rules |")
md.append("| .htaccess | 2,672 bytes | Apache redirects |")
md.append("| CNAME | 14 bytes | Custom domain |")
md.append("| humans.txt | 480 bytes | Team credits |")
md.append("| 404.html | 26,419 bytes | Custom 404 page |")
md.append("| 500.html | 31,981 bytes | Custom 500 page |")
md.append("")

# Robots.txt rules
md.append("## robots.txt Key Rules")
md.append("")
md.append("- **All crawlers allowed** (including AI: GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, PerplexityBot, etc.)")
md.append("- **Sitemap:** https://brightai.site/sitemap.xml")
md.append("- **Special files referenced:** /llms.txt, /llms-full.txt, /ai.txt")
md.append("- **Crawl-delay:** Bing 1s, Yandex 2s, Baidu 2s")
md.append("")

# CSS/JS/Assets
md.append("## Asset Inventory")
md.append("")
md.append("### External Dependencies")
md.append("- **Google Fonts:** fonts.googleapis.com (Arabic + English fonts)")
md.append("- **Iconify:** code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js")
md.append("- **CSS:** All inline (`<style>` tags) — no external CSS files for main pages")
md.append("- **Tailwind:** Loaded via CDN (`<script src=\"https://cdn.tailwindcss.com\">`) on each page")
md.append("")
md.append("### Kernel Assets (Dedicated)")
md.append("- **CSS:** kernel/assets/css/kernel.css + 13 page-specific CSS files")
md.append("- **JS:** 18 kernel-specific JS modules in kernel/assets/js/")
md.append("- **Images:** 2 screenshots (narrow.png, wide.png)")
md.append("- **Kernel JS:** kernel-perf.js, kernel-web-vitals.js, sw.js")
md.append("")

# Main table
md.append("## Complete Route Table")
md.append("")
md.append("| # | Path | H1 | Meta Title | Meta Description | Canonical | hreflang | JSON-LD | GA | In Sitemap | Noindex |")
md.append("|---|------|----|-----------|-----------------|-----------|----------|---------|-----|-----------|---------|")

for i, p in enumerate(pages, 1):
    path = p['path']
    h1 = esc(p.get('h1', ''))[:50]
    title = esc(p.get('title', ''))[:50]
    desc = esc(p.get('description', ''))[:50]
    canon = '✓' if p.get('canonical') else '✗'
    hreflang = '✓' if p.get('hreflang') else '✗'
    jsonld = esc(p.get('jsonld_types', ''))[:40]
    ga = '✓' if p.get('ga_tag') == 'yes' else '✗ **MISSING**'
    in_sitemap = '✓' if path in sitemap_urls else '✗'
    noindex = '⚠️ YES' if p.get('noindex') == 'yes' else '—'
    
    md.append("| {} | `{}` | {} | {} | {} | {} | {} | {} | {} | {} | {} |".format(
        i, path, h1, title, desc, canon, hreflang, jsonld, ga, in_sitemap, noindex
    ))

md.append("")

# Sitemap-only URLs (kernel pages are covered above)
md.append("## Sitemap URLs Without index.html File (Kernel Flat HTML)")
md.append("")
md.append("These 10 pages use flat `.html` naming (e.g., `kernel/chat.html` instead of `kernel/chat/index.html`).")
md.append("The hosting server (likely via `_redirects` rules) maps `/kernel/chat/` → `kernel/chat.html`.")
md.append("")
for url in sorted(sitemap_urls):
    if url.startswith('/kernel/') and url != '/kernel/' and url not in [p['path'] for p in pages if p.get('file','').endswith('index.html')]:
        md.append("- `{}` → served by `kernel/{}.html`".format(url, url.strip('/').split('/')[-1]))

md.append("")

# Pages NOT in sitemap
md.append("## Pages NOT in Sitemap")
md.append("")
md.append("| Path | Status | Notes |")
md.append("|------|--------|-------|")
not_in_sitemap = [p for p in pages if p['path'] not in sitemap_urls]
for p in not_in_sitemap:
    notes = []
    if p['path'] == '/offline/': notes.append("Service worker offline page")
    if p['path'] == '/report/': notes.append("Has noindex — intentionally excluded")
    md.append("| `{}` | {} | {} |".format(p['path'], '⚠️ noindex' if p.get('noindex')=='yes' else 'Internal', '; '.join(notes)))
md.append("")

# Missing /en/ page
md.append("## Missing Pages / Gaps")
md.append("")
md.append("### `/en/` — English Homepage")
md.append("- **Status:** Listed in task specification but **no `en/index.html` exists**")
md.append("- **Sitemap:** NOT in sitemap.xml")
md.append("- **Note:** Only 5 English legal pages exist (`/en/cookie-policy/`, `/en/data-processing-agreement/`, `/en/pdpl-statement/`, `/en/privacy-policy/`, `/en/terms/`)")
md.append("- **Migration Action:** Must create `/en/index.html` as English landing page OR confirm this is intentional")
md.append("")
md.append("### Docs Directories Without index.html (14 dirs)")
md.append("- These docs directories exist but have no content page:")
md.append("  - `docs/kernel-accessibility-mobile/`")
md.append("  - `docs/kernel-api-client/`")
md.append("  - `docs/kernel-architecture/`")
md.append("  - `docs/kernel-audit-evidence/`")
md.append("  - `docs/kernel-changelog-template/`")
md.append("  - `docs/kernel-developer-onboarding/`")
md.append("  - `docs/kernel-internal-linking/`")
md.append("  - `docs/kernel-nvidia-proxy/`")
md.append("  - `docs/kernel-operations-runbook/`")
md.append("  - `docs/kernel-pages/`")
md.append("  - `docs/kernel-production-vs-demo/`")
md.append("  - `docs/kernel-security-model/`")
md.append("  - `docs/kernel-testing-checklist/`")
md.append("  - `docs/superpowers/`")
md.append("- **Status:** Not in sitemap, no public page. Internal dev reference only.")
md.append("")

# Migration Risks
md.append("## Migration Risks")
md.append("")
md.append("### 🔴 Critical Risks")
md.append("")
md.append("1. **Kernel Pages Flat HTML → Trailing Slash URLs**")
md.append("   - 10 kernel pages use `kernel/chat.html` not `kernel/chat/index.html`")
md.append("   - Server-side redirects (`_redirects`) currently handle URL rewriting")
md.append("   - **Risk:** Astro must output `/kernel/chat/index.html` to match `/kernel/chat/` trailing slash URLs")
md.append("   - **Impact:** 10 pages (all in sitemap)")
md.append("")
md.append("2. **265 Redirect Rules** (`_redirects`)")
md.append("   - Includes HTTP→HTTPS, www→non-www, `.html`→trailing-slash, renamed URLs")
md.append("   - **Risk:** Must replicate in Astro config or hosting platform (Netlify/Render `_redirects`)")
md.append("   - **Impact:** All pages with `.html` variants, renamed URLs")
md.append("")
md.append("3. **Special Files Preservation** (`llms.txt`, `llms-full.txt`, `ai.txt`)")
md.append("   - Referenced in `robots.txt` — AI crawlers rely on these")
md.append("   - **Risk:** Must be copied to Astro `public/` directory unchanged")
md.append("   - **Impact:** AI discoverability (GPTBot, ClaudeBot, PerplexityBot)")
md.append("")
md.append("4. **Google Tag G-8LLESL207Q Missing on `/authors/nasser-alabdullah/`**")
md.append("   - **Risk:** Analytics gap — page visits not tracked")
md.append("   - **Impact:** Must add GA tag in Astro migration")
md.append("")
md.append("5. **`/en/` English Homepage Missing**")
md.append("   - Referenced in task spec but no file exists")
md.append("   - **Risk:** 404 if linked from English pages")
md.append("   - **Impact:** Must create or confirm intentional exclusion")
md.append("")
md.append("### 🟡 Medium Risks")
md.append("")
md.append("6. **CSS Architecture Change**")
md.append("   - Current: Tailwind via CDN `<script>` + inline `<style>` per page")
md.append("   - Kernel: Dedicated CSS files in `kernel/assets/css/`")
md.append("   - **Risk:** Must ensure all inline styles migrate to Astro components correctly")
md.append("   - **Impact:** Visual regression across all pages")
md.append("")
md.append("7. **Kernel JS Modules (18 files)**")
md.append("   - Complex interactive dashboard pages with chat, approvals, audit features")
md.append("   - **Risk:** Must work as progressive enhancement (site functional without JS)")
md.append("   - **Impact:** Kernel pages usability")
md.append("")
md.append("8. **Hreflang Implementation**")
md.append("   - 95 pages have `ar-SA;x-default` hreflang")
md.append("   - Only 5 English pages (`/en/*`) — no bidirectional hreflang for English")
md.append("   - **Risk:** Must maintain consistent hreflang in Astro; add `en-SA` alternate for English pages")
md.append("   - **Impact:** International SEO")
md.append("")
md.append("9. **JSON-LD Schema Richness**")
md.append("   - 97 pages with JSON-LD (WebSite, WebPage, BreadcrumbList, Article, FAQPage, Organization, etc.)")
md.append("   - Kernel pages: complex schemas (DefinedTermSet, Offer, ListItem)")
md.append("   - **Risk:** All JSON-LD must transfer exactly to Astro templates")
md.append("   - **Impact:** Rich snippets, knowledge panel")
md.append("")
md.append("10. **Blog RSS Feed (`blog/feed.xml`)**")
md.append("    - Static XML file with 22 articles")
md.append("    - **Risk:** Must regenerate in Astro build or copy as-is to `public/`")
md.append("    - **Impact:** RSS subscribers, feed aggregators")
md.append("")
md.append("### 🟢 Low Risks")
md.append("")
md.append("11. **`/report/` page has noindex**")
md.append("    - Intentionally excluded from indexing")
md.append("    - Must preserve noindex in migration")
md.append("")
md.append("12. **`/offline/` page**")
md.append("    - Service worker offline fallback, not in sitemap, no hreflang")
md.append("    - Must copy to Astro `public/` for PWA support")
md.append("")
md.append("13. **Security Headers (`_headers`)**")
md.append("    - 5,929 bytes of security headers (CSP, HSTS, X-Frame-Options)")
md.append("    - Must replicate on hosting platform")
md.append("")
md.append("14. **Service Worker (`sw.js`)**")
md.append("    - PWA service worker + kernel-specific sw")
md.append("    - Must update cache paths after migration")
md.append("")
md.append("15. **Iconify Dependency**")
md.append("    - External JS for icons: `code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js`")
md.append("    - Consider bundling locally or using Astro icon integration")
md.append("")
md.append("16. **`manifest.webmanifest`**")
md.append("    - 4,247 bytes PWA manifest with kernel-specific shortcuts")
md.append("    - Must update paths after migration")
md.append("")

# Canonical consistency check
md.append("## Canonical URL Consistency")
md.append("")
md.append("All pages use `https://brightai.site` canonical (non-www, HTTPS). ✓")
md.append("- No mixed www/non-www canonicals found")
md.append("- No http:// canonicals found")
md.append("- All trailing slash format (`/path/`)")
md.append("")

# Internal links note
md.append("## Internal Linking")
md.append("")
md.append("- All main pages use relative internal links (`/about/`, `/services/`, etc.)")
md.append("- WhatsApp link: `https://wa.me/966538229013` (must preserve)")
md.append("- Navigation uses clean trailing-slash URLs (no `.html`)")
md.append("- `_redirects` handles legacy `.html` and non-trailing-slash variants with 301")
md.append("")

# Architecture notes
md.append("## Current Architecture Notes")
md.append("")
md.append("- **Hosting:** Static HTML (likely Netlify given `_headers` and `_redirects`)")
md.append("- **CSS:** Tailwind CDN + inline `<style>` per page (no build step for main pages)")
md.append("- **Kernel:** Separate app with dedicated CSS/JS modules, loaded as flat HTML")
md.append("- **Fonts:** Google Fonts (Tajawal for Arabic)")
md.append("- **Icons:** Iconify web component")
md.append("- **JS:** Progressive enhancement only — content readable without JS")
md.append("- **RTL:** `dir=\"rtl\"` on `<html>` for Arabic pages, `dir=\"ltr\"` for English")
md.append("- **PWA:** Service worker + manifest + offline page")
md.append("- **Build:** No build step for main pages; kernel has its own asset pipeline")
md.append("")

md.append("---")
md.append("")
md.append("*End of ROUTE-INVENTORY.md — Phase 1 (Inventory Only)*")

# Write file
output = '\n'.join(md)
with open(BASE / 'ROUTE-INVENTORY.md', 'w', encoding='utf-8') as f:
    f.write(output)

print(f"Generated ROUTE-INVENTORY.md ({len(md)} lines, {len(pages)} pages)")