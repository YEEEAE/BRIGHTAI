import os
from datetime import datetime
from xml.etree import ElementTree as ET
from xml.dom import minidom

class SitemapGenerator:
    def __init__(self, domain):
        self.domain = domain
        self.urlset = ET.Element('urlset')
        self.urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
        self.urlset.set('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1')
        self.urlset.set('xmlns:xhtml', 'http://www.w3.org/1999/xhtml')

    def add_url(self, path, priority, changefreq, images=None, languages=None):
        url = ET.SubElement(self.urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = f"{self.domain}/{path.lstrip('/')}"
        
        lastmod = ET.SubElement(url, 'lastmod')
        lastmod.text = datetime.now().strftime('%Y-%m-%d')
        
        freq = ET.SubElement(url, 'changefreq')
        freq.text = changefreq
        
        pri = ET.SubElement(url, 'priority')
        pri.text = str(priority)

        if languages:
            for lang, lang_path in languages.items():
                link = ET.SubElement(url, '{http://www.w3.org/1999/xhtml}link')
                link.set('rel', 'alternate')
                link.set('hreflang', lang)
                link.set('href', f"{self.domain}/{lang_path.lstrip('/')}")

        if images:
            for img in images:
                image = ET.SubElement(url, '{http://www.google.com/schemas/sitemap-image/1.1}image')
                img_loc = ET.SubElement(image, '{http://www.google.com/schemas/sitemap-image/1.1}loc')
                img_loc.text = img['loc']
                img_title = ET.SubElement(image, '{http://www.google.com/schemas/sitemap-image/1.1}title')
                img_title.text = img['title']

    def save(self, filename):
        xmlstr = minidom.parseString(ET.tostring(self.urlset)).toprettyxml(indent="  ")
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(xmlstr)

if __name__ == '__main__':
    generator = SitemapGenerator('https://brightaii.com')
    
    # Add main page
    generator.add_url('', 1.0, 'daily', 
        images=[{'loc': 'https://brightaii.com/assets/images/hero-banner.jpg', 
                'title': 'BrightAI - AI Solutions'}],
        languages={'ar': 'ar/', 'en': ''})
    
    # Add core pages
    core_pages = ['ai-agent', 'tools', 'data-analysis', 'smart-automation', 'consultation']
    for page in core_pages:
        generator.add_url(page, 0.9, 'daily', 
                         languages={'ar': f'ar/{page}', 'en': page})
    
    # Add blog section
    generator.add_url('blog', 0.8, 'daily', 
                     languages={'ar': 'ar/blog', 'en': 'blog'})
    
    # Save the sitemap
    generator.save('sitemap.xml')
