#!/usr/bin/env python3
"""
IndexNow Bulk URL Submission Script
Sends all indexable URLs from brightai.site to search engines via IndexNow protocol.
"""

import json
import urllib.request
import urllib.error
import os
import sys
from urllib.parse import urlparse
from datetime import datetime

# ─── Configuration ───────────────────────────────────────────────────────────
KEY = "06932e6c52144c44bb9ff0296e3da655"
HOST = "brightai.site"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"

# IndexNow-compatible search engines
SEARCH_ENGINES = [
    "api.indexnow.org",
    "www.bing.com",
    "yandex.com",
]

# Path to URL list (relative to this script)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
URL_FILE = os.path.join(SCRIPT_DIR, "indexable-pages-final.txt")


def is_canonical_url(url):
    """Return True only for final canonical BrightAI URLs."""
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != HOST:
        return False
    if parsed.query or parsed.fragment:
        return False
    if ".html" in parsed.path or "/frontend/pages/" in parsed.path:
        return False
    if parsed.path != "/" and not parsed.path.endswith("/"):
        return False
    return True


def load_urls(filepath):
    """Load, deduplicate, and validate canonical URLs from file."""
    if not os.path.exists(filepath):
        print(f"❌ الملف غير موجود: {filepath}")
        sys.exit(1)

    urls = []
    rejected = []
    seen = set()

    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            url = line.strip()
            if not url:
                continue
            if not is_canonical_url(url):
                rejected.append(url)
                continue
            if url in seen:
                continue
            seen.add(url)
            urls.append(url)

    if not urls:
        print("❌ لم يتم العثور على روابط صالحة في الملف")
        sys.exit(1)

    if rejected:
        print("❌ تم العثور على روابط غير قانونية ولن يتم الإرسال:")
        for url in rejected:
            print(f"  - {url}")
        sys.exit(1)

    return urls


def submit_to_engine(engine, urls):
    """Submit URL batch to a single IndexNow search engine endpoint."""
    endpoint = f"https://{engine}/indexnow"

    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }

    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.status
            return status, None
    except urllib.error.HTTPError as e:
        return e.code, e.reason
    except urllib.error.URLError as e:
        return None, str(e.reason)
    except Exception as e:
        return None, str(e)


def main():
    dry_run = "--dry-run" in sys.argv

    print("=" * 60)
    print("  IndexNow - إرسال الروابط لمحركات البحث")
    print("=" * 60)
    print(f"  التاريخ: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  الدومين: {HOST}")
    print(f"  المفتاح: {KEY}")
    print()

    # Load URLs
    urls = load_urls(URL_FILE)
    print(f"✅ تم تحميل {len(urls)} رابط قانوني من الملف")
    print(f"  ملف الروابط: {URL_FILE}")
    print()

    if dry_run:
        print("🧪 وضع التحقق فقط: لم يتم إرسال أي طلبات خارجية")
        print(f"  إجمالي الروابط الجاهزة للإرسال: {len(urls)}")
        print(f"  أول رابط: {urls[0]}")
        print(f"  آخر رابط: {urls[-1]}")
        return

    # Submit to each search engine
    results = {}
    for engine in SEARCH_ENGINES:
        print(f"📤 جاري الإرسال إلى: {engine} ...", end=" ", flush=True)
        status, error = submit_to_engine(engine, urls)

        if status == 200:
            print(f"✅ نجح (HTTP {status})")
            results[engine] = "✅ نجح"
        elif status == 202:
            print(f"✅ تم القبول (HTTP {status})")
            results[engine] = "✅ تم القبول"
        elif status is not None:
            print(f"⚠️ رمز الاستجابة: HTTP {status} - {error}")
            results[engine] = f"⚠️ HTTP {status}"
        else:
            print(f"❌ خطأ في الاتصال: {error}")
            results[engine] = f"❌ خطأ: {error}"

    # Summary
    print()
    print("=" * 60)
    print("  ملخص النتائج")
    print("=" * 60)
    for engine, result in results.items():
        print(f"  {engine:30s} → {result}")
    print()
    print(f"  إجمالي الروابط المرسلة: {len(urls)}")
    print("=" * 60)

    # HTTP response codes reference
    print()
    print("📋 مرجع رموز الاستجابة:")
    print("  200 = تم استلام الروابط بنجاح")
    print("  202 = تم قبول الطلب (قيد المعالجة)")
    print("  400 = طلب غير صالح")
    print("  403 = المفتاح غير صالح")
    print("  422 = روابط لا تنتمي للدومين")
    print("  429 = طلبات كثيرة جداً")


if __name__ == "__main__":
    main()
