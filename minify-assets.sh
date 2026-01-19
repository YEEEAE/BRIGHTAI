#!/bin/bash

# Script to minify CSS and JS files
# This will help fix the unminified files issue

echo "Installing minification tools..."
npm install -g terser csso-cli 2>/dev/null || echo "Tools already installed or npm not available"

echo "Minifying JavaScript files..."

# Main JS files
if [ -f "js/scroll-animations.js" ]; then
    terser js/scroll-animations.js -o js/scroll-animations.min.js -c -m
    echo "✓ Minified scroll-animations.js"
fi

if [ -f "js/unified-nav.js" ]; then
    terser js/unified-nav.js -o js/unified-nav.min.js -c -m
    echo "✓ Minified unified-nav.js"
fi

if [ -f "js/products-manager.js" ]; then
    terser js/products-manager.js -o js/products-manager.min.js -c -m
    echo "✓ Minified products-manager.js"
fi

# Page-specific JS files
for file in blog.js ai-bots.js our-products.js smart-automation.js tools.js data-analysis.js Docs.js; do
    if [ -f "$file" ]; then
        terser "$file" -o "${file%.js}.min.js" -c -m
        echo "✓ Minified $file"
    fi
done

echo ""
echo "Minifying CSS files..."

# Main CSS files
if [ -f "css/unified-nav.css" ]; then
    csso css/unified-nav.css -o css/unified-nav.min.css
    echo "✓ Minified unified-nav.css"
fi

if [ -f "css/unified-gradient.css" ]; then
    csso css/unified-gradient.css -o css/unified-gradient.min.css
    echo "✓ Minified unified-gradient.css"
fi

if [ -f "css/products-enhanced.css" ]; then
    csso css/products-enhanced.css -o css/products-enhanced.min.css
    echo "✓ Minified products-enhanced.css"
fi

if [ -f "css/design-tokens.css" ]; then
    csso css/design-tokens.css -o css/design-tokens.min.css
    echo "✓ Minified design-tokens.css"
fi

# Page-specific CSS files
for file in blog.css ai-bots.css our-products.css smart-automation.css tools.css data-analysis.css Docs.css; do
    if [ -f "$file" ]; then
        csso "$file" -o "${file%.css}.min.css"
        echo "✓ Minified $file"
    fi
done

echo ""
echo "✅ Minification complete!"
echo ""
echo "Next steps:"
echo "1. Update HTML files to reference .min.js and .min.css files"
echo "2. Test the website to ensure everything works"
echo "3. Run the sitemap generator to update sitemap.xml"
