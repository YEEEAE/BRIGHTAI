#!/usr/bin/env python3
"""
reorder_products.py
يعيد ترتيب مصفوفة products في services/index.html
الترتيب المطلوب: أنظمة → أتمتة → وكيل → الباقي
"""

import re
import json
import sys
from pathlib import Path

REPO_ROOT = Path.cwd()
FILE_PATH = REPO_ROOT / "services" / "index.html"

# الترتيب المطلوب للتصنيفات
CATEGORY_ORDER = ["أنظمة", "أتمتة", "وكيل", "تحليل", "القطاع المالي", "استشارات"]

def category_sort_key(product):
    cat = product.get("category", "")
    try:
        return CATEGORY_ORDER.index(cat)
    except ValueError:
        return len(CATEGORY_ORDER)

def main():
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # العثور على سطر: const products = [...];
    pattern = r'(const products = )(\[.*?\]);'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print("❌ لم يتم العثور على مصفوفة products", file=sys.stderr)
        sys.exit(1)

    prefix = match.group(1)
    array_str = match.group(2)

    try:
        products = json.loads(array_str)
    except json.JSONDecodeError as e:
        print(f"❌ خطأ في تحليل JSON: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"✅ تم تحميل {len(products)} منتج")
    for p in products:
        print(f"   [{p.get('category','?')}] {p.get('name','?')}")

    # إعادة الترتيب
    products_sorted = sorted(products, key=category_sort_key)

    print("\n✅ الترتيب الجديد:")
    for p in products_sorted:
        print(f"   [{p.get('category','?')}] {p.get('name','?')}")

    # تحويل المصفوفة إلى JSON مضغوط (سطر واحد مثل الأصل)
    new_array_str = json.dumps(products_sorted, ensure_ascii=False, separators=(',', ':'))

    # استبدال في المحتوى
    new_content = content[:match.start()] + prefix + new_array_str + ";" + content[match.end():]

    with open(FILE_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"\n✅ تم تحديث الملف: {FILE_PATH}")

if __name__ == "__main__":
    main()
