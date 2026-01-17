#!/bin/bash

# Script to move unused files to unused/ directory
# Created: 2025-01-17
# Purpose: Clean up Bright AI project structure

echo "🧹 Starting cleanup process..."

# Create unused directory if it doesn't exist
mkdir -p unused/html
mkdir -p unused/js
mkdir -p unused/css
mkdir -p unused/old
mkdir -p unused/backups
mkdir -p unused/misc

# Move unused HTML files
echo "📄 Moving unused HTML files..."
mv AAA.html unused/html/ 2>/dev/null
mv article_2.html unused/html/ 2>/dev/null
mv article_2034.html unused/html/ 2>/dev/null
mv article_3.html unused/html/ 2>/dev/null
mv mm.html unused/html/ 2>/dev/null
mv nn.html unused/html/ 2>/dev/null
mv try.html unused/html/ 2>/dev/null
mv width.html unused/html/ 2>/dev/null
mv "ز.html" unused/html/ 2>/dev/null
mv "Company performance monitoring tool.html" unused/html/ 2>/dev/null
mv automation-benefits.html unused/html/ 2>/dev/null
mv data-benefits.html unused/html/ 2>/dev/null
mv definitions.html unused/html/ 2>/dev/null
mv enterprise-hero-demo.html unused/html/ 2>/dev/null
mv favicon-snippet.html unused/html/ 2>/dev/null
mv hero-section.html unused/html/ 2>/dev/null
mv test-glassmorphism.html unused/html/ 2>/dev/null
mv want.html unused/html/ 2>/dev/null

# Move unused JavaScript files
echo "📜 Moving unused JavaScript files..."
mv advanced-analytics.js unused/js/ 2>/dev/null
mv analytics-tracker.js unused/js/ 2>/dev/null
mv background.js unused/js/ 2>/dev/null
mv check-button-issues.js unused/js/ 2>/dev/null
mv check-duplicate-ids.js unused/js/ 2>/dev/null
mv check-pointer-events.js unused/js/ 2>/dev/null
mv fix-seo.js unused/js/ 2>/dev/null
mv magnetic-cursor.js unused/js/ 2>/dev/null
mv micro-interactions.js unused/js/ 2>/dev/null
mv particle-system.js unused/js/ 2>/dev/null
mv theme-controller.js unused/js/ 2>/dev/null
mv urgency-elements.js unused/js/ 2>/dev/null

# Move unused CSS files
echo "🎨 Moving unused CSS files..."
mv background.css unused/css/ 2>/dev/null
mv cta-buttons.css unused/css/ 2>/dev/null
mv urgency-elements.css unused/css/ 2>/dev/null

# Move old directories
echo "📁 Moving old directories..."
mv old/ unused/old/ 2>/dev/null
mv backups/ unused/backups/ 2>/dev/null
mv "fix my website/" unused/misc/ 2>/dev/null

# Move misc files
echo "🗂️ Moving miscellaneous files..."
mv fake.py unused/misc/ 2>/dev/null
mv PowerShell.json unused/misc/ 2>/dev/null
mv Icon unused/misc/ 2>/dev/null
mv "يي" unused/misc/ 2>/dev/null
mv logo unused/misc/ 2>/dev/null

echo "✅ Cleanup completed!"
echo "📊 Summary:"
echo "   - Unused HTML files moved to: unused/html/"
echo "   - Unused JS files moved to: unused/js/"
echo "   - Unused CSS files moved to: unused/css/"
echo "   - Old directories moved to: unused/old/"
echo "   - Miscellaneous files moved to: unused/misc/"
echo ""
echo "⚠️  Please review the unused/ directory before deleting"
echo "💡 To restore a file: mv unused/[category]/[filename] ."
