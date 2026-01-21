#!/bin/bash

# Image Optimization Script for brightai.site
# Converts images to WebP and optimizes file sizes

echo "🖼️  Starting Image Optimization..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if tools are installed
if ! command -v cwebp &> /dev/null; then
    echo -e "${RED}Error: cwebp not found${NC}"
    echo "Install with: brew install webp (macOS) or sudo apt-get install webp (Ubuntu)"
    exit 1
fi

if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick not found${NC}"
    echo "Install with: brew install imagemagick (macOS) or sudo apt-get install imagemagick (Ubuntu)"
    exit 1
fi

echo -e "${YELLOW}Step 1: Optimizing Logo (Gemini.png)${NC}"

# Backup original
if [ -f "Gemini.png" ]; then
    cp Gemini.png Gemini-original.png
    echo "✓ Backed up original logo"
    
    # Optimize PNG
    convert Gemini.png -resize 512x512 -quality 85 -strip Gemini-optimized.png
    
    # Convert to WebP
    cwebp -q 90 Gemini-optimized.png -o Gemini.webp
    
    # Replace original with optimized
    mv Gemini-optimized.png Gemini.png
    
    echo "✓ Logo optimized and converted to WebP"
else
    echo "⚠ Gemini.png not found"
fi

echo -e "${YELLOW}Step 2: Converting all PNG images to WebP${NC}"

# Find and convert PNG files (excluding node_modules and hidden folders)
find . -type f -name "*.png" \
    ! -path "*/node_modules/*" \
    ! -path "*/.*/*" \
    ! -name "*-original.png" \
    ! -name "Gemini.png" | while read file; do
    
    # Get file size before
    size_before=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    
    # Convert to WebP
    cwebp -q 80 "$file" -o "${file%.png}.webp" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        size_after=$(stat -f%z "${file%.png}.webp" 2>/dev/null || stat -c%s "${file%.png}.webp" 2>/dev/null)
        reduction=$(( (size_before - size_after) * 100 / size_before ))
        echo "✓ Converted: $file (${reduction}% smaller)"
    fi
done

echo -e "${YELLOW}Step 3: Converting all JPG images to WebP${NC}"

# Find and convert JPG files
find . -type f \( -name "*.jpg" -o -name "*.jpeg" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.*/*" | while read file; do
    
    # Get file size before
    size_before=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    
    # Convert to WebP
    cwebp -q 80 "$file" -o "${file%.*}.webp" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        size_after=$(stat -f%z "${file%.*}.webp" 2>/dev/null || stat -c%s "${file%.*}.webp" 2>/dev/null)
        reduction=$(( (size_before - size_after) * 100 / size_before ))
        echo "✓ Converted: $file (${reduction}% smaller)"
    fi
done

echo -e "${YELLOW}Step 4: Optimizing remaining PNG files${NC}"

# Optimize PNG files that weren't converted
find . -type f -name "*.png" \
    ! -path "*/node_modules/*" \
    ! -path "*/.*/*" \
    ! -name "*-original.png" | while read file; do
    
    # Optimize with ImageMagick
    convert "$file" -strip -quality 85 "${file%.png}-opt.png"
    
    # Check if optimized version is smaller
    size_original=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    size_optimized=$(stat -f%z "${file%.png}-opt.png" 2>/dev/null || stat -c%s "${file%.png}-opt.png" 2>/dev/null)
    
    if [ $size_optimized -lt $size_original ]; then
        mv "${file%.png}-opt.png" "$file"
        reduction=$(( (size_original - size_optimized) * 100 / size_original ))
        echo "✓ Optimized: $file (${reduction}% smaller)"
    else
        rm "${file%.png}-opt.png"
    fi
done

echo -e "${GREEN}✓ Image optimization complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update HTML to use WebP images with fallbacks"
echo "2. Test images load correctly on your site"
echo "3. Run PageSpeed Insights to see improvements"
echo ""
echo "Example HTML for WebP with fallback:"
echo '<picture>'
echo '  <source srcset="image.webp" type="image/webp">'
echo '  <img src="image.png" alt="Description" loading="lazy">'
echo '</picture>'
