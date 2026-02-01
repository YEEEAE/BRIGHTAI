#!/bin/bash

# سكريبت إصلاح جميع الروابط في المشروع
# Bright AI - Comprehensive Link Fixer

echo "🔧 بدء إصلاح جميع الروابط في المشروع..."
echo "=========================================="
echo ""

TOTAL_FILES=0
FIXED_FILES=0

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# دالة لإصلاح الروابط في ملف واحد
fix_links_in_file() {
    local file=$1
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ الملف غير موجود:${NC} $file"
        return
    fi
    
    # نسخة احتياطية
    cp "$file" "$file.backup"
    
    # إصلاح الروابط - المرحلة 1: الروابط الفارغة
    sed -i '' 's|href=""|href="/"|g' "$file"
    
    # إصلاح الروابط - المرحلة 2: الصفحات الرئيسية
    sed -i '' \
        -e 's|href="frontend/pages/smart-automation"[^>]|href="frontend/pages/smart-automation/index.html"|g' \
        -e 's|href="frontend/pages/our-products"[^>]|href="frontend/pages/our-products/index.html"|g' \
        -e 's|href="frontend/pages/data-analysis"[^>]|href="frontend/pages/data-analysis/index.html"|g' \
        -e 's|href="frontend/pages/consultation"[^>]|href="frontend/pages/consultation/index.html"|g' \
        -e 's|href="frontend/pages/ai-agent"[^>]|href="frontend/pages/ai-agent/index.html"|g' \
        -e 's|href="frontend/pages/try"[^>]|href="frontend/pages/try/index.html"|g' \
        -e 's|href="frontend/pages/tools"[^>]|href="frontend/pages/tools/index.html"|g' \
        -e 's|href="frontend/pages/smart-medical-archive"[^>]|href="frontend/pages/smart-medical-archive/index.html"|g' \
        -e 's|href="frontend/pages/interview"[^>]|href="frontend/pages/interview/index.html"|g' \
        -e 's|href="frontend/pages/about-us"[^>]|href="frontend/pages/about-us/index.html"|g' \
        -e 's|href="frontend/pages/blog"[^>]|href="frontend/pages/blog/index.html"|g' \
        -e 's|href="frontend/pages/contact"[^>]|href="frontend/pages/contact/index.html"|g' \
        -e 's|href="frontend/pages/privacy-cookies"[^>]|href="frontend/pages/privacy-cookies/index.html"|g' \
        -e 's|href="frontend/pages/ai-bots"[^>]|href="frontend/pages/ai-bots/index.html"|g' \
        -e 's|href="frontend/pages/ai-workflows"[^>]|href="frontend/pages/ai-workflows/index.html"|g' \
        "$file"
    
    # إصلاح الروابط - المرحلة 3: الروابط النسبية
    sed -i '' \
        -e 's|href="../smart-automation"|href="../smart-automation/index.html"|g' \
        -e 's|href="../our-products"|href="../our-products/index.html"|g' \
        -e 's|href="../data-analysis"|href="../data-analysis/index.html"|g' \
        -e 's|href="../consultation"|href="../consultation/index.html"|g' \
        -e 's|href="../ai-agent"|href="../ai-agent/index.html"|g' \
        -e 's|href="../try"|href="../try/index.html"|g' \
        -e 's|href="../tools"|href="../tools/index.html"|g' \
        -e 's|href="../interview"|href="../interview/index.html"|g' \
        -e 's|href="../about-us"|href="../about-us/index.html"|g' \
        -e 's|href="../blog"|href="../blog/index.html"|g' \
        -e 's|href="../contact"|href="../contact/index.html"|g' \
        "$file"
    
    # إصلاح الروابط - المرحلة 4: Docs
    sed -i '' \
        -e 's|href="Docs"[^.]|href="Docs.html"|g' \
        -e 's|href="../Docs"[^.]|href="../Docs.html"|g' \
        -e 's|href="../../Docs"[^.]|href="../../Docs.html"|g' \
        "$file"
    
    # إصلاح الروابط - المرحلة 5: الروابط المطلقة من الجذر
    sed -i '' \
        -e 's|href="/smart-automation"|href="/frontend/pages/smart-automation/index.html"|g' \
        -e 's|href="/our-products"|href="/frontend/pages/our-products/index.html"|g' \
        -e 's|href="/data-analysis"|href="/frontend/pages/data-analysis/index.html"|g' \
        -e 's|href="/consultation"|href="/frontend/pages/consultation/index.html"|g' \
        -e 's|href="/ai-agent"|href="/frontend/pages/ai-agent/index.html"|g' \
        -e 's|href="/try"|href="/frontend/pages/try/index.html"|g' \
        -e 's|href="/tools"|href="/frontend/pages/tools/index.html"|g' \
        -e 's|href="/interview"|href="/frontend/pages/interview/index.html"|g' \
        -e 's|href="/about-us"|href="/frontend/pages/about-us/index.html"|g' \
        -e 's|href="/blog"|href="/frontend/pages/blog/index.html"|g' \
        -e 's|href="/contact"|href="/frontend/pages/contact/index.html"|g' \
        "$file"
    
    # التحقق من التغييرات
    if ! diff -q "$file" "$file.backup" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $file"
        FIXED_FILES=$((FIXED_FILES + 1))
        rm "$file.backup"
    else
        rm "$file.backup"
    fi
}

# معالجة الملف الرئيسي أولاً
echo -e "${BLUE}📄 معالجة الملفات الرئيسية...${NC}"
if [ -f "index.html" ]; then
    fix_links_in_file "index.html"
fi
if [ -f "Docs.html" ]; then
    fix_links_in_file "Docs.html"
fi
echo ""

# معالجة جميع ملفات HTML في frontend/pages
echo -e "${BLUE}📁 معالجة ملفات frontend/pages...${NC}"
find frontend/pages -name "*.html" -type f | while read -r file; do
    fix_links_in_file "$file"
done

echo ""
echo "=========================================="
echo "📊 ملخص النتائج:"
echo "=========================================="
echo -e "إجمالي الملفات المعالجة: ${YELLOW}$TOTAL_FILES${NC}"
echo -e "الملفات التي تم إصلاحها: ${GREEN}$FIXED_FILES${NC}"
echo -e "الملفات بدون تغيير: ${BLUE}$((TOTAL_FILES - FIXED_FILES))${NC}"
echo ""

if [ $FIXED_FILES -gt 0 ]; then
    echo -e "${GREEN}✅ تم إصلاح الروابط بنجاح!${NC}"
    echo ""
    echo "📝 الخطوات التالية:"
    echo "  1. راجع التغييرات باستخدام: git diff"
    echo "  2. اختبر الموقع محلياً"
    echo "  3. قم بعمل commit للتغييرات"
else
    echo -e "${YELLOW}ℹ️  جميع الروابط صحيحة بالفعل!${NC}"
fi

exit 0
