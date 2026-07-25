#!/bin/bash
# Batch SEO metadata extractor for ROUTE-INVENTORY.md
# Outputs JSON per page: path, h1, title, description, canonical, og:title, og:description, hreflang, jsonld, ga_tag

DIR="/Users/yzydalshmry/Desktop/BRIGHTAI"
FIRST=1

echo "["

find "$DIR" -name "index.html" -not -path "*/frontend/*" -not -path "*/node_modules/*" -not -path "*/components/*" | sort | while read -r FILE; do
    # Skip offline and report pages (not in sitemap)
    REL=$(echo "$FILE" | sed "s|$DIR/||" | sed 's|/index.html||' | sed 's|^index.html|/|')
    if [ "$REL" = "." ]; then REL="/"; fi
    # Normalize: ensure trailing slash format for paths
    if [ "$REL" != "/" ]; then REL="/${REL}/"; fi

    # Extract fields
    TITLE=$(grep -oP '<title[^>]*>\K[^<]+' "$FILE" 2>/dev/null | head -1 | tr -d '\n\r' | sed 's/"/\\"/g')
    DESC=$(grep -oP '<meta\s+name="description"\s+content="\K[^"]+' "$FILE" 2>/dev/null | head -1 | sed 's/"/\\"/g')
    if [ -z "$DESC" ]; then
        DESC=$(grep -oP '<meta\s+content="\K[^"]+(?="\s+name="description")' "$FILE" 2>/dev/null | head -1 | sed 's/"/\\"/g')
    fi
    CANONICAL=$(grep -oP '<link\s+rel="canonical"\s+href="\K[^"]+' "$FILE" 2>/dev/null | head -1)
    if [ -z "$CANONICAL" ]; then
        CANONICAL=$(grep -oP '<link\s+href="\K[^"]+(?="\s+rel="canonical")' "$FILE" 2>/dev/null | head -1)
    fi
    H1=$(grep -oP '<h1[^>]*>\K[^<]+' "$FILE" 2>/dev/null | head -1 | sed 's/"/\\"/g' | cut -c1-120)
    if [ -z "$H1" ]; then
        # Try multi-line h1
        H1=$(sed -n '/<h1/,/<\/h1>/p' "$FILE" 2>/dev/null | sed 's/<[^>]*>//g' | tr -s ' \n' ' ' | sed 's/^ *//;s/ *$//' | cut -c1-120 | sed 's/"/\\"/g')
    fi
    OG_TITLE=$(grep -oP '<meta\s+property="og:title"\s+content="\K[^"]+' "$FILE" 2>/dev/null | head -1 | sed 's/"/\\"/g')
    if [ -z "$OG_TITLE" ]; then
        OG_TITLE=$(grep -oP '<meta\s+content="\K[^"]+(?="\s+property="og:title")' "$FILE" 2>/dev/null | head -1 | sed 's/"/\\"/g')
    fi
    OG_DESC=$(grep -oP '<meta\s+property="og:description"\s+content="\K[^"]+' "$FILE" 2>/dev/null | head -1 | sed 's/"/\\"/g')
    if [ -z "$OGOG_DESC" ]; then
        OG_DESC=$(grep -oP '<meta\s+content="\K[^"]+(?="\s+property="og:description")' "$FILE" 2>/dev/null | head -1 | sed 's/"/\\"/g')
    fi
    HREFLANG=$(grep -oP '<link\s+rel="alternate"\s+hreflang="\K[^"]+' "$FILE" 2>/dev/null | tr '\n' ';' | sed 's/;$//')
    JSONLD=$(grep -c 'application/ld+json' "$FILE" 2>/dev/null)
    JSONLD_TYPES=$(grep -oP '"@type"\s*:\s*"\K[^"]+' "$FILE" 2>/dev/null | tr '\n' ';' | sed 's/;$//')
    GA_TAG=$(grep -c 'G-8LLESL207Q' "$FILE" 2>/dev/null)
    HAS_GA="no"
    if [ "$GA_TAG" -gt 0 ] 2>/dev/null; then HAS_GA="yes"; fi
    
    # Check for noindex
    NOINDEX=$(grep -c 'noindex' "$FILE" 2>/dev/null)
    HAS_NOINDEX="no"
    if [ "$NOINDEX" -gt 0 ] 2>/dev/null; then HAS_NOINDEX="yes"; fi

    if [ $FIRST -eq 1 ]; then
        FIRST=0
    else
        echo ","
    fi

    printf '  {\n'
    printf '    "path": "%s",\n' "$REL"
    printf '    "file": "%s",\n' "$(echo "$FILE" | sed "s|$DIR/||")"
    printf '    "h1": "%s",\n' "$H1"
    printf '    "title": "%s",\n' "$TITLE"
    printf '    "description": "%s",\n' "$(echo "$DESC" | cut -c1-200)"
    printf '    "canonical": "%s",\n' "$CANONICAL"
    printf '    "og_title": "%s",\n' "$(echo "$OG_TITLE" | cut -c1-120)"
    printf '    "og_description": "%s",\n' "$(echo "$OG_DESC" | cut -c1-120)"
    printf '    "hreflang": "%s",\n' "$HREFLANG"
    printf '    "jsonld_count": %d,\n' "${JSONLD:-0}"
    printf '    "jsonld_types": "%s",\n' "$JSONLD_TYPES"
    printf '    "ga_tag": "%s",\n' "$HAS_GA"
    printf '    "noindex": "%s"\n' "$HAS_NOINDEX"
    printf '  }'
done

echo ""
echo "]"