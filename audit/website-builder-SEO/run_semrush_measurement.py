#!/usr/bin/env python3
"""
Saudi keyword measurement via Semrush Analytics API (database 'sa').
Credentials from env: SEMRUSH_API_KEY.
Raw responses saved as semrush-*.json next to this script.
Endpoints used:
  phrase_these      - keyword overview (volume, CPC, competition, KD) in batches of <=100
  domain_rank       - brightai.live visibility in SA
  domain_organic    - keywords brightai.live currently ranks for in SA
  domain_competitors- organic competitors in SA
  phrase_kqi        - long-tail phrase-match suggestions for core seeds
"""
import json
import os
import sys
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

HERE = Path(__file__).parent
BASE = "https://api.semrush.com/api/v3/"
DB = "sa"

KEY = os.environ.get("SEMRUSH_API_KEY")
if not KEY:
    print("error: SEMRUSH_API_KEY not set", file=sys.stderr)
    sys.exit(1)


def api_get(params: dict) -> dict:
    q = dict(params)
    q["key"] = KEY
    url = BASE + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"Accept": "text/plain, application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = resp.read().decode()
    except urllib.error.HTTPError as e:
        print(f"error: HTTP {e.code} {e.read().decode()[:300]}", file=sys.stderr)
        return {"ERROR": f"HTTP {e.code}"}
    except Exception as e:
        print(f"error: {e}", file=sys.stderr)
        return {"ERROR": str(e)}
    ctype = ""
    if body.lstrip().startswith(("ERROR", "<", "Keyword:")):
        # Semrush returns TSV or plain error text
        return {"TSV": body}
    try:
        return json.loads(body)
    except Exception:
        return {"TSV": body}


def save(name: str, data):
    (HERE / f"semrush-{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))


def tsv_rows(body: str):
    lines = [l for l in body.strip().splitlines() if l.strip()]
    if not lines:
        return []
    head = lines[0].split(";")
    out = []
    for l in lines[1:]:
        vals = l.split(";")
        out.append(dict(zip(head, vals)))
    return out


def main():
    # Keywords come from the CSV
    import csv
    rows = list(csv.DictReader((HERE / "brightai-sa-keyword-research.csv").open(encoding="utf-8")))
    ar_kws = sorted({r["keyword_ar"] for r in rows if r["language"] == "ar"})
    en_kws = sorted({r["keyword_en"] for r in rows})
    print(f"rows={len(rows)} ar={len(ar_kws)} all_en={len(en_kws)}")

    # 1) Keyword overview in batches of 50 (phrase_these, ';' separated)
    def overview_batch(name, kws):
        results = []
        for i in range(0, len(kws), 50):
            chunk = kws[i:i + 50]
            r = api_get({
                "type": "phrase_these",
                "phrase": ";".join(chunk),
                "database": DB,
                "export_columns": "Ph,Nq,Cp,Co,Nr,Kd",
            })
            save(f"{name}-{i//50:02d}", r)
            body = r.get("TSV") or ""
            if body.startswith("ERROR") or r.get("ERROR"):
                print(f"overview batch {i//50}: {body[:200]}")
                continue
            results.extend(tsv_rows(body))
            print(f"overview batch {i//50}: rows={len(results)}")
        return results

    ov_ar = overview_batch("overview-ar", ar_kws)
    ov_en = overview_batch("overview-en", en_kws)
    save("overview-ar-combined", ov_ar)
    save("overview-en-combined", ov_en)

    # 2) Domain rank for brightai.live in SA
    dr = api_get({
        "type": "domain_rank",
        "domain": "brightai.live",
        "database": DB,
        "export_columns": "Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
    })
    save("domain-rank", dr)
    print("domain_rank:", (dr.get("TSV", "") or dr.get("ERROR", ""))[:300])

    # 3) Current organic keywords for brightai.live (top 50)
    do = api_get({
        "type": "domain_organic",
        "domain": "brightai.live",
        "database": DB,
        "display_limit": 50,
        "export_columns": "Dn,Ur,Pn,Tr,Tc,Nq,Cp,Co,Ph",
    })
    save("domain-organic", do)
    print("domain_organic:", (do.get("TSV", "") or do.get("ERROR", ""))[:300])

    # 4) Organic competitors in SA
    dc = api_get({
        "type": "domain_competitors",
        "domain": "brightai.live",
        "database": DB,
        "display_limit": 15,
        "export_columns": "Dn,Cp,Or,Ot,Oc,Ad,At,Ac,Com",
    })
    save("domain-competitors", dc)
    print("domain_competitors:", (dc.get("TSV", "") or dc.get("ERROR", ""))[:300])

    # 5) Long-tail phrase match for core seeds
    seeds = ["حوكمة الذكاء الاصطناعي", "جدار حماية الذكاء الاصطناعي", "امتثال PDPL", "سجل تدقيق الذكاء الاصطناعي"]
    for i, seed in enumerate(seeds, 1):
        s = api_get({
            "type": "phrase_kqi",
            "phrase": seed,
            "database": DB,
            "display_limit": 30,
            "display_sort": "nq_desc",
            "display_filter": "+Nq>0",
            "export_columns": "Ph,Nq,Cp,Co,Nr,Kd",
        })
        save(f"longtail-{i:02d}", s)
        print(f"longtail {i}/{len(seeds)}:", (s.get("TSV", "") or s.get("ERROR", ""))[:200])

    print("ALL_REQUESTS_DONE")


if __name__ == "__main__":
    main()
