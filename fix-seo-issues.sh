#!/bin/bash

# SEO Critical Issues Fix Script for brightai.site
# This script automates the fixing of broken links and performance issues

echo "🚀 Starting SEO Fixes for brightai.site..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter for fixes
FIXES=0

echo -e "${YELLOW}Phase 1: Fixing Broken Links${NC}"

# Fix 1: Update all references from h/index.html to h/projects/interview/index.html
echo "Fixing h/index.html references..."
find . -name "*.html" -type f -exec sed -i '' 's|href="h/index.html"|href="h/projects/interview/index.html"|g' {} \;
FIXES=$((FIXES+1))

# Fix 2: Fix docs.html case sensitivity (lowercase to uppercase)
echo "Fixing docs.html case sensitivity..."
find . -name "*.html" -type f -exec sed -i '' 's|href="docs.html"|href="Docs.html"|g' {} \;
FIXES=$((FIXES+1))

# Fix 3: Remove or fix email protection links
echo "Fixing email protection links..."
find . -name "*.html" -type f -exec sed -i '' 's|href="cdn-cgi/l/email-protection"|href="mailto:info@brightai.site"|g' {} \;
find . -name "*.html" -type f -exec sed -i '' 's|href="/cdn-cgi/l/email-protection"|href="mailto:info@brightai.site"|g' {} \;
find . -name "*.html" -type f -exec sed -i '' 's|href="https://brightai.site/cdn-cgi/l/email-protection"|href="mailto:info@brightai.site"|g' {} \;
FIXES=$((FIXES+3))

# Fix 4: Fix blogger navigation broken links
echo "Fixing blogger navigation links..."
find blogger -name "*.html" -type f -exec sed -i '' 's|href="blogger/index.html"|href="../index.html"|g' {} \;
find blogger -name "*.html" -type f -exec sed -i '' 's|href="blogger/our-products.html"|href="../our-products.html"|g' {} \;
find blogger -name "*.html" -type f -exec sed -i '' 's|href="blogger/consultation.html"|href="../consultation.html"|g' {} \;
find blogger -name "*.html" -type f -exec sed -i '' 's|href="blogger/blog.html"|href="../blog.html"|g' {} \;
find blogger -name "*.html" -type f -exec sed -i '' 's|href="blogger/smart-automation.html"|href="../smart-automation.html"|g' {} \;
find blogger -name "*.html" -type f -exec sed -i '' 's|href="blogger/Company performance monitoring tool.html"|href="../tools.html"|g' {} \;
FIXES=$((FIXES+6))

# Fix 5: Fix Docfile navigation broken links
echo "Fixing Docfile navigation links..."
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/index.html"|href="../index.html"|g' {} \;
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/our-products.html"|href="../our-products.html"|g' {} \;
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/consultation.html"|href="../consultation.html"|g' {} \;
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/blog.html"|href="../blog.html"|g' {} \;
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/smart-automation.html"|href="../smart-automation.html"|g' {} \;
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/Docs.html"|href="../Docs.html"|g' {} \;
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/ai-agent.html"|href="../ai-agent.html"|g' {} \;
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/data-analysis.html"|href="../data-analysis.html"|g' {} \;
find Docfile -name "*.html" -type f -exec sed -i '' 's|href="Docfile/tools.html"|href="../tools.html"|g' {} \;
FIXES=$((FIXES+9))

# Fix 6: Fix blog folder references
echo "Fixing blog folder references..."
find . -name "*.html" -type f -exec sed -i '' 's|href="blog/"|href="blog.html"|g' {} \;
find . -name "*.html" -type f -exec sed -i '' 's|href="Docs/"|href="Docs.html"|g' {} \;
FIXES=$((FIXES+2))

echo -e "${YELLOW}Phase 2: Adding Performance Optimizations${NC}"

# Fix 7: Add lazy loading to images (except logo)
echo "Adding lazy loading to images..."
find . -name "*.html" -type f -not -path "*/node_modules/*" -exec sed -i '' 's|<img src="\([^"]*\)" alt="\([^"]*\)"|<img src="\1" alt="\2" loading="lazy"|g' {} \;
# Remove lazy loading from logo
find . -name "*.html" -type f -exec sed -i '' 's|<img src="Gemini.png" alt="\([^"]*\)" loading="lazy"|<img src="Gemini.png" alt="\1"|g' {} \;
FIXES=$((FIXES+1))

# Fix 8: Add preload for critical resources
echo "Adding resource hints..."
# This will be done manually in index.html

echo -e "${GREEN}✓ Applied $FIXES automated fixes${NC}"
echo -e "${YELLOW}Manual fixes required:${NC}"
echo "1. Optimize images (convert to WebP, compress)"
echo "2. Minify CSS and JavaScript files"
echo "3. Add defer attribute to non-critical scripts"
echo "4. Test all pages for broken links"
echo "5. Re-run PageSpeed Insights"

echo -e "${GREEN}🎉 SEO Fix Script Completed!${NC}"
