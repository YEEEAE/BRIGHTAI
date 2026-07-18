#!/usr/bin/env python3
"""Batch SEO metadata extractor for ROUTE-INVENTORY.md"""

import os
import re
import json
import html
from pathlib import Path

BASE = Path("/Users/yzydalshmry/Desktop/BRIGHTAI")

def extract_seo(filepath):
    """Extract SEO metadata from an HTML file."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception as e:
        return {"error": str(e)}

    # Title
    title_match = re.search(r'<title[^>]*>(.*?)</title>', content, re.DOTALL)
    title = title_match.group(1).strip() if title_match else ""

    # Meta description
    desc_match = re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
    if not desc_match:
        desc_match = re.search(r'<meta\s+[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', content, re.IGNORECASE)
    description = desc_match.group(1).strip() if desc_match else ""

    # Canonical
    canon_match = re.search(r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\'](.*?)["\']', content, re.IGNORECASE)
    if not canon_match:
        canon_match = re.search(r'<link\s+[^>]*href=["\'](.*?)["\'][^>]*rel=["\']canonical["\']', content, re.IGNORECASE)
    canonical = canon_match.group(1).strip() if canon_match else ""

    # H1
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    if h1_match:
        h1_raw = h1_match.group(1)
        h1_text = re.sub(r'<[^>]+>', '', h1_raw).strip()
        h1_text = re.sub(r'\s+', ' ', h1_text)[:150]
    else:
        h1_text = ""

    # OG title
    og_title_match = re.search(r'<meta\s+[^>]*property=["\']og:title["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
    if not og_title_match:
        og_title_match = re.search(r'<meta\s+[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:title["\']', content, re.IGNORECASE)
    og_title = og_title_match.group(1).strip() if og_title_match else ""

    # OG description
    og_desc_match = re.search(r'<meta\s+[^>]*property=["\']og:description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
    if not og_desc_match:
        og_desc_match = re.search(r'<meta\s+[^>]*content=["\'](.*?)["\'][^>]*property=["\']og:description["\']', content, re.IGNORECASE)
    og_desc = og_desc_match.group(1).strip() if og_desc_match else ""

    # Hreflang
    hreflang_matches = re.findall(r'<link\s+[^>]*hreflang=["\'](.*?)["\']', content, re.IGNORECASE)
    hreflang = ";".join(hreflang_matches)

    # JSON-LD
    jsonld_blocks = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', content, re.DOTALL)
    jsonld_count = len(jsonld_blocks)
    jsonld_types = []
    for block in jsonld_blocks:
        types = re.findall(r'"@type"\s*:\s*"([^"]+)"', block)
        jsonld_types.extend(types)
    jsonld_types_str = ";".join(jsonld_types)

    # GA tag
    ga_present = "G-8LLESL207Q" in content

    # Noindex
    noindex = bool(re.search(r'noindex', content, re.IGNORECASE))

    # Internal links
    all_links = re.findall(r'href=["\'](/[^"\']*)["\']', content)
    internal_links = list(set([l for l in all_links if l.startswith('/') and not l.startswith('//')]))

    # CSS files
    css_files = re.findall(r'href=["\']([^"\']*\.css[^"\']*)["\']', content)

    # JS files
    js_files = re.findall(r'src=["\']([^"\']*\.js[^"\']*)["\']', content)

    # Images
    img_files = re.findall(r'src=["\']([^"\']*\.(png|jpg|jpeg|gif|webp|svg|avif)[^"\']*)["\']', content, re.IGNORECASE)

    return {
        "h1": h1_text,
        "title": title,
        "description": description[:200],
        "canonical": canonical,
        "og_title": og_title[:120],
        "og_description": og_desc[:120],
        "hreflang": hreflang,
        "jsonld_count": jsonld_count,
        "jsonld_types": jsonld_types_str,
        "ga_tag": "yes" if ga_present else "no",
        "noindex": "yes" if noindex else "no",
        "internal_links_count": len(internal_links),
        "css_count": len(css_files),
        "js_count": len(js_files),
        "img_count": len(img_files),
    }


def main():
    # Find all index.html files
    pages = []
    for root, dirs, files in os.walk(BASE):
        # Skip unwanted dirs
        skip = ['frontend', 'node_modules', 'components', '.git']
        dirs[:] = [d for d in dirs if d not in skip and not d.startswith('.')]
        if 'index.html' in files:
            filepath = os.path.join(root, 'index.html')
            relpath = os.path.relpath(filepath, BASE)
            # Convert to URL path
            urlpath = '/' + relpath.replace('index.html', '').rstrip('/')
            if urlpath == '/.':
                urlpath = '/'
            if urlpath != '/' and not urlpath.endswith('/'):
                urlpath += '/'

            seo = extract_seo(filepath)
            seo['path'] = urlpath
            seo['file'] = relpath
            pages.append(seo)

    pages.sort(key=lambda x: x['path'])

    # Write JSON
    with open(BASE / 'scripts' / 'seo-data.json', 'w', encoding='utf-8') as f:
        json.dump(pages, f, ensure_ascii=False, indent=2)

    print(f"Extracted {len(pages)} pages")

    # Print summary
    no_title = [p for p in pages if not p['title']]
    no_desc = [p for p in pages if not p['description']]
    no_canonical = [p for p in pages if not p['canonical']]
    no_h1 = [p for p in pages if not p['h1']]
    no_ga = [p for p in pages if p['ga_tag'] == 'no']
    has_noindex = [p for p in pages if p['noindex'] == 'yes']
    has_jsonld = [p for p in pages if p['jsonld_count'] > 0]
    has_hreflang = [p for p in pages if p['hreflang']]

    print(f"\nMissing title: {len(no_title)}")
    for p in no_title: print(f"  {p['path']}")
    print(f"\nMissing description: {len(no_desc)}")
    for p in no_desc: print(f"  {p['path']}")
    print(f"\nMissing canonical: {len(no_canonical)}")
    for p in no_canonical: print(f"  {p['path']}")
    print(f"\nMissing H1: {len(no_h1)}")
    for p in no_h1: print(f"  {p['path']}")
    print(f"\nMissing GA tag: {len(no_ga)}")
    for p in no_ga: print(f"  {p['path']}")
    print(f"\nHas noindex: {len(has_noindex)}")
    for p in has_noindex: print(f"  {p['path']}")
    print(f"\nHas JSON-LD: {len(has_jsonld)}")
    print(f"Has hreflang: {len(has_hreflang)}")


if __name__ == '__main__':
    main()