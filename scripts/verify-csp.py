#!/usr/bin/env python3
"""verify_csp.py — Acceptance verification for Vercel CSP hardening.

Reads vercel.json + dist/*.html, reports:
  1. No 'brightaii' typo in vercel.json
  2. script-src and script-src-elem do NOT contain 'unsafe-inline'
  3. style-src still contains 'unsafe-inline' (documented as pending)
  4. All inline script hashes in dist/*.html are whitelisted in CSP
  5. JSON-LD preserved in dist/index.html
  6. External analytics scripts present in dist/index.html
"""
import re, hashlib, base64, os, sys
from collections import defaultdict

print('=' * 70)
print('VERCEL CSP HARDENING — ACCEPTANCE VERIFICATION')
print('=' * 70)

# ---- 1. No brightaii typo ----
print('\n[1] vercel.json contains "brightaii" (typo check):')
with open('vercel.json') as f: raw = f.read()
typo_count = len(re.findall(r'brightaii', raw))
print(f'    count={typo_count}  {"PASS" if typo_count == 0 else "FAIL"}')

# ---- Extract CSP ----
start = raw.find('Content-Security-Policy')
val_start = raw.find('"value":', start)
val_start = raw.find('"', val_start + 7)
i = val_start + 1
out = []
while i < len(raw):
    c = raw[i]
    if c == '\\':
        out.append(raw[i:i+2]); i += 2
    elif c == '"': break
    else: out.append(c); i += 1
csp = ''.join(out)

# ---- 2. script-src / script-src-elem: no unsafe-inline ----
print('\n[2] script-src / script-src-elem unsafe-inline check:')
directives = [d.strip() for d in csp.split(';')]
all_pass = True
for d in directives:
    name = re.match(r'^([a-z-]+(?:-[a-z]+)?)', d)
    if not name: continue
    nm = name.group(1)
    if nm in ('script-src', 'script-src-elem'):
        has = 'unsafe-inline' in d
        status = 'PASS' if not has else 'FAIL'
        print(f'    [{status}] {nm}: unsafe-inline={"PRESENT" if has else "absent"}')
        if has: all_pass = False

# ---- 3. style-src: unsafe-inline (pending) ----
print('\n[3] style-src unsafe-inline check (pending acceptable):')
for d in directives:
    name = re.match(r'^([a-z-]+(?:-[a-z]+)?)', d)
    if not name: continue
    nm = name.group(1)
    if nm in ('style-src', 'style-src-elem', 'style-src-attr'):
        has = 'unsafe-inline' in d
        print(f'    [INFO] {nm}: unsafe-inline={"PRESENT (pending)" if has else "absent"}')

# ---- 4. Hash coverage ----
print('\n[4] Inline script hash coverage:')
all_hashes = set()
for root, _, files in os.walk('dist'):
    for f in files:
        if not f.endswith('.html'): continue
        path = os.path.join(root, f)
        with open(path) as fp: html = fp.read()
        for m in re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>', html):
            attrs = m.group(1); body = m.group(2)
            if 'src=' in attrs or 'application/ld+json' in attrs: continue
            h = hashlib.sha256(body.encode('utf-8')).digest()
            all_hashes.add(base64.b64encode(h).decode('ascii'))

csp_hashes = set(re.findall(r"'sha256-([A-Za-z0-9+/=]+)'", raw))
missing = all_hashes - csp_hashes
extra = csp_hashes - all_hashes
print(f'    inline script hashes in dist/*.html: {len(all_hashes)}')
print(f'    sha256 tokens whitelisted in CSP:    {len(csp_hashes)}')
print(f'    missing from CSP (would be blocked): {len(missing)}')
print(f'    extra in CSP (unused):               {len(extra)}')
print(f'    [{"PASS" if not missing and not extra else "FAIL"}] complete coverage')

# ---- 5. JSON-LD in dist/index.html ----
print('\n[5] dist/index.html preserves JSON-LD:')
with open('dist/index.html') as f: html = f.read()
jsonld_count = len(re.findall(r'<script[^>]*application/ld\+json[^>]*>', html))
print(f'    JSON-LD <script> blocks: {jsonld_count}  {"PASS" if jsonld_count > 0 else "FAIL"}')

# ---- 6. External analytics scripts in homepage ----
print('\n[6] dist/index.html includes external analytics:')
checks = [
    ('/js/sw-register.js', 'SW register external'),
    ('/js/gtag-init.js', 'gtag init external'),
    ('data-gtag-id="G-8LLESL207Q"', 'gtag ID passed via data attr'),
    ('googletagmanager.com', 'gtag.js CDN (will be loaded by gtag-init.js at runtime)'),
]
for needle, desc in checks:
    found = needle in html
    print(f'    [{"PASS" if found else "FAIL"}] {desc}: {needle}')

print('\n' + '=' * 70)
print('OVERALL: ' + ('PASS' if typo_count == 0 and all_pass and not missing else 'FAIL'))
print('=' * 70)