#!/usr/bin/env python3
"""SEMrush phase 4: per-page long-tail verification (chunked batches)"""
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
    print(body[:3000])
    print()
    time.sleep(0.4)

candidates = [
    # PDPL cluster
    "لائحة نظام حماية البيانات الشخصية","عقوبات نظام حماية البيانات الشخصية",
    "شرح نظام حماية البيانات الشخصية","نظام حماية البيانات الشخصية pdf",
    "مخالفات نظام حماية البيانات الشخصية","اللائحة التنفيذية لنظام حماية البيانات الشخصية",
    "حماية البيانات الشخصية","التسجيل في المنصة الوطنية لحوكمة البيانات",
    # Cities / commercial
    "شركة ذكاء اصطناعي في الرياض","الذكاء الاصطناعي في الرياض","شركات الذكاء الاصطناعي في جدة",
    "شركة برمجة في الرياض","شركات التقنية في الرياض",
    # Sectors
    "الذكاء الاصطناعي في المستشفيات","الذكاء الاصطناعي في القطاع الصحي",
    "الذكاء الاصطناعي في التوظيف","الذكاء الاصطناعي في الموارد البشرية",
    "الذكاء الاصطناعي في القطاع الحكومي","الذكاء الاصطناعي في المصانع",
    # Governance / risk
    "ادارة مخاطر الذكاء الاصطناعي","تنظيم الذكاء الاصطناعي","قانون الذكاء الاصطناعي",
    "الذكاء الاصطناعي المسؤول","سياسة الذكاء الاصطناعي","اخلاقيات الذكاء الاصطناعي في السعودية",
    # Standards / EN
    "iso 42001 saudi arabia","ai management system","iso 27001","ecc compliance",
    "ecc controls","cybersecurity companies in saudi arabia","data protection law saudi arabia",
    "pdpl fines","pdpl registration",
    # Brand-adjacent / players
    "هيوماين","scai","علام","allam ai",
    # Chatbot / genAI
    "شات بوت عربي","روبوتات الدردشة","الذكاء الاصطناعي التوليدي المحادثات",
    "ذكاء اصطناعي عربي","chatgpt بالعربي",
]
for i in range(0, len(candidates), 8):
    chunk = candidates[i:i+8]
    call({"type": "phrase_these", "phrase": ";".join(chunk),
          "export_columns": "Ph,Nq,Cp,Co,Kd"}, f"08_verify_{i//8}")

print("PHASE 4 DONE")
