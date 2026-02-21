import re

with open('/Users/yzydalshmry/Desktop/BrightAI/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

toc_target = "            <li><a href=\"#saudi-use-cases\">حالات استخدام سعودية حسب القطاع</a></li>\n"
aiaas_toc = "            <li><a href=\"#aiaas\">الذكاء الاصطناعي كخدمة AIaaS</a></li>\n"

# 1. Remove from TOC
if toc_target in lines:
    lines.remove(toc_target)
else:
    print("toc_target not found")

# 2. Insert into TOC right after aiaas_toc
try:
    aiaas_idx = lines.index(aiaas_toc)
    lines.insert(aiaas_idx + 1, toc_target)
except ValueError:
    print("aiaas_toc not found")

# 3. Find saudi-use-cases section
start_idx, end_idx = -1, -1
for i, line in enumerate(lines):
    if '<section class="section pt-8" id="saudi-use-cases">' in line:
        start_idx = i
    if start_idx != -1 and '</section>' in line and i > start_idx:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    section_lines = lines[start_idx:end_idx+1]
    # Remove from original location
    del lines[start_idx:end_idx+1]
else:
    print("saudi-use-cases section not found")
    section_lines = []

# 4. Find robotics section and insert there
if section_lines:
    robotics_idx = -1
    for i, line in enumerate(lines):
        if '<!-- Section 14: Robotics -->' in line:
            robotics_idx = i
            break
    
    if robotics_idx != -1:
        # Insert
        for j, line in enumerate(section_lines):
            lines.insert(robotics_idx + j, line)
    else:
        print("robotics section not found")

with open('/Users/yzydalshmry/Desktop/BrightAI/index.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
