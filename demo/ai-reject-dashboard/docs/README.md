# Documentation Hub

هذه الوثائق تم إعدادها بصياغة داخلية بواسطة يزيد، QC Compliance في شركة ميس، لدعم تجربة واختبار مشروع ai-reject-dashboard قبل الاستخدام الفعلي، وتحت مراجعة QCM دكتور اسلام والإدارة العامة للمصنع بقيادة Factory Director المهندس عبدالرحمن.

## مقدمة من يزيد
أنا يزيد، QC Compliance في شركة ميس. جهزت هذا المجلد عشان يكون مرجع داخلي مرتب لمشروع `ai-reject-dashboard`، مو مجرد README عام. الفكرة إن أي شخص يدخل المشروع يقدر يعرف وش تسوي كل صفحة، من وين تجي البيانات، وش دور `صقر AI`، كيف يتم ربط Excel، وكيف نختبر النظام قبل أي استخدام فعلي.

هذا التوثيق موجه بشكل أساسي لفريق الجودة، الإنتاج، المالية، التقنية، وفريق BrightAI. كذلك هو مفيد لي أنا كـ QC Compliance وقت التجربة والمتابعة، ومفيد للدكتور اسلام QCM في مراجعة نقاط الجودة والاعتماد، ومفيد للمهندس عبدالرحمن Factory Director في الاطلاع على جاهزية المشروع والمخاطر العالية من منظور إداري.

> ملاحظة مهمة: دوري هنا تجهيز وتوثيق ومتابعة تجربة النظام. لا أنسب لنفسي أي اعتماد نهائي. مخرجات `صقر AI` استشارية فقط، وقرارات الجودة النهائية ترجع إلى QCM/QAM حسب الإجراء الداخلي.

## وش يقدم هذا المجلد؟
هذا المجلد يقدم خريطة تشغيلية كاملة للمشروع:

- يشرح وظيفة كل صفحة ومن المستخدم المستهدف لها.
- يوضح مصدر بيانات كل صفحة، وهل البيانات من Excel أو API أو cache أو Gemini.
- يربط الصفحات بالـ API endpoints الفعلية.
- يوثق دور `صقر AI` وحدود استخدامه ونص الرفض المطلوب.
- يوضح طريقة قراءة Excel من Backend فقط.
- يشرح حماية `GEMINI_API_KEY` وعدم ظهوره في Frontend.
- يعطي Checklists عملية لـ UAT، regression، تحديث Excel، واختبار AI.
- يفرّق بين `Implemented` و`Partially Implemented` و`Planned` و`Not Implemented` و`Needs Verification`.
- يحصر القرارات المعلقة اللي تحتاج مراجعة من QCM دكتور اسلام أو اطلاع Factory Director المهندس عبدالرحمن.

## طريقة استخدام الوثائق
- إذا أنت جديد على المشروع، ابدأ من [Project Overview](./00-overview/project-overview.md) ثم [Architecture Overview](./00-overview/architecture-overview.md).
- إذا تراجع صفحة معينة، افتح ملفها من [Pages Documentation](./01-pages/README.md).
- إذا عندك مشكلة بيانات أو Excel، ابدأ من [Excel Data Source](./02-data/excel-data-source.md) ثم [Data Quality Rules](./02-data/data-quality-rules.md).
- إذا تراجع `صقر AI` أو Gemini، ابدأ من [صقر AI Overview](./03-ai/saqr-ai-overview.md) ثم [AI Safety Rules](./03-ai/ai-safety-rules.md).
- إذا تختبر النظام، ابدأ من [UAT Checklist](./06-testing/uat-checklist.md) ثم [Regression Checklist](./06-testing/regression-checklist.md).
- إذا تجهز تشغيل محلي أو نشر، ابدأ من [Local Setup](./07-deployment/local-setup.md) ثم [Production Readiness](./07-deployment/production-readiness.md).
- إذا تحتاج تعرف وش باقي ما اعتمدناه، راجع [Pending Decisions](./08-decisions/pending-decisions.md) و[Known Limitations](./08-decisions/known-limitations.md).

