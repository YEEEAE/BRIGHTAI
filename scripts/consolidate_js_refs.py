
import os
import re

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    
    # regex to match local js scripts
    # matches src="..." where ... contains .js and does not start with http
    script_pattern = re.compile(r'<script\s+.*src=["\'](?!http)(.*\.js)["\'].*>\s*</script>', re.IGNORECASE)
    
    if 'core.bundle.js' in content:
        print(f"Skipping {filepath}: already updated.")
        return

    for line in lines:
        match = script_pattern.search(line)
        if match:
             if 'bundle.js' in line:
                 new_lines.append(line)
             else:
                 pass
        else:
            new_lines.append(line)

    final_content = '\n'.join(new_lines)
    
    bundles_html = """
    <!-- JavaScript Bundles (Consolidated) -->
    <script src="../js/dist/core.bundle.js" defer></script>
    <script src="../js/dist/ui.bundle.js" defer></script>
    <script src="../js/dist/app.bundle.js" defer></script>
    <script src="../js/dist/features.bundle.js" defer></script>
    <script src="../js/dist/pages.bundle.js" defer></script>
    """
    
    if '</body>' in final_content:
        final_content = final_content.replace('</body>', bundles_html + '\n</body>')
    else:
        final_content += bundles_html

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"Updated {filepath}")

def main():
    pages_dir = '/Users/yzydalshmry/Desktop/BrightAI/frontend/pages'
    for filename in os.listdir(pages_dir):
        if filename.endswith('.html') and filename != 'try.html':
            filepath = os.path.join(pages_dir, filename)
            update_file(filepath)

if __name__ == "__main__":
    main()
