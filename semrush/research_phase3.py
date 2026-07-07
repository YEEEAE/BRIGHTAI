#!/usr/bin/env python3
"""SEMrush phase 3: related expansion + broad match + questions + SERP competitors"""
import os, time, urllib.parse, urllib.request

KEY = os.environ["API_KEY"].split(":", 1)[1].strip()
BASE = "https://api.semrush.com/"
OUT = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(OUT, exist_ok=True)

def call(params, name):
    qs = urllib.parse.urlencode({**params, "key": KEY, "database": "sa"})
    try:
        with urllib.request.urlopen(BASE + "?" + qs, timeout=30) as r:
            body = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = "ERROR HTTP %s :: %s" % (e.code, e.read().decode("utf-8", "ignore")[:200])
    with open(f"{OUT}/{name}.csv", "w") as f:
        f.write(body)
    print(f"=== {name} ===")
    print(body[:3500])
    print()
    time.sleep(0.4)

# ---- Related keywords (Keyword Magic equivalent) ----
related_seeds = {
    "sdaia": "rel_sdaia",
    "nca ecc": "rel_nca_ecc",
    "نظام حماية البيانات الشخصية": "rel_pdpl_ar",
    "حوكمة الذكاء الاصطناعي": "rel_gov_ar",
    "الذكاء الاصطناعي في السعودية": "rel_ai_saudi_ar",
    "شركات الذكاء الاصطناعي في السعودية": "rel_companies_ar",
    "ai governance": "rel_ai_gov_en",
    "حوكمة البيانات": "rel_data_gov_ar",
}
for seed, name in related_seeds.items():
    call({"type": "phrase_related", "phrase": seed, "display_limit": 15,
          "display_sort": "nq_desc",
          "export_columns": "Ph,Nq,Cp,Co,Kd"}, f"04_{name}")

# ---- Broad match for regulatory codes ----
for seed, name in {"pdpl": "bm_pdpl", "42001": "bm_42001", "سدايا": "bm_sdaia_ar",
                   "الأمن السيبراني ضوابط": "bm_ecc_ar"}.items():
    call({"type": "phrase_fullsearch", "phrase": seed, "display_limit": 15,
          "display_sort": "nq_desc",
          "export_columns": "Ph,Nq,Cp,Co,Kd"}, f"05_{name}")

# ---- Question keywords (AEO) ----
for seed, name in {"الذكاء الاصطناعي": "q_ai_ar", "sdaia": "q_sdaia",
                   "حماية البيانات": "q_pdpl_ar"}.items():
    call({"type": "phrase_questions", "phrase": seed, "display_limit": 10,
          "display_sort": "nq_desc",
          "export_columns": "Ph,Nq,Cp,Kd"}, f"06_{name}")

# ---- SERP competitors on money keywords ----
for seed, name in {"حوكمة الذكاء الاصطناعي": "serp_gov_ar",
                   "نظام حماية البيانات الشخصية": "serp_pdpl_ar",
                   "ai governance": "serp_ai_gov_en",
                   "شركات الذكاء الاصطناعي في السعودية": "serp_companies_ar"}.items():
    call({"type": "phrase_organic", "phrase": seed, "display_limit": 10,
          "export_columns": "Dn,Ur"}, f"07_{name}")

print("PHASE 3 DONE")
