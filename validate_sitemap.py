#!/usr/bin/env python3
"""
Script to validate that sitemap.xml includes all important pages
"""

import xml.etree.ElementTree as ET
import os
import re

def extract_urls_from_sitemap(sitemap_path):
    """Extract all URLs from sitemap.xml"""
    urls = []
    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for url in root.findall('ns:url', namespace):
            loc = url.find('ns:loc', namespace)
            if loc is not None:
                urls.append(loc.text)
    except Exception as e:
        print(f"Error parsing sitemap: {e}")
    
    return urls

def find_important_html_files():
    """Find important HTML files that should be in sitemap"""
    important_files = []
    
    # Main pages
    main_pages = [
        '', 'about-us.html', 'contact.html', 'our-products.html',
        'ai-bots.html', 'smart-automation.html', 'data-analysis.html',
        'consultation.html', 'blog.html', 'tools.html', 'Docs.html',
        'ai-agent.html', 'brightproject-pro.html', 'brightrecruiter.html',
        'brightsales-pro.html'
    ]
    
    # Important blogger articles
    blogger_patterns = [
        'ai-generative-content', 'case-study', 'future-of-intelligent',
        'will-ai-change-job', 'production-line'
    ]
    
    # botAI products
    botai_pages = [
        'BrightMath.html', 'BrightProject.html', 'BrightRecruiter.html',
        'BrightSales.html', 'BrightSupport.html'
    ]
    
    # Other important directories
    other_dirs = [
        'Customer/index.html', 'h/index.html', 'h/who_we_are.html',
        'Saudi tourism and heritage services/index.html'
    ]
    
    # Check if files exist
    for page in main_pages:
        if os.path.exists(page):
            important_files.append(f"https://brightai.site/{page}")
    
    # Check botAI pages
    for page in botai_pages:
        path = f"botAI/{page}"
        if os.path.exists(path):
            important_files.append(f"https://brightai.site/{path}")
    
    # Check other directories
    for path in other_dirs:
        if os.path.exists(path):
            important_files.append(f"https://brightai.site/{path}")
    
    return important_files

def main():
    print("🔍 Validating sitemap.xml coverage...")
    print("=" * 50)
    
    # Get URLs from sitemap
    sitemap_urls = extract_urls_from_sitemap('sitemap.xml')
    print(f"📊 Sitemap contains {len(sitemap_urls)} URLs")
    
    # Get important files that should be in sitemap
    important_files = find_important_html_files()
    print(f"📁 Found {len(important_files)} important pages that should be in sitemap")
    
    # Check coverage
    missing_files = []
    for file_url in important_files:
        if file_url not in sitemap_urls:
            missing_files.append(file_url)
    
    print("\n✅ Coverage Report:")
    print(f"   Total important pages: {len(important_files)}")
    print(f"   Pages in sitemap: {len(important_files) - len(missing_files)}")
    print(f"   Missing from sitemap: {len(missing_files)}")
    
    if missing_files:
        print("\n❌ Missing pages:")
        for missing in missing_files[:10]:  # Show first 10 missing
            print(f"   - {missing}")
        if len(missing_files) > 10:
            print(f"   ... and {len(missing_files) - 10} more")
    else:
        print("\n🎉 All important pages are included in sitemap!")
    
    # Check robots.txt
    print("\n" + "=" * 50)
    print("🔍 Checking robots.txt...")
    
    if os.path.exists('robots.txt'):
        with open('robots.txt', 'r') as f:
            robots_content = f.read()
            if 'Sitemap: https://brightai.site/sitemap.xml' in robots_content:
                print("✅ robots.txt correctly references sitemap.xml")
            else:
                print("❌ robots.txt missing sitemap reference")
    else:
        print("❌ robots.txt not found")

if __name__ == "__main__":
    main()
