#!/usr/bin/env python3
"""Find all blog/docs titles over 60 chars in BrightAI content collections."""
import re, glob

QUOTES = r'["\u201d\u201c\u2019\u2018]'

def main():
    files = sorted(glob.glob('src/content/blog/*.md') + glob.glob('src/content/docs/*.md'))
    results = []
    for f in files:
        with open(f) as fp:
            c = fp.read()
        m = re.search(r'^---\n(.*?)\n---', c, re.DOTALL)
        if not m:
            continue
        fm = m.group(1)
        title_m = re.search(r'^title:\s*' + QUOTES + r'(.*)' + QUOTES + r'\s*$', fm, re.MULTILINE)
        if title_m:
            t = title_m.group(1)
            if len(t) > 60:
                results.append((len(t), t, f))
    results.sort(reverse=True)
    for length, title, f in results:
        marker = "🔴" if length > 70 else "🟡"
        print(f'{marker} {length:3}c | {f.replace("src/content/", "")}')
        print(f'       CURRENT: {title}')
    print()
    print(f'Total titles > 60 chars: {len(results)}')

if __name__ == '__main__':
    main()
