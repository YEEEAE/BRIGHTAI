#!/bin/bash
# BrightAI Codebase Cleanup Script
# Generated: 2026-01-22
# WARNING: Review each section before executing!

echo "🧹 BrightAI Codebase Cleanup Script"
echo "======================================"
echo ""
echo "⚠️  WARNING: This will DELETE files permanently!"
echo "📋 Please review CODEBASE_AUDIT_UNUSED_FILES.md first"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Phase 1: Security & Test Files (HIGH PRIORITY)
echo ""
echo "Phase 1: Removing test and security risk files..."
rm -f checkout.html
rm -f new_content.html
rm -f try.html
rm -f admin.html
echo "✅ Test files removed"

# Phase 2: Legacy Directories
echo ""
echo "Phase 2: Removing legacy directories..."
rm -rf old/
rm -rf Customer/
echo "✅ Legacy directories removed"

# Phase 3: System Files
echo ""
echo "Phase 3: Removing .DS_Store files..."
find . -name ".DS_Store" -type f -delete
echo "✅ .DS_Store files removed"

# Add .DS_Store to .gitignore if not already there
if ! grep -q ".DS_Store" .gitignore 2>/dev/null; then
    echo ".DS_Store" >> .gitignore
    echo "✅ Added .DS_Store to .gitignore"
fi

# Phase 4: Duplicate Images (Optional - Review First)
echo ""
echo "Phase 4: Removing duplicate Gemini images..."
echo "⚠️  Keeping only Gemini.webp in root"
read -p "Remove duplicates? (yes/no): " remove_dupes

if [ "$remove_dupes" = "yes" ]; then
    rm -f Gemini-original.png
    rm -f Customer/Gemini.png
    rm -f Docfile/Gemini.png
    rm -f blogger/Gemini.png
    rm -f botAI/Gemini.png
    echo "✅ Duplicate images removed"
fi

# Phase 5: Utility Scripts (Optional)
echo ""
echo "Phase 5: Moving utility scripts..."
read -p "Move scripts to /scripts/? (yes/no): " move_scripts

if [ "$move_scripts" = "yes" ]; then
    mkdir -p scripts
    mv fix-html-links.sh scripts/ 2>/dev/null
    mv generate_sitemap.py scripts/ 2>/dev/null
    mv validate_sitemap.py scripts/ 2>/dev/null
    echo "✅ Scripts moved to /scripts/"
fi

echo ""
echo "🎉 Cleanup Complete!"
echo ""
echo "📊 Summary:"
echo "  - Test files removed"
echo "  - Legacy directories removed"
echo "  - System files cleaned"
echo "  - Duplicates handled"
echo ""
echo "📝 Next Steps:"
echo "  1. Review /Docfile/ directory manually"
echo "  2. Audit /blogger/ files with analytics"
echo "  3. Update sitemap.xml"
echo "  4. Run git status to review changes"
echo "  5. Commit with: git commit -m 'chore: cleanup unused files'"
echo ""
