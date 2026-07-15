#!/usr/bin/env python3
"""SEMrush keyword research - Saudi Arabia database (sa) - BrightAI - Phase 1"""
import os, time, urllib.parse, urllib.request

KEY = os.environ["API_KEY"].split(":", 1)[1].strip()
BASE = "https://api.semrush.com/"
OUT = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(OUT, exist_ok=True)

def call(params, name):
    qs = urllib.parse.urlencode({**params, "key": KEY, "database": "sa"})
    url = BASE + "?" + qs
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            body = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = "ERROR HTTP %s :: %s" % (e.code, e.read().decode("utf-8", "ignore")[:200])
    with open(f"{OUT}/{name}.csv", "w") as f:
        f.write(body)
    print(f"=== {name} ===")
    print(body[:3500])
    print()
    time.sleep(0.4)

# ---- 1) Batch keyword overview: English seeds ----
en_seeds = [
    "ai governance","ai governance platform","ai governance framework","ai compliance",
    "ai risk management","ai risk assessment","responsible ai","ai security",
    "ai firewall","shadow ai","ai audit","ai audit trail",
    "pdpl","pdpl compliance","pdpl saudi arabia","personal data protection law saudi arabia",
    "sdaia","sdaia guidelines","generative ai guidelines saudi",
    "iso 42001","iso 42001 certification","iso/iec 42001",
    "nca ecc","essential cybersecurity controls","nca compliance","nca saudi arabia",
    "sama regulations","ai in banking","ai in healthcare","ai in government",
    "data governance","ndmo","artificial intelligence companies in saudi arabia",
    "ai company saudi arabia","ai company riyadh","ai ethics","ai regulation saudi arabia",
    "machine learning vs ai","ai chatbot arabic","enterprise ai",
]
call({"type": "phrase_these", "phrase": ";".join(en_seeds),
      "export_columns": "Ph,Nq,Cp,Co,Kd"}, "01_overview_en")

# ---- 2) Batch keyword overview: Arabic seeds ----
ar_seeds = [
    "حوكمة الذكاء الاصطناعي","الذكاء الاصطناعي في السعودية","نظام حماية البيانات الشخصية",
    "نظام حماية البيانات الشخصية السعودي","الامتثال لنظام حماية البيانات",
    "سدايا","الهيئة السعودية للبيانات والذكاء الاصطناعي","الذكاء الاصطناعي التوليدي",
    "ضوابط الأمن السيبراني الأساسية","الهيئة الوطنية للأمن السيبراني","الامن السيبراني",
    "ايزو 42001","شهادة ايزو 42001",
    "البنك المركزي السعودي","الذكاء الاصطناعي في البنوك","الذكاء الاصطناعي في القطاع المصرفي",
    "الذكاء الاصطناعي في الرعاية الصحية","الذكاء الاصطناعي في الطب","الذكاء الاصطناعي في التعليم",
    "الذكاء الاصطناعي في الحكومة","الذكاء الاصطناعي في الصناعة",
    "شركات الذكاء الاصطناعي في السعودية","شركة ذكاء اصطناعي","شركات الذكاء الاصطناعي",
    "مخاطر الذكاء الاصطناعي","أخلاقيات الذكاء الاصطناعي","حوكمة البيانات",
    "رؤية 2030","الذكاء الاصطناعي رؤية 2030","امن الذكاء الاصطناعي","أمان الذكاء الاصطناعي",
    "شات بوت","روبوت محادثة","التحول الرقمي","أتمتة العمليات",
    "تحليل البيانات الضخمة","البيانات الضخمة","الرؤية الحاسوبية",
    "الذكاء الاصطناعي في الموارد البشرية","الذكاء الاصطناعي في العقارات",
    "الذكاء الاصطناعي في التجارة الالكترونية","تكلفة الذكاء الاصطناعي",
    "نيوم","مدينة نيوم الذكية","ما هو الذكاء الاصطناعي","تطبيقات الذكاء الاصطناعي",
    "حلول الذكاء الاصطناعي","خدمات الذكاء الاصطناعي","الذكاء الاصطناعي للشركات",
]
call({"type": "phrase_these", "phrase": ";".join(ar_seeds),
      "export_columns": "Ph,Nq,Cp,Co,Kd"}, "02_overview_ar")

# ---- 3) Current rankings of brightai.site ----
call({"type": "domain_organic", "domain": "brightai.site", "display_limit": 50,
      "export_columns": "Ph,Po,Nq,Cp,Ur,Kd"}, "03_brightai_rankings")

print("PHASE 1 DONE")
