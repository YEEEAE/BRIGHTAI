
import os
import re

# Mapping of old CSS files to new bundles
CSS_MAPPING = {
    'critical.css': 'bundle-critical.css',
    'design-tokens.css': 'bundle-critical.css',
    'typography.css': 'bundle-critical.css',
    
    'navigation.css': 'bundle-main.css',
    'utilities.css': 'bundle-main.css',
    'glass-morphism.css': 'bundle-main.css',
    'core-components.css': 'bundle-main.css',
    'hero.css': 'bundle-main.css',
    'main.min.css': 'bundle-main.css',
    'premium-effects.min.css': 'bundle-main.css',
    
    'chat-widget.css': 'bundle-components.css',
    'search.css': 'bundle-components.css',
    'smart-search.css': 'bundle-components.css',
    'chatbot.css': 'bundle-components.css',
    
    'our-products.css': 'bundle-pages.css',
    'ai-bots.css': 'bundle-pages.css',
    'Docs.css': 'bundle-pages.css',
    'brightrecruiter.css': 'bundle-pages.css',
    'brightsales-pro.css': 'bundle-pages.css'
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    seen_bundles = set()
    modified = False

    # Pre-scan for existing bundles to avoid duplication if they already exist
    for line in lines:
        for bundle in set(CSS_MAPPING.values()):
            if bundle in line and '<link' in line and 'stylesheet' in line:
                seen_bundles.add(bundle)

    for line in lines:
        # Check if line is a CSS link
        if '<link' in line and 'stylesheet' in line and 'href=' in line:
            # Check if it references an old CSS file
            replaced = False
            for old_css, new_bundle in CSS_MAPPING.items():
                if old_css in line:
                    # Found a match!
                    if new_bundle in seen_bundles:
                        # Bundle already included, verify if it's the exact same line or a new one
                        # If we already have the bundle in the file (or added it), we skip this line
                        # BUT, we need to be careful. The pre-scan adds existing bundles.
                        # If we are replacing 'navigation.css' with 'bundle-main.css', and 'bundle-main.css' was NOT in the original file,
                        # but we just added it for 'utilities.css' in previous line, then seen_bundles has it.
                        
                        # Case 1: Line is exactly importing the new bundle (already processed or existing) -> Keep it
                        if new_bundle in line: 
                            break # Don't replace, just keep as is (handled by else below)
                        
                        # Case 2: Line is importing old file, and we already have the bundle -> Skip/Delete
                        # Comment out instead of deleting to be safe, or just skip. Let's skip.
                        modified = True
                        replaced = True
                        break 
                    else:
                        # First time seeing this bundle for this file
                        # Replace the filename in the line
                        new_line = line.replace(old_css, new_bundle)
                        new_lines.append(new_line)
                        seen_bundles.add(new_bundle)
                        modified = True
                        replaced = True
                        break
            
            if not replaced:
                new_lines.append(line)
        else:
            new_lines.append(line)

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Updated: {file_path}")

def main():
    root_dir = '/Users/yzydalshmry/Desktop/BrightAI'
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.html'):
                file_path = os.path.join(dirpath, filename)
                process_file(file_path)

if __name__ == '__main__':
    main()
