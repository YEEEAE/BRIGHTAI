#!/usr/bin/env python3
"""
Google Search Console helper for BrightAI.

This script does not use Google's Indexing API for normal site pages because
that API is limited to JobPosting and BroadcastEvent pages. For regular static
HTML pages, the supported automation path is:
  1. Submit sitemap.xml to Search Console.
  2. Optionally inspect URLs with the URL Inspection API.

Authentication options:
  - GOOGLE_ACCESS_TOKEN or GSC_ACCESS_TOKEN environment variable.
  - --access-token TOKEN
  - --token-command "gcloud auth print-access-token"
"""

import argparse
import csv
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


HOST = "brightai.site"
DEFAULT_SITE_URL = f"https://{HOST}/"
DEFAULT_SITEMAP_URL = f"https://{HOST}/sitemap.xml"
SCRIPT_DIR = Path(__file__).resolve().parent
URL_FILE = SCRIPT_DIR / "indexable-pages-final.txt"
DEFAULT_REPORT_FILE = SCRIPT_DIR / "google-url-inspection-report.csv"

WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters"


def is_canonical_url(url):
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


def load_urls(path):
    if not path.exists():
        raise SystemExit(f"الملف غير موجود: {path}")

    urls = []
    rejected = []
    seen = set()

    for line in path.read_text(encoding="utf-8").splitlines():
        url = line.strip()
        if not url:
            continue
        if not is_canonical_url(url):
            rejected.append(url)
            continue
        if url not in seen:
            seen.add(url)
            urls.append(url)

    if rejected:
        print("تم العثور على روابط غير قانونية. أصلح القائمة قبل استخدام سكربت جوجل:")
        for url in rejected:
            print(f"  - {url}")
        raise SystemExit(1)

    if not urls:
        raise SystemExit("لم يتم العثور على روابط قانونية في الملف.")

    return urls


def get_access_token(args):
    if args.access_token:
        return args.access_token.strip()

    env_token = os.environ.get("GSC_ACCESS_TOKEN") or os.environ.get("GOOGLE_ACCESS_TOKEN")
    if env_token:
        return env_token.strip()

    if args.token_command:
        try:
            output = subprocess.check_output(
                args.token_command,
                shell=True,
                text=True,
                stderr=subprocess.STDOUT,
                timeout=30,
            )
        except subprocess.CalledProcessError as exc:
            raise SystemExit(f"فشل أمر الحصول على رمز الوصول:\n{exc.output}") from exc
        except subprocess.TimeoutExpired as exc:
            raise SystemExit("انتهت مهلة أمر الحصول على رمز الوصول.") from exc

        token = output.strip().splitlines()[-1].strip() if output.strip() else ""
        if token:
            return token

    raise SystemExit(
        "لم يتم توفير رمز وصول لجوجل.\n"
        "استخدم أحد الخيارات التالية:\n"
        "  GSC_ACCESS_TOKEN=... python3 reports/google_search_console_submit.py --submit-sitemap\n"
        "  python3 reports/google_search_console_submit.py --access-token TOKEN --submit-sitemap\n"
        "  python3 reports/google_search_console_submit.py --token-command \"gcloud auth print-access-token\" --submit-sitemap\n\n"
        f"يجب أن يكون الرمز مخولاً بنطاق: {WEBMASTERS_SCOPE}"
    )


def request_json(method, url, token, body=None):
    data = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return response.status, {}
            return response.status, json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"error": raw}
        return exc.code, parsed
    except urllib.error.URLError as exc:
        return None, {"error": str(exc.reason)}


def submit_sitemap(site_url, sitemap_url, token, dry_run):
    encoded_site = urllib.parse.quote(site_url, safe="")
    encoded_sitemap = urllib.parse.quote(sitemap_url, safe="")
    endpoint = f"https://www.googleapis.com/webmasters/v3/sites/{encoded_site}/sitemaps/{encoded_sitemap}"

    if dry_run:
        print("وضع التحقق فقط: سيتم إرسال خريطة الموقع إلى:")
        print(f"  {endpoint}")
        return True

    status, response = request_json("PUT", endpoint, token)
    if status in (200, 204):
        print("تم إرسال خريطة الموقع إلى Google Search Console بنجاح.")
        return True

    print(f"فشل إرسال خريطة الموقع. الحالة: {status}")
    print(json.dumps(response, ensure_ascii=False, indent=2))
    return False


def inspect_url(site_url, inspection_url, token, language_code):
    endpoint = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
    body = {
        "inspectionUrl": inspection_url,
        "siteUrl": site_url,
    }
    if language_code:
        body["languageCode"] = language_code

    status, response = request_json("POST", endpoint, token, body=body)
    return status, response


