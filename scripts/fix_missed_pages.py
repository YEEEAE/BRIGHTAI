
import os

def replace_scripts(filepath, relative_path_to_dist):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    lines = content.split('\n')
    new_lines = []
    
    # Simple state machine to drop consecutive script tags at the end or specific local scripts
    # But since I don't know exactly where they are, I'll filter out lines containing matches
    # and append the bundle at the end of body.
    
    known_old_scripts = [
        'js/hero-canvas.min.js', 'advanced-ai-analysis.min.js', 'script.min.js', 
        'tailwind-config.min.js', 'animations.min.js', 'three-effects.min.js', 'design-system.js',
        'pages/recruitment.js'
    ]
    
    for line in lines:
        is_old = False
        for script in known_old_scripts:
            if script in line and '<script' in line:
                is_old = True
                break
        if not is_old:
            new_lines.append(line)
            
    final_content = '\n'.join(new_lines)
    
    bundles = f"""
    <!-- JavaScript Bundles (Consolidated) -->
    <script src="{relative_path_to_dist}/core.bundle.js" defer></script>
    <script src="{relative_path_to_dist}/ui.bundle.js" defer></script>
    <script src="{relative_path_to_dist}/app.bundle.js" defer></script>
    <script src="{relative_path_to_dist}/features.bundle.js" defer></script>
    <script src="{relative_path_to_dist}/pages.bundle.js" defer></script>
    """
    
    if '</body>' in final_content:
        final_content = final_content.replace('</body>', bundles + '\n</body>')
    else:
        final_content += bundles

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"Updated {filepath}")

def main():
    tasks = [
        ('services/recruitment-system.html', '../frontend/js/dist'),
        ('services/_template.html', '../frontend/js/dist'),
        ('h/projects/interview/index.html', '../../../frontend/js/dist'),
        ('h/projects/interview/pages/admin.html', '../../../../frontend/js/dist'),
        ('h/projects/interview/pages/Visitor-registration/index.html', '../../../../../frontend/js/dist'),
        ('frontend/assets/fonts/enterprise-hero.html', '../../js/dist')
    ]
    
    for path, rel in tasks:
        if os.path.exists(path):
            replace_scripts(path, rel)
        else:
            print(f"File not found: {path}")

if __name__ == "__main__":
    main()
