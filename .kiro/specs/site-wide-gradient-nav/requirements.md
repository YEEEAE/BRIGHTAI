# Requirements Document

## Introduction

تطبيق التدرج اللوني الموحد (الوردي-البنفسجي) وشريط التنقل الموحد على جميع صفحات الموقع، مع التأكد من أن جميع الروابط تعمل بشكل صحيح.

## Glossary

- **Unified_Gradient**: التدرج اللوني الموحد `linear-gradient(135deg, #EC4899, #8B5CF6, #6366F1)`
- **Unified_Nav**: شريط التنقل الموحد مع الروابط المحددة
- **Main_Pages**: الصفحات الرئيسية للموقع (index.html, our-products.html, health-bright.html, data-analysis.html, consultation.html, smart-automation.html, blog.html, about.html, ai-bots.html, ai-agent.html, Docs.html)
- **Nav_Links**: روابط التنقل في الشريط العلوي
- **CSS_Files**: ملفات الأنماط المستخدمة في الموقع

## Requirements

### Requirement 1: تطبيق التدرج الموحد على جميع الصفحات

**User Story:** كمستخدم، أريد أن أرى نفس التدرج اللوني (الوردي-البنفسجي) على جميع صفحات الموقع، حتى يكون المظهر متناسقاً.

#### Acceptance Criteria

1. THE Unified_Gradient SHALL be applied to all Main_Pages body elements
2. WHEN a page loads, THE body background SHALL display `linear-gradient(135deg, #EC4899, #8B5CF6, #6366F1)`
3. THE old turquoise/navy colors (#64FFDA, #0A192F, #112240) SHALL be replaced with the unified gradient colors
4. THE gradient SHALL be consistent across all CSS files

### Requirement 2: تطبيق شريط التنقل الموحد

**User Story:** كمستخدم، أريد أن أرى نفس شريط التنقل على جميع الصفحات مع جميع الروابط المطلوبة.

#### Acceptance Criteria

1. THE Unified_Nav SHALL contain the following links in order:
   - الرئيسية → index.html
   - خدمات الذكاء الاصطناعي → our-products.html
   - تحليل البيانات → data-analysis.html
   - استشارات الذكاء الاصطناعي → consultation.html
   - الأتمتة الذكية → smart-automation.html
   - المكتبة الذكية → blog.html
   - عن شركة مُشرقة AI → Docfile/About.Bright.AI.html
   - الوكلاء → ai-agent.html
   - DOCS → Docs.html
   
2. THE Unified_Nav SHALL contain dropdown menu "أنظمة ذكية بالكامل لأقسام شركتك":
   - نظام توظيف ذكي متكامل → h/projects/interview/index.html
   - ثورة الذكاء الاصطناعي في الرعاية الصحية → health-bright.html
   
3. THE Unified_Nav SHALL contain dropdown menu "أدوات ذكية مجانية":
   - أدوات ذكية مجانية → tools.html
   - نماذج AI تجريبية → h/index.html
   - شات بوت → ai-bots.html

4. WHEN a user clicks on a nav link, THE browser SHALL navigate to the correct page
5. THE Unified_Nav SHALL be applied to all Main_Pages

### Requirement 6: تصميم Hamburger Menu للهواتف والقوائم المنسدلة

**User Story:** كمستخدم على الهاتف، أريد أن أرى قائمة hamburger سهلة الاستخدام للتنقل بين الصفحات.

#### Acceptance Criteria

1. THE Hamburger_Menu SHALL appear on screens smaller than 768px
2. WHEN the hamburger icon is clicked, THE nav menu SHALL slide open/close smoothly
3. THE Hamburger_Menu SHALL contain all the same links as the desktop nav including dropdowns
4. THE Hamburger_Menu SHALL have a clean, modern design matching the gradient theme
5. THE desktop nav SHALL display horizontally on screens larger than 768px
6. THE nav SHALL be responsive and work on all screen sizes (mobile, tablet, desktop)
7. THE dropdown menus SHALL open on hover (desktop) and on click (mobile)
8. THE dropdown menus SHALL have smooth animation transitions
9. THE dropdown items SHALL be clearly visible with proper contrast

### Requirement 3: التأكد من صحة الروابط الداخلية

**User Story:** كمستخدم، أريد أن تعمل جميع الروابط بشكل صحيح وتنقلني للصفحة المطلوبة.

#### Acceptance Criteria

1. THE Nav_Links SHALL use correct relative paths based on page location
2. WHEN a page is in a subdirectory, THE Nav_Links SHALL use appropriate relative paths (e.g., ../index.html)
3. THE Nav_Links SHALL be tested to ensure they navigate to the correct pages

### Requirement 4: إزالة الألوان القديمة

**User Story:** كمطور، أريد إزالة جميع الألوان القديمة (التركوازي والأزرق الداكن) واستبدالها بالألوان الموحدة.

#### Acceptance Criteria

1. THE CSS_Files SHALL NOT contain the old turquoise color (#64FFDA)
2. THE CSS_Files SHALL NOT contain the old navy colors (#0A192F, #112240, #1D3A5F)
3. THE inline styles in HTML files SHALL be updated to use unified colors
4. THE related-services sections SHALL use the unified gradient instead of navy gradient

### Requirement 5: تحديث جميع ملفات HTML

**User Story:** كمطور، أريد تحديث جميع ملفات HTML لتستخدم التدرج والتنقل الموحد.

#### Acceptance Criteria

1. THE following HTML files SHALL be updated:
   - index.html
   - our-products.html
   - health-bright.html
   - data-analysis.html
   - consultation.html
   - smart-automation.html
   - blog.html
   - ai-bots.html
   - ai-agent.html
   - Docs.html
   - tools.html
   - contact.html
   - about-us.html
   - brightrecruiter.html
   - brightsales-pro.html
   - brightproject-pro.html
2. WHEN updating a page, THE nav structure SHALL match the unified nav exactly
3. THE CSS link to unified-gradient.css SHALL be added to all pages

