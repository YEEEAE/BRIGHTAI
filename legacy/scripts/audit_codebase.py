
import os
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, unquote

PROJECT_ROOT = '/Users/yzydalshmry/Desktop/BrightAI'
SITEMAP_PATH = os.path.join(PROJECT_ROOT, 'sitemap.xml')
INDEX_PATH = os.path.join(PROJECT_ROOT, 'index.html')

# Extensions to track
TRACKED_EXTS = {'.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.json', '.txt', '.xml', '.pdf'}

def get_all_files(root_dir):
    all_files = set()
    for dirpath, _, filenames in os.walk(root_dir):
        if '.git' in dirpath or 'node_modules' in dirpath:
            continue
        for f in filenames:
            ext = os.path.splitext(f)[1].lower()
            if ext in TRACKED_EXTS:
                full_path = os.path.join(dirpath, f)
                rel_path = os.path.relpath(full_path, root_dir)
                all_files.add(rel_path)
    return all_files

def parse_sitemap(sitemap_path):
    urls = set()
    if not os.path.exists(sitemap_path):
        return urls
    
    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
        # Namespace handling might be needed depending on xml structure, simplifying for now
        # usually {http://www.sitemaps.org/schemas/sitemap/0.9}url
        for child in root:
            for sub in child:
                if 'loc' in sub.tag:
                    url = sub.text.strip()
                    parsed = urlparse(url)
                    path = parsed.path.strip('/')
                    if not path:
                        path = 'index.html'
                    else:
                        if not os.path.splitext(path)[1]:
                             path += '.html' # Assumption for clean URLs
                        
                    urls.add(path)
    except Exception as e:
        print(f"Error parsing sitemap: {e}")
    return urls

def extract_links(file_content, file_ext):
    links = set()
    # Regex for href, src, url()
    # This is a heuristic and might produce false positives/negatives
    patterns = [
        r'href=["\']([^"\']+)["\']',
        r'src=["\']([^"\']+)["\']',
        r'url\(["\']?([^"\')]+)["\']?\)',
        r'content=["\']([^"\']+\.(?:png|jpg|jpeg|webp|ico))["\']' # Meta tags
    ]
    
    for p in patterns:
        matches = re.findall(p, file_content)
        for m in matches:
            # Clean up link
            link = m.split('#')[0].split('?')[0]
            if link.startswith('http') or link.startswith('//') or link.startswith('mailto:') or link.startswith('tel:'):
                continue
            
            # Handle absolute vs relative
            # We will try to resolve later
            links.add(link)
            
    return links

def simple_resolve(link, current_file_rel_path):
    # Try to resolve relative link to absolute path relative to PROJECT_ROOT
    if link.startswith('/'):
        return link.lstrip('/')
    
    dirname = os.path.dirname(current_file_rel_path)
    resolved = os.path.normpath(os.path.join(dirname, link))
    return resolved

def main():
    all_files = get_all_files(PROJECT_ROOT)
    print(f"Total tracked files: {len(all_files)}")
    
    reachable = set()
    queue = set()
    
    # 1. Seeds
    if os.path.exists(INDEX_PATH):
        reachable.add('index.html')
        queue.add('index.html')
        
    sitemap_links = parse_sitemap(SITEMAP_PATH)
    for l in sitemap_links:
        # Sitemap links are often "clean" (no extension), need to map to files
        candidates = [l, l + '.html', l + '/index.html']
        for c in candidates:
            if c in all_files:
                if c not in reachable:
                    reachable.add(c)
                    queue.add(c)
                break
                
    # 2. BFS
    processed = set()
    
    while queue:
        current_rel = queue.pop()
        processed.add(current_rel)
        
        full_path = os.path.join(PROJECT_ROOT, current_rel)
        if not os.path.exists(full_path):
            continue
            
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            raw_links = extract_links(content, os.path.splitext(current_rel)[1])
            
            for link in raw_links:
                # Attempt resolution
                resolved = simple_resolve(link, current_rel)
                
                # Check exact match
                if resolved in all_files:
                    if resolved not in reachable:
                        reachable.add(resolved)
                        queue.add(resolved)
                    continue

                # Try adding .html if missing
                if resolved + '.html' in all_files:
                    r = resolved + '.html'
                    if r not in reachable:
                        reachable.add(r)
                        queue.add(r)
                    continue
                    
                # Try index.html if directory
                if os.path.join(resolved, 'index.html') in all_files:
                     r = os.path.join(resolved, 'index.html')
                     if r not in reachable:
                        reachable.add(r)
                        queue.add(r)
                     continue

        except Exception as e:
            print(f"Error reading {current_rel}: {e}")

    # 3. Report
    orphans = all_files - reachable
    
    print(f"\nReachable files: {len(reachable)}")
    print(f"Orphaned files: {len(orphans)}")
    
    with open('scan_results.txt', 'w') as f:
        f.write("=== ORPHANED FILES ===\n")
        for o in sorted(orphans):
            f.write(f"{o}\n")

if __name__ == '__main__':
    main()
