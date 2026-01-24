#!/bin/bash
# سكريبت لإصلاح الروابط التي تنتهي بـ .html لتكون Clean URLs
# يحافظ على الروابط الخارجية ويصلح الروابط الداخلية فقط

# المسار الرئيسي للمشروع
PROJECT_DIR="/Users/yzydalshmry/Desktop/BrightAI"

# قائمة الملفات المستبعدة (ملفات خاصة يجب ألا تتغير)
EXCLUDED_FILES=(
    "googleddea7698fb09dd02.html"
    "404.html"
)

# الملفات الرئيسية التي يجب إصلاحها (تظهر للعملاء)
MAIN_FILES=(
    "index.html"
    "blog.html"
    "tools.html"
    "machine.html"
    "consultation.html"
    "data-analysis.html"
    "ai-agent.html"
    "ai-bots.html"
    "smart-automation.html"
    "our-products.html"
    "about-us.html"
    "contact.html"
    "nlp.html"
    "try.html"
    "health-bright.html"
    "what-is-ai.html"
    "physical-ai.html"
    "solutions.html"
    "brightrecruiter.html"
    "brightsales-pro.html"
    "brightproject-pro.html"
)

echo "🔧 بدء إصلاح الروابط..."
echo "================================"

# إصلاح الروابط في الملفات الرئيسية
for file in "${MAIN_FILES[@]}"; do
    filepath="$PROJECT_DIR/$file"
    if [[ -f "$filepath" ]]; then
        echo "📄 معالجة: $file"
        
        # إزالة .html من الروابط الداخلية (href="something.html" -> href="something")
        # لكن نحافظ على الروابط الخارجية (https://)
        sed -i '' -E 's/href="([^"\/][^":]*[^:])\.html"/href="\1"/g' "$filepath"
        
        # إصلاح روابط canonical التي تنتهي بـ .html
        sed -i '' -E 's|href="(https://brightai\.site/[^"]+)\.html"|href="\1"|g' "$filepath"
        
        # إصلاح الروابط النسبية مثل ../blog.html
        sed -i '' -E 's/href="(\.\.\/[^"]+)\.html"/href="\1"/g' "$filepath"
    fi
done

echo ""
echo "📁 معالجة مجلد blogger..."
# إصلاح الروابط في مجلد blogger
find "$PROJECT_DIR/blogger" -name "*.html" -type f | while read filepath; do
    filename=$(basename "$filepath")
    echo "   📄 $filename"
    
    # إزالة .html من الروابط الداخلية
    sed -i '' -E 's/href="([^"\/][^":]*[^:])\.html"/href="\1"/g' "$filepath"
    
    # إصلاح روابط canonical
    sed -i '' -E 's|href="(https://brightai\.site/[^"]+)\.html"|href="\1"|g' "$filepath"
    
    # إصلاح الروابط النسبية
    sed -i '' -E 's/href="(\.\.\/[^"]+)\.html"/href="\1"/g' "$filepath"
done

echo ""
echo "📁 معالجة مجلد services..."
find "$PROJECT_DIR/services" -name "*.html" -type f | while read filepath; do
    filename=$(basename "$filepath")
    echo "   📄 $filename"
    sed -i '' -E 's/href="([^"\/][^":]*[^:])\.html"/href="\1"/g' "$filepath"
    sed -i '' -E 's|href="(https://brightai\.site/[^"]+)\.html"|href="\1"|g' "$filepath"
    sed -i '' -E 's/href="(\.\.\/[^"]+)\.html"/href="\1"/g' "$filepath"
done

echo ""
echo "✅ تم الانتهاء من إصلاح الروابط!"
echo "================================"

# عرض إحصائيات
remaining=$(grep -r 'href="[^"]*\.html"' "$PROJECT_DIR" --include="*.html" -c 2>/dev/null | grep -v ":0$" | wc -l)
echo "📊 الملفات المتبقية التي تحتوي على روابط .html: $remaining"