## Overview
- [Overview Section Guide](./00-overview/README.md)
- [Project Overview](./00-overview/project-overview.md)
- [Architecture Overview](./00-overview/architecture-overview.md)
- [Folder Structure](./00-overview/folder-structure.md)
- [Pilot Readiness](./00-overview/pilot-readiness.md)

## Pages Documentation
- [Pages Section Guide](./01-pages/README.md)
- [Index Page](./01-pages/index-page.md)
- [Executive Page](./01-pages/executive-page.md)
- [Finance Page](./01-pages/finance-page.md)
- [Quality Page](./01-pages/quality-page.md)
- [Production Page](./01-pages/production-page.md)
- [Workflow Page](./01-pages/workflow-page.md)
- [Technical Page](./01-pages/technical-page.md)
- [Reports Page](./01-pages/reports-page.md)
- [Profile Page](./01-pages/profile-page.md)
- [Admin Users Page](./01-pages/admin-users-page.md)

## Data Layer
- [Data Section Guide](./02-data/README.md)
- [Excel Data Source](./02-data/excel-data-source.md)
- [Excel Schema](./02-data/excel-schema.md)
- [Data Processing](./02-data/data-processing.md)
- [Realtime Updates](./02-data/realtime-updates.md)
- [Data Quality Rules](./02-data/data-quality-rules.md)

## AI Layer
- [AI Section Guide](./03-ai/README.md)
- [صقر AI Overview](./03-ai/saqr-ai-overview.md)
- [Gemini Integration](./03-ai/gemini-integration.md)
- [System Prompts](./03-ai/system-prompts.md)
- [Session Memory](./03-ai/session-memory.md)
- [AI Safety Rules](./03-ai/ai-safety-rules.md)
- [Prompt Injection Protection](./03-ai/prompt-injection-protection.md)

## API Layer
- [API Section Guide](./04-api/README.md)
- [API Overview](./04-api/api-overview.md)
- [Auth API](./04-api/auth-api.md)
- [Data API](./04-api/data-api.md)
- [Rejects API](./04-api/rejects-api.md)
- [Reports API](./04-api/reports-api.md)
- [AI API](./04-api/ai-api.md)
- [Health API](./04-api/health-api.md)

## Security
- [Security Section Guide](./05-security/README.md)
- [Security Overview](./05-security/security-overview.md)
- [Environment Secrets](./05-security/environment-secrets.md)
- [Auth & RBAC](./05-security/auth-rbac.md)
- [Audit Logging](./05-security/audit-logging.md)
- [Deployment Security](./05-security/deployment-security.md)

## Testing
- [Testing Section Guide](./06-testing/README.md)
- [Testing Strategy](./06-testing/testing-strategy.md)
- [UAT Checklist](./06-testing/uat-checklist.md)
- [Excel Update Test](./06-testing/excel-update-test.md)
- [AI Test Cases](./06-testing/ai-test-cases.md)
- [Regression Checklist](./06-testing/regression-checklist.md)

## Deployment
- [Deployment Section Guide](./07-deployment/README.md)
- [Local Setup](./07-deployment/local-setup.md)
- [Production Readiness](./07-deployment/production-readiness.md)
- [Environment Variables](./07-deployment/environment-variables.md)
- [Troubleshooting](./07-deployment/troubleshooting.md)

## Decisions
- [Decisions Section Guide](./08-decisions/README.md)
- [Technical Decisions](./08-decisions/technical-decisions.md)
- [Pending Decisions](./08-decisions/pending-decisions.md)
- [Known Limitations](./08-decisions/known-limitations.md)

## قواعد ثابتة في كل الوثائق
- اسم النموذج دائماً: `صقر AI`.
- لا يتم اعتبار مخرجات `صقر AI` قرار جودة نهائي.
- لا يتم كشف `GEMINI_API_KEY` في Frontend.
- أي ميزة غير مؤكدة توصف بـ `Needs Verification`.
- أي ميزة مخططة فقط توصف بـ `Planned`.
- أي ميزة موجودة جزئياً توصف بـ `Partially Implemented`.
- أي قرار اعتماد نهائي يرجع إلى QCM/QAM حسب الإجراء الداخلي.
