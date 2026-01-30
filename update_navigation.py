#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكربت لتحديث شريط التنقل في جميع ملفات HTML
يقوم بـ:
1. استبدال AIaaS بصفحة المنتجات والاشتراكات في منسدلة "المنتجات والخدمات"
2. نقل AIaaS إلى منسدلة "الحلول ونماذج التجربة"
"""

import os
import re
from pathlib import Path

# أنماط البحث والاستبدال للـ Desktop Navigation

# 1. استبدال AIaaS بالمنتجات والاشتراكات في منسدلة المنتجات والخدمات
DESKTOP_PRODUCTS_OLD = r'''(<a href="[^"]*ai-agent" class="dropdown-item">\s*<iconify-icon icon="lucide:bot"></iconify-icon>\s*<div class="dropdown-item-content">\s*<span class="dropdown-title">)AI \(AIaaS\) للمنشآت(</span>\s*<span class="dropdown-desc">)حلول AIaaS المرنة(</span>\s*</div>\s*</a>)'''

DESKTOP_PRODUCTS_NEW = '''<a href="{base_path}frontend/pages/our-products" class="dropdown-item">
              <iconify-icon icon="lucide:package"></iconify-icon>
              <div class="dropdown-item-content">
                <span class="dropdown-title">المنتجات والاشتراكات</span>
                <span class="dropdown-desc">استكشف منتجاتنا وخطط الاشتراك</span>
              </div>
            </a>'''

# 2. إضافة AIaaS في بداية منسدلة الحلول ونماذج التجربة
# نبحث عن بداية dropdown-menu في قسم الحلول ونضيف AIaaS قبل أول عنصر
SOLUTIONS_PATTERN = r'(<li class="nav-item">\s*<a href="#" class="nav-link"[^>]*>\s*الحلول و نماذج التجربة.*?<div class="dropdown-menu">)'

AIAA_SOLUTIONS_ITEM = '''\n            <a href="{base_path}frontend/pages/ai-agent" class="dropdown-item">
              <iconify-icon icon="lucide:bot"></iconify-icon>
              <div class="dropdown-item-content">
                <span class="dropdown-title">AI (AIaaS) للمنشآت</span>
                <span class="dropdown-desc">حلول AIaaS المرنة</span>
              </div>
            </a>'''

# أنماط للـ Mobile Navigation

# 1. استبدال AIaaS بالمنتجات في منسدلة المنتجات والخدمات (Mobile)
MOBILE_PRODUCTS_OLD = r'(<a href="[^"]*ai-agent" class="dropdown-item">)AI \(AIaaS\) للمنشآت(</a>)'
MOBILE_PRODUCTS_NEW = r'<a href="{base_path}frontend/pages/our-products" class="dropdown-item">المنتجات والاشتراكات</a>'

# 2. إضافة AIaaS في منسدلة الحلول (Mobile)
MOBILE_SOLUTIONS_PATTERN = r'(<a href="#" class="mobile-nav-link"[^>]*>\s*الحلول و نماذج التجربة.*?<div class="mobile-dropdown">)'
MOBILE_AIAA_ITEM = '''\n          <a href="{base_path}frontend/pages/ai-agent" class="dropdown-item">AI (AIaaS) للمنشآت</a>'''

def get_base_path(file_path):
    """حساب المسار النسبي من الملف الحالي إلى الجذر"""
    depth = len(Path(file_path).relative_to('.').parts) - 1
    if depth <= 0:
        return ''
    return '../' * depth

def update_html_file(file_path):
    """تحديث ملف HTML واحد"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        base_path = get_base_path(file_path)
        
        # التحقق من وجود نمط AIaaS في الملف
        if 'AIaaS' not in content and 'AI (AIaaS) للمنشآت' not in content:
            return False, "لا يحتوي على نمط AIaaS"
        
        # ========== Desktop Navigation Updates ==========
        
        # 1. استبدال AIaaS بالمنتجات والاشتراكات في منسدلة المنتجات والخدمات
        # نستخدم نمط أكثر مرونة
        desktop_products_pattern = r'<a href="([^"]*)ai-agent" class="dropdown-item">\s*<iconify-icon icon="lucide:bot"></iconify-icon>\s*<div class="dropdown-item-content">\s*<span class="dropdown-title">AI \(AIaaS\) للمنشآت</span>\s*<span class="dropdown-desc">حلول AIaaS المرنة</span>\s*</div>\s*</a>'
        
        def replace_desktop_products(match):
            old_href = match.group(1)
            return f'''<a href="{base_path}frontend/pages/our-products" class="dropdown-item">
              <iconify-icon icon="lucide:package"></iconify-icon>
              <div class="dropdown-item-content">
                <span class="dropdown-title">المنتجات والاشتراكات</span>
                <span class="dropdown-desc">استكشف منتجاتنا وخطط الاشتراك</span>
              </div>
            </a>'''
        
        content = re.sub(desktop_products_pattern, replace_desktop_products, content, flags=re.DOTALL)
        
        # 2. إضافة AIaaS في منسدلة الحلول ونماذج التجربة
        # نبحث عن قسم الحلول ونضيف AIaaS بعد فتح dropdown-menu
        solutions_dropdown_pattern = r'(<li class="nav-item">\s*<a href="#" class="nav-link"[^>]*aria-haspopup="true"[^>]*>\s*الحلول و نماذج التجربة.*?<iconify-icon icon="lucide:chevron-down"[^>]*></iconify-icon>\s*</a>\s*<div class="dropdown-menu">)'
        
        def add_aiaa_to_solutions(match):
            original = match.group(1)
            aiaa_item = f'''
            <a href="{base_path}frontend/pages/ai-agent" class="dropdown-item">
              <iconify-icon icon="lucide:bot"></iconify-icon>
              <div class="dropdown-item-content">
                <span class="dropdown-title">AI (AIaaS) للمنشآت</span>
                <span class="dropdown-desc">حلول AIaaS المرنة</span>
              </div>
            </a>'''
            return original + aiaa_item
        
        content = re.sub(solutions_dropdown_pattern, add_aiaa_to_solutions, content, flags=re.DOTALL)
        
        # ========== Mobile Navigation Updates ==========
        
        # 1. استبدال AIaaS بالمنتجات في منسدلة المنتجات (Mobile)
        mobile_products_pattern = r'<a href="([^"]*)ai-agent" class="dropdown-item">AI \(AIaaS\) للمنشآت</a>'
        
        def replace_mobile_products(match):
            return f'<a href="{base_path}frontend/pages/our-products" class="dropdown-item">المنتجات والاشتراكات</a>'
        
        content = re.sub(mobile_products_pattern, replace_mobile_products, content)
        
        # 2. إضافة AIaaS في منسدلة الحلول (Mobile)
        mobile_solutions_pattern = r'(<a href="#" class="mobile-nav-link"[^>]*aria-haspopup="true"[^>]*>\s*الحلول و نماذج التجربة.*?<iconify-icon icon="lucide:chevron-down"[^>]*></iconify-icon>\s*</a>\s*<div class="mobile-dropdown">)'
        
        def add_aiaa_to_mobile_solutions(match):
            original = match.group(1)
            aiaa_item = f'''
          <a href="{base_path}frontend/pages/ai-agent" class="dropdown-item">AI (AIaaS) للمنشآت</a>'''
            return original + aiaa_item
        
        content = re.sub(mobile_solutions_pattern, add_aiaa_to_mobile_solutions, content, flags=re.DOTALL)
        
        # حفظ التغييرات إذا حدث تعديل
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "تم التحديث بنجاح"
        else:
            return False, "لم يتم العثور على أنماط للتحديث"
            
    except Exception as e:
        return False, f"خطأ: {str(e)}"

def main():
    """الدالة الرئيسية"""
    # البحث عن جميع ملفات HTML
    html_files = []
    for root, dirs, files in os.walk('.'):
        # تجاهل مجلدات معينة
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', '.kiro']]
        
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                html_files.append(file_path)
    
    print(f"تم العثور على {len(html_files)} ملف HTML")
    print("=" * 60)
    
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for file_path in html_files:
        success, message = update_html_file(file_path)
        status = "✓" if success else "○" if "لا يحتوي" in message else "✗"
        print(f"{status} {file_path}: {message}")
        
        if success:
            updated_count += 1
        elif "لا يحتوي" in message:
            skipped_count += 1
        else:
            error_count += 1
    
    print("=" * 60)
    print(f"الملخص: {updated_count} تم تحديثها، {skipped_count} تم تخطيها، {error_count} أخطاء")

if __name__ == "__main__":
    main()
