import os
import re

def update_file_content(file_path, is_root_file=False):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Define replacements based on file location
    # If file is in root (index.html), assets are in frontend/...
    # If file is in frontend/pages/, assets are in ../...
    
    if is_root_file:
        # Update Asset Paths for Root File
        content = re.sub(r'(["\'])css/', r'\1frontend/css/', content)
        content = re.sub(r'(["\'])js/', r'\1frontend/js/', content)
        content = re.sub(r'(["\'])assets/', r'\1frontend/assets/', content)
        
        # Update Page Links for Root File (pointing to pages moved to frontend/pages/)
        pages = [
            'about-us.html', 'ai-agent.html', 'ai-bots.html', 'ai-workflows.html', 'blog.html',
            'brightproject-pro.html', 'brightrecruiter.html', 'brightsales-pro.html', 'consultation.html',
            'consultingblog.html', 'contact.html', 'data-analysis.html', 'faq_content.html',
            'health-bright.html', 'job.MAISco.html', 'machine.html', 'nlp.html', 'our-products-new.html',
            'our-products.html', 'physical-ai.html', 'privacy-cookies.html', 'smart-automation.html',
            'solutions.html', 'terms-and-conditions.html', 'tools.html', 'try.html', 'what-is-ai.html'
        ]
        for page in pages:
            # Replace href="page.html" with href="frontend/pages/page.html"
            content = re.sub(f'(["\']){page}(["\'])', f'\\1frontend/pages/{page}\\2', content)

    else:
        # Update Asset Paths for Pages in frontend/pages/
        # CSS/JS/Assets are now one level up relative to frontend/pages/
        # logic: frontend/pages/ is depth 2 from frontend root? No.
        # Structure:
        # root/frontend/pages/file.html
        # root/frontend/css/
        # root/frontend/js/
        # root/frontend/assets/
        
        # So to get from pages/file.html to css/, we need ../css/
        
        # First, handle existing relative paths that might be correct or incorrect
        # We assume original paths were relative to project root like "css/style.css"
        
        content = re.sub(r'(["\'])css/', r'\1../css/', content)
        content = re.sub(r'(["\'])js/', r'\1../js/', content)
        content = re.sub(r'(["\'])assets/', r'\1../assets/', content)
        
        # Fix specific files that were in root and moved
        # e.g. <link href="Docs.css"> became <link href="frontend/css/Docs.css"> (if using absolute) 
        # but here we want relative.
        # If the original was "Docs.css", it is now in "../css/Docs.css"
        moved_css = ['Docs.css', 'ai-bots.css', 'brightrecruiter.css', 'brightsales-pro.css', 'chatbot.css', 'our-products.css', 'smart-search.css']
        for css in moved_css:
             content = re.sub(f'(["\']){css}(["\'])', f'\\1../css/{css}\\2', content)

        moved_js = ['Docs.js', 'ai-agent.js', 'ai-bots.js', 'blog.js', 'brightai-app.js', 'brightrecruiter.js', 'chatbot.js', 'data-analysis.js', 'our-products.js', 'scroll-animations.js', 'service-worker.js', 'smart-automation.js', 'smart-search.js', 'tools.js', 'sw.js']
        for js in moved_js:
             content = re.sub(f'(["\']){js}(["\'])', f'\\1../js/{js}\\2', content)
             
        moved_images = ['Gemini.png', 'Gemini.webp']
        for img in moved_images:
             content = re.sub(f'(["\']){img}(["\'])', f'\\1../assets/images/{img}\\2', content)

        # Update Link to Index (Home)
        # index.html is at root ../../index.html
        content = re.sub(r'(["\'])index.html(["\'])', r'\1../../index.html\2', content)
        
        # Start: Also handle links between sibling pages (they are now in same dir, so no change needed, UNLESS key referred to them with folder prefix? No, they were all in root)
        # So href="about-us.html" works fine if both are in frontend/pages/
        
        # HOWEVER, we need to be careful not to double replace if run multiple times.
        # This script is a one-off.

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {file_path}")

# Run for Index
if os.path.exists('index.html'):
    update_file_content('index.html', is_root_file=True)

# Run for Pages
pages_dir = 'frontend/pages'
if os.path.exists(pages_dir):
    for filename in os.listdir(pages_dir):
        if filename.endswith('.html'):
            update_file_content(os.path.join(pages_dir, filename), is_root_file=False)
