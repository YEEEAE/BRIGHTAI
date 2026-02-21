import os

file_path = '/Users/yzydalshmry/Desktop/BrightAI/index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: remove box-shadow from global transitions
content = content.replace(
'''        input,
        [role="button"] {
            transition-property: transform, opacity, box-shadow !important;''',
'''        input,
        [role="button"] {
            transition-property: transform, opacity !important;'''
)

# Fix 2: missing <li> wrap
content = content.replace(
'''                    </a>
                </li>
                <a aria-expanded="false" aria-haspopup="true"
                    class="mobile-nav-link flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-200 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
                    href="#">''',
'''                    </a>
                </li>
                <li>
                <a aria-expanded="false" aria-haspopup="true"
                    class="mobile-nav-link flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-200 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
                    href="#">'''
)

# Fix 3: tap targets in mobile CTA
content = content.replace(
'''            <!-- Mobile CTA -->
            <div class="mt-6 pt-6" style="border-top: 1px solid rgba(255,255,255,0.06);">
                <a class="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all"
                    href="https://wa.me/966538229013" target="_blank" rel="noopener noreferrer"
                    style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 20px rgba(99,102,241,0.3);">
                    <iconify-icon icon="lucide:message-circle" width="18"></iconify-icon>
                    ابدأ رحلة التحول
                </a>
                <a class="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-xl text-slate-400 font-medium text-sm hover:text-white hover:bg-white/[0.04] transition-all"
                    href="frontend/pages/try/index.html">''',
'''            <!-- Mobile CTA -->
            <div class="mt-6 pt-6" style="border-top: 1px solid rgba(255,255,255,0.06);">
                <a class="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl text-white font-bold text-[15px] transition-all"
                    href="https://wa.me/966538229013" target="_blank" rel="noopener noreferrer"
                    style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                    <iconify-icon icon="lucide:message-circle" width="18"></iconify-icon>
                    ابدأ رحلة التحول
                </a>
                <a class="flex items-center justify-center gap-2 w-full py-4 mt-4 rounded-xl text-slate-400 font-medium text-[15px] hover:text-white hover:bg-white/[0.04] transition-all"
                    href="frontend/pages/try/index.html">'''
)

# Fix 4: box-shadow on btn.primary
content = content.replace(
'''        .btn.primary {
            transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease !important;
        }''',
'''        .btn.primary {
            transition: transform 0.2s ease, opacity 0.2s ease !important;
        }'''
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done applying patches.')
