# Requirements Document

## Introduction

هذا المشروع يهدف إلى توحيد وتنظيف البيانات المنظمة (Structured Data) في موقع BrightAI، وتحديدًا Schema.org JSON-LD والـ Breadcrumb، لضمان إشارات SEO واضحة وغير مكررة لمحركات البحث. المشكلة الحالية هي وجود أكثر من JSON-LD Schema في نفس الصفحة، خصوصًا WebPage و BreadcrumbList، مما يسبب تكرار وإرباك لمحركات البحث.

الهدف النهائي هو:
- توحيد كل Schema في صفحة واحدة داخل `@graph`
- إزالة التكرار في WebPage، BreadcrumbList، FAQPage، Organization
- تصحيح Breadcrumb في صفحات الحلول ليشير إلى `/solutions/`
- إنشاء صفحة Hub للحلول إن لم تكن موجودة
- توليد تقرير شامل بالتغييرات

## Glossary

- **Schema_Unification_System**: النظام المسؤول عن توحيد وتنظيف JSON-LD Schema في صفحات الموقع
- **Breadcrumb_Validator**: المكون المسؤول عن التحقق من صحة واتساق Breadcrumb المرئي مع BreadcrumbList JSON-LD
- **Page_Scanner**: المكون المسؤول عن فحص الصفحات واكتشاف Schema المكرر
- **Solutions_Hub**: صفحة مركزية تعرض جميع الحلول المتاحة في الموقع
- **Report_Generator**: المكون المسؤول عن توليد تقرير التنظيف النهائي
- **HTML_Page**: أي صفحة HTML في الموقع تحتوي على محتوى وmetadata
- **JSON_LD_Block**: كتلة `<script type="application/ld+json">` تحتوي على بيانات منظمة
- **Graph_Structure**: بنية `@graph` داخل JSON-LD التي تحتوي على مصفوفة من الكيانات
- **Schema_Type**: نوع الكيان في Schema.org مثل WebPage، Organization، BreadcrumbList، FAQPage
- **Duplicate_Schema**: وجود أكثر من Schema من نفس النوع في نفس الصفحة
- **Visual_Breadcrumb**: مسار التنقل المرئي الظاهر للمستخدم في واجهة الصفحة
- **Canonical_URL**: الرابط الأساسي للصفحة المحدد في `<link rel="canonical">`

## Requirements

### Requirement 1: فحص وتحديد الصفحات المستهدفة

**User Story:** كمهندس SEO تقني، أريد فحص جميع صفحات HTML المحددة في الموقع، حتى أتمكن من تحديد الصفحات التي تحتوي على Schema مكرر أو غير منظم.

#### Acceptance Criteria

1. THE Page_Scanner SHALL scan all HTML files in the following paths: `index.html`, `docs/index.html`, `docs/**/*.html`, `solutions/**/*.html`, `services/index.html`, `contact/index.html`, `pricing/index.html`, `privacy-policy/index.html`, `terms/index.html`, `cookie-policy/index.html`, `data-processing-agreement/index.html`, `pdpl-statement/index.html`
2. WHEN a HTML_Page is scanned, THE Page_Scanner SHALL identify all JSON_LD_Block elements within the page
3. WHEN multiple JSON_LD_Block elements are found in a single HTML_Page, THE Page_Scanner SHALL flag the page as containing potential duplicate Schema
4. THE Page_Scanner SHALL extract all Schema_Type values from each JSON_LD_Block
5. WHEN duplicate Schema_Type values are found within a single HTML_Page, THE Page_Scanner SHALL record the page path and duplicate types for reporting

### Requirement 2: توحيد Schema في بنية @graph واحدة

**User Story:** كمهندس SEO تقني، أريد توحيد جميع Schema في كل صفحة داخل JSON-LD واحد باستخدام بنية @graph، حتى تكون الإشارات واضحة وغير مكررة لمحركات البحث.

#### Acceptance Criteria

1. THE Schema_Unification_System SHALL ensure each HTML_Page contains exactly one primary JSON_LD_Block with `type="application/ld+json"`
2. THE Schema_Unification_System SHALL structure the unified JSON_LD_Block using a Graph_Structure with `"@context": "https://schema.org"` and `"@graph": []`
3. WHEN multiple JSON_LD_Block elements exist in a HTML_Page, THE Schema_Unification_System SHALL merge all valid Schema entities into a single Graph_Structure
4. THE Schema_Unification_System SHALL preserve all unique Schema entities during unification
5. WHEN merging Schema entities, THE Schema_Unification_System SHALL remove duplicate Schema_Type entries (WebPage, BreadcrumbList, FAQPage, Organization)
6. THE Schema_Unification_System SHALL maintain proper `@id` references between related Schema entities after unification