def summarize_inspection(url, status, response):
    if status != 200:
        return {
            "url": url,
            "http_status": status or "",
            "verdict": "",
            "coverage_state": "",
            "robots_txt_state": "",
            "indexing_state": "",
            "google_canonical": "",
            "user_canonical": "",
            "last_crawl_time": "",
            "error": json.dumps(response, ensure_ascii=False),
        }

    result = response.get("inspectionResult", {})
    index_status = result.get("indexStatusResult", {})
    return {
        "url": url,
        "http_status": status,
        "verdict": index_status.get("verdict", ""),
        "coverage_state": index_status.get("coverageState", ""),
        "robots_txt_state": index_status.get("robotsTxtState", ""),
        "indexing_state": index_status.get("indexingState", ""),
        "google_canonical": index_status.get("googleCanonical", ""),
        "user_canonical": index_status.get("userCanonical", ""),
        "last_crawl_time": index_status.get("lastCrawlTime", ""),
        "error": "",
    }


def write_inspection_report(rows, path):
    fields = [
        "url",
        "http_status",
        "verdict",
        "coverage_state",
        "robots_txt_state",
        "indexing_state",
        "google_canonical",
        "user_canonical",
        "last_crawl_time",
        "error",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def parse_args():
    parser = argparse.ArgumentParser(
        description="إرسال sitemap.xml إلى Google Search Console وفحص روابط BrightAI اختيارياً."
    )
    parser.add_argument("--url-file", default=str(URL_FILE), help="ملف الروابط القانونية النهائي.")
    parser.add_argument("--site-url", default=DEFAULT_SITE_URL, help="خاصية Search Console كما هي معرفة في الحساب.")
    parser.add_argument("--sitemap-url", default=DEFAULT_SITEMAP_URL, help="رابط sitemap.xml المنشور.")
    parser.add_argument("--submit-sitemap", action="store_true", help="إرسال خريطة الموقع إلى Google Search Console.")
    parser.add_argument("--inspect", action="store_true", help="فحص الروابط عبر URL Inspection API.")
    parser.add_argument("--limit", type=int, default=0, help="حد أقصى لعدد الروابط المفحوصة. صفر يعني الكل.")
    parser.add_argument("--delay", type=float, default=0.2, help="تأخير بالثواني بين طلبات الفحص.")
    parser.add_argument("--language-code", default="ar-SA", help="رمز اللغة المستخدم في طلب الفحص.")
    parser.add_argument("--report-file", default=str(DEFAULT_REPORT_FILE), help="مسار تقرير فحص الروابط.")
    parser.add_argument("--access-token", default="", help="رمز وصول OAuth لجوجل.")
    parser.add_argument("--token-command", default="", help="أمر يرجع رمز الوصول مثل gcloud auth print-access-token.")
    parser.add_argument("--dry-run", action="store_true", help="تحقق فقط بدون إرسال طلبات إلى جوجل.")
    return parser.parse_args()


def main():
    args = parse_args()
    url_file = Path(args.url_file).resolve()
    report_file = Path(args.report_file).resolve()

    print("=" * 72)
    print("  Google Search Console - إرسال خريطة الموقع وفحص الروابط")
    print("=" * 72)
    print(f"  التاريخ: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  خاصية Search Console: {args.site_url}")
    print(f"  خريطة الموقع: {args.sitemap_url}")
    print(f"  ملف الروابط: {url_file}")

    urls = load_urls(url_file)
    print(f"  الروابط القانونية الجاهزة: {len(urls)}")

    if not args.submit_sitemap and not args.inspect:
        print()
        print("لم يتم تحديد عملية. استخدم --submit-sitemap أو --inspect.")
        print("مثال تحقق بدون إرسال:")
        print("  python3 reports/google_search_console_submit.py --submit-sitemap --dry-run")
        return

    token = "" if args.dry_run else get_access_token(args)

    if args.submit_sitemap:
        print()
        print("إرسال خريطة الموقع:")
        submit_sitemap(args.site_url, args.sitemap_url, token, args.dry_run)

    if args.inspect:
        selected_urls = urls[: args.limit] if args.limit and args.limit > 0 else urls
        print()
        print(f"فحص الروابط عبر URL Inspection API: {len(selected_urls)} رابط")

        if args.dry_run:
            print("وضع التحقق فقط: لن يتم فحص الروابط فعلياً.")
            print(f"  أول رابط: {selected_urls[0]}")
            print(f"  آخر رابط: {selected_urls[-1]}")
            return

        rows = []
        for index, url in enumerate(selected_urls, start=1):
            print(f"  [{index}/{len(selected_urls)}] {url}")
            status, response = inspect_url(args.site_url, url, token, args.language_code)
            rows.append(summarize_inspection(url, status, response))
            if args.delay > 0 and index < len(selected_urls):
                time.sleep(args.delay)

        write_inspection_report(rows, report_file)
        print()
        print(f"تم حفظ تقرير الفحص: {report_file}")


if __name__ == "__main__":
    main()
