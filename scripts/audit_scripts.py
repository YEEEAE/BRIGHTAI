
import os
import re

def scan_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    # regex to match script src
    script_pattern = re.compile(r'<script\s+.*src=["\']([^"\']+)["\'].*>', re.IGNORECASE)
    matches = script_pattern.findall(content)
    
    if matches:
        local_matches = [src for src in matches if not src.startswith('http') and not src.startswith('//')]
        if local_matches:
            print(f"File: {filepath}")
            for src in local_matches:
                print(f"  - {src}")

def main():
    exclude_dirs = ['node_modules', '.git'] 
    # traverse manually to filter better if needed, but os.walk with check is fine
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                # Skip already completed folder to reduce noise? No, let's verify checking index.html too
                scan_file(filepath)

if __name__ == "__main__":
    main()