### Requirement 3: تحديد Schema المناسب لكل نوع صفحة

**User Story:** كمهندس SEO تقني، أريد أن يحتوي كل نوع صفحة على Schema المناسب فقط، حتى لا تحتوي الصفحات على Schema غير ضروري أو مضلل.

#### Acceptance Criteria

1. THE Schema_Unification_System SHALL include Organization, WebSite, WebPage, and BreadcrumbList Schema_Type in the Graph_Structure for all pages
2. WHERE a HTML_Page contains visible FAQ content in its HTML markup, THE Schema_Unification_System SHALL include FAQPage Schema_Type in the Graph_Structure
3. WHERE a HTML_Page does not contain visible FAQ content, THE Schema_Unification_System SHALL NOT include FAQPage Schema_Type
4. WHERE a HTML_Page represents an article or guide with publication metadata, THE Schema_Unification_System SHALL include Article or BlogPosting Schema_Type in the Graph_Structure
5. WHERE a HTML_Page clearly presents a software product or platform, THE Schema_Unification_System SHALL include SoftwareApplication Schema_Type in the Graph_Structure
6. THE Schema_Unification_System SHALL NOT include Schema_Type entities that do not match the actual content and purpose of the HTML_Page

### Requirement 4: إنشاء صفحة Solutions Hub

**User Story:** كمهندس SEO تقني، أريد إنشاء صفحة مركزية للحلول على `/solutions/` إذا لم تكن موجودة، حتى يكون هناك مسار تنقل صحيح ومنطقي لصفحات الحلول الفرعية.

#### Acceptance Criteria

1. WHEN the file `solutions/index.html` does not exist, THE Schema_Unification_System SHALL create a new Solutions_Hub page at that path
2. THE Solutions_Hub SHALL have the title "حلول BrightAI لحوكمة وأمان الذكاء الاصطناعي"
3. THE Solutions_Hub SHALL contain navigation links to all solution pages: `/solutions/ai-governance-platform/`, `/solutions/ai-firewall/`, `/solutions/ai-audit-trail/`, `/solutions/human-approval-layer/`, `/solutions/ai-evidence-file/`, `/solutions/continuous-ai-governance/`, `/solutions/ai-risk-classification/`, `/solutions/ai-use-case-discovery/`, `/solutions/policy-to-control-mapping/`
4. THE Solutions_Hub SHALL include proper meta tags (title, description, canonical)
5. THE Solutions_Hub SHALL include unified JSON-LD Schema with Organization, WebSite, WebPage, and BreadcrumbList in a Graph_Structure
6. THE Solutions_Hub BreadcrumbList SHALL contain exactly two items: "الرئيسية" (position 1) and "الحلول" (position 2)

### Requirement 5: تصحيح Breadcrumb في صفحات الحلول

**User Story:** كمهندس SEO تقني، أريد تصحيح Breadcrumb في جميع صفحات الحلول ليشير إلى المسار الصحيح (الرئيسية > الحلول > اسم الحل)، حتى يكون التنقل منطقيًا ومتسقًا.

#### Acceptance Criteria

1. WHEN a HTML_Page path starts with `/solutions/` and is not the Solutions_Hub, THE Breadcrumb_Validator SHALL ensure the BreadcrumbList contains exactly three items
2. THE Breadcrumb_Validator SHALL set BreadcrumbList item at position 1 to "الرئيسية" with URL "https://brightai.site/"
3. THE Breadcrumb_Validator SHALL set BreadcrumbList item at position 2 to "الحلول" with URL "https://brightai.site/solutions/"
4. THE Breadcrumb_Validator SHALL set BreadcrumbList item at position 3 to the solution-specific name with the full solution page URL
5. WHEN a solution page previously referenced "الخدمات" in its Breadcrumb, THE Breadcrumb_Validator SHALL replace it with "الحلول"
6. THE Breadcrumb_Validator SHALL ensure the Visual_Breadcrumb in the HTML markup matches the BreadcrumbList JSON-LD structure exactly

### Requirement 6: التحقق من عدم التكرار

**User Story:** كمهندس SEO تقني، أريد التأكد من عدم وجود Schema مكرر في أي صفحة، حتى تكون الإشارات لمحركات البحث واضحة ودقيقة.

#### Acceptance Criteria

