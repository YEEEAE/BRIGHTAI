import os

target_dir = '.render-static'
count = 0

for root, dirs, files in os.walk(target_dir):
    for f in files:
        if not f.endswith('.html'):
            continue
        fp = os.path.join(root, f)
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        if 'fonts.css' in content or 'sitewide-modernization.css' in content:
            continue
        idx = content.find('</head>')
        if idx == -1:
            continue
        new_content = content[:idx] + '  <link rel="stylesheet" href="/assets/css/fonts.css">\n' + content[idx:]
        with open(fp, 'w', encoding='utf-8') as fh:
            fh.write(new_content)
        count += 1

print(f'Updated {count} files')
