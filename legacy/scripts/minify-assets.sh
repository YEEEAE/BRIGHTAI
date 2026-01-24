#!/bin/bash

# Asset Minification Script for brightai.site
# Minifies CSS and JavaScript files

echo "⚡ Starting Asset Minification..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found${NC}"
    echo "Install with: brew install node (macOS) or sudo apt-get install nodejs (Ubuntu)"
    exit 1
fi

# Check if npm packages are installed
echo -e "${YELLOW}Checking for required npm packages...${NC}"

if ! command -v cleancss &> /dev/null; then
    echo "Installing clean-css-cli..."
    npm install -g clean-css-cli
fi

if ! command -v terser &> /dev/null; then
    echo "Installing terser..."
    npm install -g terser
fi

echo -e "${YELLOW}Step 1: Minifying CSS files${NC}"

# Find and minify CSS files
find css -type f -name "*.css" ! -name "*.min.css" 2>/dev/null | while read file; do
    output="${file%.css}.min.css"
    
    # Get file size before
    size_before=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    
    # Minify
    cleancss -o "$output" "$file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        size_after=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output" 2>/dev/null)
        reduction=$(( (size_before - size_after) * 100 / size_before ))
        echo "✓ Minified: $file → $output (${reduction}% smaller)"
    else
        echo "⚠ Failed to minify: $file"
    fi
done

echo -e "${YELLOW}Step 2: Minifying JavaScript files${NC}"

# Find and minify JS files
find js -type f -name "*.js" ! -name "*.min.js" 2>/dev/null | while read file; do
    output="${file%.js}.min.js"
    
    # Get file size before
    size_before=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    
    # Minify
    terser "$file" -o "$output" -c -m 2>/dev/null
    
    if [ $? -eq 0 ]; then
        size_after=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output" 2>/dev/null)
        reduction=$(( (size_before - size_after) * 100 / size_before ))
        echo "✓ Minified: $file → $output (${reduction}% smaller)"
    else
        echo "⚠ Failed to minify: $file"
    fi
done

echo -e "${YELLOW}Step 3: Updating HTML references${NC}"

# Update CSS references
find . -name "*.html" -type f ! -path "*/node_modules/*" ! -path "*/.*/*" | while read file; do
    # Backup
    cp "$file" "${file}.bak"
    
    # Replace .css with .min.css (but not if already .min.css)
    sed -i '' 's/\([^.]\)\.css"/\1.min.css"/g' "$file" 2>/dev/null || \
    sed -i 's/\([^.]\)\.css"/\1.min.css"/g' "$file" 2>/dev/null
    
    # Replace .js with .min.js (but not if already .min.js)
    sed -i '' 's/\([^.]\)\.js"/\1.min.js"/g' "$file" 2>/dev/null || \
    sed -i 's/\([^.]\)\.js"/\1.min.js"/g' "$file" 2>/dev/null
    
    echo "✓ Updated references in: $file"
done

echo -e "${GREEN}✓ Asset minification complete!${NC}"
echo ""
echo "Summary:"
echo "- CSS files minified in css/ folder"
echo "- JavaScript files minified in js/ folder"
echo "- HTML files updated to use .min.css and .min.js"
echo "- Backup files created (.bak)"
echo ""
echo "Next steps:"
echo "1. Test your site to ensure everything works"
echo "2. If issues occur, restore from .bak files"
echo "3. Run PageSpeed Insights to see improvements"
echo "4. Delete .bak files once verified"