1. THE Schema_Unification_System SHALL ensure each HTML_Page contains exactly one H1 heading element
2. THE Schema_Unification_System SHALL ensure each HTML_Page contains exactly one Canonical_URL link element
3. THE Schema_Unification_System SHALL ensure each HTML_Page contains exactly one BreadcrumbList Schema_Type in its Graph_Structure
4. THE Schema_Unification_System SHALL ensure each HTML_Page contains exactly one WebPage Schema_Type in its Graph_Structure
5. THE Schema_Unification_System SHALL ensure each HTML_Page contains at most one FAQPage Schema_Type in its Graph_Structure
6. THE Schema_Unification_System SHALL ensure each HTML_Page contains at most one Organization Schema_Type in its Graph_Structure
7. WHEN validation detects duplicate Schema_Type entries, THE Schema_Unification_System SHALL merge or remove duplicates to maintain exactly one instance per type

### Requirement 7: الحفاظ على Metadata الحالي

**User Story:** كمهندس SEO تقني، أريد التأكد من أن عملية التوحيد لا تحذف أو تعدل Meta Description أو Canonical أو Open Graph، حتى لا تتأثر إشارات SEO الأخرى سلبًا.

#### Acceptance Criteria

1. WHEN the Schema_Unification_System modifies a HTML_Page, THE Schema_Unification_System SHALL preserve all existing `<meta name="description">` elements
2. WHEN the Schema_Unification_System modifies a HTML_Page, THE Schema_Unification_System SHALL preserve all existing `<link rel="canonical">` elements
3. WHEN the Schema_Unification_System modifies a HTML_Page, THE Schema_Unification_System SHALL preserve all existing Open Graph meta tags (`<meta property="og:*">`)
4. WHEN the Schema_Unification_System modifies a HTML_Page, THE Schema_Unification_System SHALL preserve all existing Twitter Card meta tags (`<meta name="twitter:*">`)
5. THE Schema_Unification_System SHALL only modify JSON_LD_Block elements and Visual_Breadcrumb HTML markup
6. THE Schema_Unification_System SHALL NOT alter any other HTML head elements or body content beyond Breadcrumb navigation

### Requirement 8: توليد تقرير شامل

**User Story:** كمهندس SEO تقني، أريد تقرير شامل يوثق جميع التغييرات التي تمت، حتى أتمكن من مراجعة النتائج وتتبع التحسينات.

#### Acceptance Criteria

1. THE Report_Generator SHALL create a report file at `reports/seo/schema-breadcrumb-cleanup-report.md`
2. THE Report_Generator SHALL list all HTML_Page paths that contained Duplicate_Schema before cleanup
3. THE Report_Generator SHALL list all HTML_Page paths that were successfully cleaned and unified
4. THE Report_Generator SHALL indicate whether the Solutions_Hub was created or already existed
5. THE Report_Generator SHALL document the final BreadcrumbList structure for each solution page
6. THE Report_Generator SHALL list any HTML_Page paths that require future manual review
7. THE Report_Generator SHALL include a summary section with total pages scanned, pages modified, and pages requiring attention
8. THE Report_Generator SHALL include before-and-after examples of Schema structure for at least two representative pages

### Requirement 9: التحقق من صحة البنية النهائية

**User Story:** كمهندس SEO تقني، أريد التحقق من أن البنية النهائية لكل صفحة صحيحة ومتوافقة مع معايير Schema.org، حتى لا تظهر أخطاء في أدوات اختبار البيانات المنظمة.

#### Acceptance Criteria

1. THE Schema_Unification_System SHALL validate that each Graph_Structure contains valid JSON syntax
2. THE Schema_Unification_System SHALL validate that each Schema_Type in the Graph_Structure includes required properties according to Schema.org specifications
3. WHEN a BreadcrumbList is present, THE Schema_Unification_System SHALL validate that all itemListElement entries have sequential position values starting from 1
4. WHEN a BreadcrumbList is present, THE Schema_Unification_System SHALL validate that each itemListElement contains both "name" and "item" properties
5. THE Schema_Unification_System SHALL validate that all `@id` references within the Graph_Structure point to valid entities
6. WHEN validation fails for any Schema entity, THE Schema_Unification_System SHALL log the error and flag the HTML_Page for manual review in the report

### Requirement 10: إنشاء Git Commit

**User Story:** كمهندس SEO تقني، أريد حفظ جميع التغييرات في commit واحد بوصف واضح، حتى يمكن تتبع التغييرات والرجوع إليها عند الحاجة.

#### Acceptance Criteria

1. WHEN all HTML_Page modifications are complete, THE Schema_Unification_System SHALL stage all modified files for commit
2. THE Schema_Unification_System SHALL create a Git commit with the message "Unify structured data and solution breadcrumbs"
3. THE Schema_Unification_System SHALL include all modified HTML files in the commit
4. THE Schema_Unification_System SHALL include the generated report file in the commit
5. THE Schema_Unification_System SHALL include the Solutions_Hub file in the commit if it was created
6. THE Schema_Unification_System SHALL NOT commit any unrelated files or changes outside the scope of this feature
