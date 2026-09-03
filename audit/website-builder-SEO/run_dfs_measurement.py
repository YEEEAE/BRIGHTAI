#!/usr/bin/env python3
"""
Saudi keyword measurement via DataForSEO (location 2682).
Reads brightai-sa-keyword-research.csv, measures Arabic + English keywords,
probes SERP for priority-1 keywords, pulls long-tail suggestions, and
compares brightai.live against SERP competitors.
Credentials come from env: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD.
Raw responses are saved as dfs-*.json next to this script.
"""
import csv
import json
import os
import sys
import base64
import urllib.request
import urllib.error
from pathlib import Path

HERE = Path(__file__).parent
CSV_PATH = HERE / "brightai-sa-keyword-research.csv"
API_BASE = "https://api.dataforseo.com/v3"
LOCATION_SA = 2682

LOGIN = os.environ.get("DATAFORSEO_LOGIN")
PASSWORD = os.environ.get("DATAFORSEO_PASSWORD")
if not LOGIN or not PASSWORD:
    print("error: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not set", file=sys.stderr)
    sys.exit(1)


def api_post(endpoint: str, payload) -> dict:
    url = f"{API_BASE}/{endpoint}"
    auth = base64.b64encode(f"{LOGIN}:{PASSWORD}".encode()).decode()
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"error: HTTP {e.code} on {endpoint}: {e.read().decode()[:300]}", file=sys.stderr)
        return {"error": f"HTTP {e.code}"}
    except Exception as e:
        print(f"error: {e} on {endpoint}", file=sys.stderr)
        return {"error": str(e)}


def save_raw(name: str, data: dict):
    (HERE / f"dfs-{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))


def task_results(resp: dict):
    out = []
    for t in resp.get("tasks") or []:
        if t.get("status_code") == 20000 and t.get("result"):
            out.extend(t["result"])
    return out


def main():
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8")))
    print(f"csv_rows={len(rows)}")

    ar_kws = [r["keyword_ar"] for r in rows if r["language"] == "ar" and r["dataforseo_status_ar"] not in ("measured", "measured_zero", "measured_partial", "suggestion_measured")]
    en_kws = [r["keyword_en"] for r in rows if r["dataforseo_status_en"] != "measured"]
    # For ar-language rows the Arabic keyword is primary; include all ar rows' Arabic terms
    ar_kws = sorted({r["keyword_ar"] for r in rows if r["language"] == "ar"})
    # include en-primary rows' English terms
    en_kws = sorted({r["keyword_en"] for r in rows if r["language"] == "en"})
    print(f"ar_keywords={len(ar_kws)} en_keywords={len(en_kws)}")

    # 1) Google Ads search volume — Arabic
    sv_ar = api_post("keywords_data/google_ads/search_volume/live", [{
        "keywords": ar_kws,
        "location_code": LOCATION_SA,
        "language_code": "ar",
        "search_partners": False,
        "include_adult_keywords": False,
    }])
    save_raw("search-volume-ar", sv_ar)

    # 2) Google Ads search volume — English
    if en_kws:
        sv_en = api_post("keywords_data/google_ads/search_volume/live", [{
            "keywords": en_kws,
            "location_code": LOCATION_SA,
            "language_code": "en",
            "search_partners": False,
        }])
        save_raw("search-volume-en", sv_en)

    # 3) Labs keyword difficulty — Arabic batch (up to 1000)
    kd = api_post("dataforseo_labs/google/bulk_keyword_difficulty/live", [{
        "keywords": ar_kws + en_kws,
        "location_code": LOCATION_SA,
        "language_code": "ar",
    }])
    save_raw("keyword-difficulty", kd)

    # 4) SERP probes for priority-1 Arabic keywords (cap 8 to control cost)
    p1 = [r for r in rows if r["priority"] == "1" and r["language"] == "ar"]
    serp_targets = [r["keyword_ar"] for r in p1][:8]
    for i, kw in enumerate(serp_targets, 1):
        serp = api_post("serp/google/organic/live/regular", [{
            "keyword": kw,
            "location_code": LOCATION_SA,
            "language_code": "ar",
            "depth": 20,
        }])
        save_raw(f"serp-{i:02d}", serp)
        print(f"serp_done={i}/{len(serp_targets)}")

    # 5) Long-tail suggestions for core seeds
    seeds = ["حوكمة الذكاء الاصطناعي", "جدار حماية الذكاء الاصطناعي", "امتثال PDPL"]
    sugg_all = []
    for seed in seeds:
        s = api_post("dataforseo_labs/google/keyword_suggestions/live", [{
            "keyword": seed,
            "location_code": LOCATION_SA,
            "language_name": "Arabic",
            "limit": 30,
            "include_serp_info": True,
        }])
        sugg_all.append({"seed": seed, "response": s})
    save_raw("suggestions", {"tasks": [x["response"].get("tasks", []) for x in sugg_all]})

    # 6) Domain rank overview for brightai.live
    dro = api_post("dataforseo_labs/google/domain_rank_overview/live", [{
        "target": "brightai.live",
        "location_code": LOCATION_SA,
        "language_code": "ar",
    }])
    save_raw("domain-rank-brightai", dro)

    print("ALL_REQUESTS_DONE")


if __name__ == "__main__":
    main()
