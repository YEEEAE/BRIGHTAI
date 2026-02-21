import os
from bs4 import BeautifulSoup
from glob import glob

BLOGGER_DIR = '/Users/yzydalshmry/Desktop/BrightAI/frontend/pages/blogger/'

def fix_responsive():
    html_files = glob(os.path.join(BLOGGER_DIR, '*.html'))
    count = 0
    for file_path in html_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            html = f.read()
            
        soup = BeautifulSoup(html, 'html.parser')
        modified = False
        
        # 1. Breadcrumbs
        breadcrumbs_nav = soup.find_all('nav', attrs={'aria-label': 'breadcrumb'})
        if not breadcrumbs_nav:
            breadcrumbs_nav = soup.find_all('nav', class_=lambda c: c and 'breadcrumb' in c)
            
        for nav in breadcrumbs_nav:
            bc = nav.find('ol')
            if bc:
                classes = bc.get('class', [])
                changed_bc = False
                if 'space-x-2' in classes:
                    classes.remove('space-x-2')
                    changed_bc = True
                if 'space-x-reverse' in classes:
                    classes.remove('space-x-reverse')
                    changed_bc = True
                if 'flex-wrap' not in classes:
                    classes.append('flex-wrap')
                    changed_bc = True
                if 'gap-x-2' not in classes:
                    classes.append('gap-x-2')
                    changed_bc = True
                if 'gap-y-1' not in classes:
                    classes.append('gap-y-1')
                    changed_bc = True
                if 'items-center' not in classes:
                    classes.append('items-center')
                    changed_bc = True
                if changed_bc:
                    bc['class'] = classes
                    modified = True
            
        # 2. CTAs
        ctas = soup.find_all('div', class_='article-cta')
        for cta in ctas:
            btn = cta.find('a', class_=lambda c: c and 'bg-purple-600' in c)
            if btn:
                classes = btn.get('class', [])
                if 'w-full' not in classes:
                    classes.extend(['w-full', 'md:w-auto'])
                    btn['class'] = classes
                    modified = True
            
            cta_classes = cta.get('class', [])
            if 'p-6' in cta_classes:
                new_classes = ['p-5' if c == 'p-6' else c for c in cta_classes]
                if 'md:p-6' not in new_classes:
                    new_classes.append('md:p-6')
                if 'mx-4' not in new_classes and 'w-full' not in new_classes:
                    # Optional: ensure it has side margins on very small screens, 
                    # but usually parent handles it. Let's trust parent.
                    pass
                cta['class'] = new_classes
                modified = True

        # 3. Related Articles
        related = soup.find_all('section', class_='related-articles')
        for rel in related:
            rel_classes = rel.get('class', [])
            if 'p-6' in rel_classes:
                new_rel_classes = ['p-5' if c == 'p-6' else c for c in rel_classes]
                if 'md:p-6' not in new_rel_classes:
                    new_rel_classes.append('md:p-6')
                rel['class'] = new_rel_classes
                modified = True

        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(str(soup))
            count += 1
            
    print(f"Fixed responsiveness in {count} files.")

if __name__ == '__main__':
    fix_responsive()
