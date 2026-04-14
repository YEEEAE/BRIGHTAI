# الملفات المقترحة للتحديث

## 1) `_headers`
- فصل HTML عن assets في `Cache-Control`
- تشديد `CSP` تدريجياً
- الإبقاء على security headers الأساسية

## 2) `_redirects`
- www -> non-www
- onrender -> brightai.site
- clean URLs
- noindex routes تبقى خارج الفهرسة

## 3) `render.yaml`
- Static Site remains
- buildCommand deterministic
- headers consistent with `_headers`
- cache strategy for static assets

## 4) `robots.txt`
- sitemap reference
- allow public assets
- disallow internal technical paths only

## 5) `sitemap.xml`
- public indexable URLs only
- lastmod updated
- hreflang alternates complete

## 6) JSON-LD
- Organization / LocalBusiness
- Service
- Article
- BreadcrumbList
- FAQPage where relevant
