#!/usr/bin/env python3
import os, glob

BASE = '/Users/yzydalshmry/Desktop/BRIGHTAI/.render-static'
html_files = []
for root, dirs, files in os.walk(BASE):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

print(f'Total HTML files found: {len(html_files)}')

updated = 0
skipped = 0

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'fonts.css' in content:
        skipped += 1
        continue
    new_content = content.replace(
        '</head>',
        '<link rel="stylesheet" href="/assets/css/fonts.css">\n</head>',
        1
    )
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    updated += 1

print(f'Updated: {updated}')
print(f'Skipped (already had fonts.css): {skipped}')
