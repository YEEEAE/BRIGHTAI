# 🚀 برومبتات تحسين منصة Bright AI Agents Platform

> **ملاحظة:** هذه البرومبتات مبنية على تحليل فعلي للكود المصدري للمنصة.
> استخدمها بالترتيب أو اختر حسب الأولوية.

---

## 🔴 أولوية حرجة (CRITICAL)

---

### برومبت 1: تقسيم الملفات العملاقة (Code Splitting & Refactoring)

```
أنت مهندس React متقدم.

لدي ملفات عملاقة في مشروع React + TypeScript:
- `AgentBuilder.tsx` → 2,379 سطر (97 KB)
- `Dashboard.tsx` → 2,031 سطر (73 KB)
- `AgentPersonalityEditor.tsx` → 46 KB
- `agent.executor.ts` → 49 KB
- `NodeEditor.tsx` → 37 KB
- `Marketplace.tsx` → 807 سطر (31 KB)

المطلوب:
1. قسّم كل ملف إلى مكونات أصغر (كل مكون أقل من 300 سطر)
2. استخرج الـ types/interfaces إلى ملفات منفصلة في `src/types/`
3. استخرج الـ utility functions إلى `src/lib/` أو `src/utils/`
4. استخرج الـ constants إلى `src/constants/`
5. حافظ على نفس الوظائف بالضبط — لا تغيير في المنطق
6. استخدم barrel exports (index.ts) لكل مجلد

ابدأ بـ `Dashboard.tsx` — قسّمه إلى:
- `DashboardPage.tsx` (الصفحة الرئيسية والـ layout)
- `StatCard.tsx` (بطاقة الإحصائيات)
- `MiniSparkline.tsx` (مخطط الخط الصغير)
- `ProgressRing.tsx` (حلقة التقدم)
- `AgentTable.tsx` (جدول الوكلاء)
- `ExecutionTable.tsx` (جدول التنفيذات)
- `ActivityFeed.tsx` (تغذية الأنشطة)
- `AlertsList.tsx` (قائمة التنبيهات)
- `dashboard.types.ts` (جميع الـ interfaces)
- `dashboard.utils.ts` (الدوال المساعدة مثل formatCurrency, toRelativeTime, getCache)

أعد الكود الكامل لكل ملف.
```

---

### برومبت 2: إصلاح أمان API Keys وحماية البيانات

```
أنت مهندس أمان تطبيقات ويب.

المشروع: منصة React + Supabase + Groq API
الملفات ذات العلاقة:
- `src/services/groq.service.ts` → يستخدم API key مباشرة من الواجهة الأمامية
- `src/services/apikey.service.ts` → 20 KB من منطق إدارة المفاتيح
- `src/lib/encryption.ts` → تشفير محلي
- `src/lib/security.ts` → أمان أساسي
- `src/.env.local` → يحتوي على REACT_APP_GROQ_API_KEY

المشاكل الأمنية المكتشفة:
1. API Key لـ Groq مكشوف في الـ Frontend (process.env.REACT_APP_GROQ_API_KEY)
2. الاستدعاءات تذهب مباشرة لـ `api.groq.com` من المتصفح — أي شخص يفتح Network tab يرى المفتاح
3. لا يوجد Rate Limiting على مستوى المستخدم
4. لا يوجد API Proxy

المطلوب:
1. أنشئ Supabase Edge Function كـ proxy لاستدعاءات Groq — الكود الكامل
2. حرّك API Key إلى Supabase Secrets (server-side فقط)
3. عدّل `groq.service.ts` ليستدعي الـ Edge Function بدلاً من Groq مباشرة
4. أضف Rate Limiting بناءً على user_id (مثلاً 100 طلب/ساعة)
5. أضف Request Validation وInput Sanitization
6. أضف logging لكل طلب في جدول Supabase

أعد الكود الكامل لـ:
- Edge Function (Deno/TypeScript)
- `groq.service.ts` المعدّل
- جدول Supabase للـ logs
- SQL migration
```

---

### برومبت 3: تحسين الأداء وتجربة التحميل

```
أنت مهندس أداء React متقدم.

المشروع يستخدم: React 19 + react-router-dom 6 + Tailwind 3 + recharts + reactflow + framer-motion

المشاكل المكتشفة:
1. الـ main bundle بعد gzip = 167 KB (كبير جداً)
2. chunk واحد = 91 KB (362.d5940640.chunk.js) — يحتاج تقسيم
3. صفحات كبيرة مثل Dashboard (73KB) و AgentBuilder (97KB) تُحمّل lazily لكن بطيئة
4. `index.css` يحمّل Google Fonts عبر @import (render-blocking)
5. recharts chunk = 45 KB منفصل لكن يُحمّل في كل صفحة تستخدمه
6. لا يوجد Service Worker مفعّل للـ caching

المطلوب:
1. حلل التبعيات وحدد أكبر 5 مكتبات حجماً — واقترح بدائل أخف
2. أنشئ dynamic imports لـ recharts و reactflow (تُحمّل فقط عند الحاجة)
3. انقل Google Fonts من @import إلى preload في `public/index.html`
4. فعّل Service Worker مع Cache-First strategy للأصول الثابتة
5. أضف Virtualization لجداول الوكلاء والتنفيذات (react-window موجودة فعلاً)
6. أضف Image lazy loading وskeleton screens
7. أضف prefetch للصفحات الأكثر زيارة

أعد:
- التعديلات على webpack config (عبر craco أو eject)
- `serviceWorkerRegistration.ts` المحدّث
- مكونات Skeleton لـ Dashboard و AgentBuilder
- تعديلات `index.css` و `public/index.html`
```

---

## 🟠 أولوية عالية (HIGH)

---

### برومبت 4: نظام إدارة الحالة (State Management Overhaul)

```
أنت مهندس React State Management.

الوضع الحالي:
- `src/store/workflowStore.ts` → Zustand store واحد فقط (1.8 KB)
- كل صفحة تدير حالتها محلياً (useState/useEffect) — لا مشاركة بين الصفحات
- `Dashboard.tsx` يحتوي على 15+ useState في مكون واحد
- `AgentBuilder.tsx` يحتوي على حالة form ضخمة (40+ حقل) بدون form management
- الـ caching يدوي عبر localStorage في Dashboard (CACHE_KEY, CACHE_TTL_MS)
- لا يوجد Global Auth State (كل صفحة تتحقق من session مستقلة)

المطلوب:
1. أنشئ Zustand stores منظمة:
   - `authStore.ts` → حالة المستخدم، الجلسة، الصلاحيات
   - `agentStore.ts` → قائمة الوكلاء، الوكيل الحالي، CRUD
   - `executionStore.ts` → التنفيذات، الفلاتر، التحديث الحي
   - `uiStore.ts` → السايدبار، الثيم، الإشعارات
   - `dashboardStore.ts` → الإحصائيات، الرسوم البيانية، الكاش

2. استخدم Zustand middleware:
   - `persist` → للكاش والتفضيلات
   - `devtools` → للتطوير
   - `subscribeWithSelector` → للتحديث الانتقائي

3. حوّل الـ form في AgentBuilder لاستخدام react-hook-form (موجود فعلاً في dependencies لكن غير مستخدم!)

4. أنشئ custom hooks:
   - `useCurrentUser()` → يقرأ من authStore
   - `useDashboardData()` → يجمع البيانات ويدير الكاش
   - `useAgentForm()` → يدير form الوكيل مع validation

أعد الكود الكامل لكل store و hook.
```

---

### برومبت 5: نظام الإشعارات والتنبيهات الحية (Real-time Notifications)

```
أنت مطور Full-Stack React + Supabase.

المشروع يستخدم Supabase Realtime (channel, removeChannel) لكن بشكل محدود فقط في Dashboard و Analytics.

المطلوب بناء نظام إشعارات محلي متكامل:

1. **جدول Supabase:**
   - `notifications` (id, user_id, title, body, type, action_url, is_read, created_at)
   - أنواع: agent_completed, agent_failed, api_key_expired, usage_limit, system_update

2. **مكون NotificationCenter:**
   - أيقونة جرس في الـ Header مع badge للعدد
   - Dropdown يعرض آخر 20 إشعار
   - تصنيف بالألوان حسب النوع
   - زر "قراءة الكل"
   - صوت تنبيه خفيف عند وصول إشعار جديد

3. **Supabase Realtime Subscription:**
   - اشتراك حي في جدول notifications
   - تحديث تلقائي بدون refresh

4. **Toast Notifications:**
   - استخدم react-hot-toast (موجود فعلاً)
   - أظهر toast عند:
     * نجاح تنفيذ وكيل
     * فشل تنفيذ وكيل
     * اقتراب حد الاستخدام (80%)
     * انتهاء صلاحية API Key

5. **إعدادات الإشعارات:**
   - في صفحة Settings (tab "الإشعارات") — المكون موجود لكن فارغ
   - تفعيل/إيقاف لكل نوع
   - تفعيل/إيقاف الصوت

أعد الكود الكامل: SQL migration + React components + Zustand store + integration.
```

---

### برومبت 6: تحسين تجربة المستخدم (UX Overhaul)

```
أنت مصمم UX/UI متخصص في لوحات تحكم SaaS عربية.

تحليل المنصة الحالية:
- 14 صفحة: HomePage, Dashboard, AgentBuilder (wizard 5 خطوات), AgentDetails, Templates, Marketplace, Analytics, Settings, Login, Signup, ForgotPassword, ResetPassword, WorkflowPage, NotFoundPage
- التصميم: Dark theme (emerald/slate) مع glassmorphism
- الخطوط: Cairo + Tajawal
- RTL كامل

المشاكل في UX:
1. HomePage بسيطة جداً — لا تعطي انطباع أول قوي
2. لا يوجد Onboarding للمستخدم الجديد
3. AgentBuilder بـ 5 خطوات لكن لا يوجد progress indicator واضح
4. لا يوجد Empty States مخصصة (المكون موجود لكن غير مستخدم بشكل كافٍ)
5. لا يوجد Keyboard shortcuts
6. لا يوجد Command Palette (CTRL+K)
7. الـ Mobile experience غير واضح

المطلوب:
1. **Onboarding Flow:**
   - ترحيب بعد أول تسجيل دخول
   - 3-4 خطوات تعريفية (اختر مجالك → أنشئ أول وكيل → جرّبه)
   - يمكن تخطيه

2. **Command Palette (CTRL+K):**
   - بحث سريع في: الوكلاء، القوالب، الصفحات، الإعدادات
   - اختصارات لوحة المفاتيح
   - مبني بـ framer-motion (موجودة فعلاً)

3. **تحسين AgentBuilder:**
   - شريط تقدم بصري واضح (Stepper)
   - حفظ تلقائي كل 30 ثانية (الـ draft system موجود لكن يحتاج تحسين)
   - زر "معاينة سريعة" في كل خطوة

4. **Micro-interactions:**
   - انيميشن عند نجاح/فشل العمليات
   - Hover effects على البطاقات
   - Transition بين الصفحات

أعد الكود الكامل لكل مكون مع التكامل.
```

---

## 🟡 أولوية متوسطة (MEDIUM)

---

### برومبت 7: اختبارات شاملة (Testing Suite)

```
أنت مهندس جودة برمجيات متخصص في React Testing.

المشروع الحالي:
- `App.test.tsx` → اختبار واحد فقط (449 bytes!)
- `setupTests.ts` → إعداد أساسي
- Dependencies: @testing-library/react, @testing-library/user-event, jest

لا يوجد أي اختبار حقيقي للمكونات أو الخدمات.

المطلوب:
1. **Unit Tests (src/lib/):**
   - `validators.test.ts` → اختبار كل دالة validation
   - `encryption.test.ts` → اختبار التشفير/فك التشفير
   - `utils.test.ts` → اختبار الأدوات المساعدة
   - `security.test.ts` → اختبار الأمان

2. **Service Tests (src/services/):**
   - `groq.service.test.ts` → Mock fetch + اختبار chat, streamChat, validateApiKey, error handling
   - `agent.executor.test.ts` → اختبار تنفيذ الوكلاء
   - `apikey.service.test.ts` → اختبار CRUD المفاتيح

3. **Component Tests (src/components/):**
   - `Button.test.tsx` → variants, disabled, loading
   - `Modal.test.tsx` → open, close, keyboard (Escape)
   - `Select.test.tsx` → options, search, selection
   - `Input.test.tsx` → validation, error display

4. **Integration Tests (src/pages/):**
   - `Login.test.tsx` → form submission, validation, redirect
   - `Dashboard.test.tsx` → data loading, error states, empty states

5. **Test utilities:**
   - `test-utils.tsx` → render wrapper مع providers (Router, i18n)
   - `mocks/supabase.ts` → Mock Supabase client
   - `mocks/groq.ts` → Mock Groq responses

أعد الكود الكامل لكل ملف اختبار.
```

---

### برومبت 8: SEO وMeta Tags للمنصة

```
أنت مهندس SEO تقني متخصص في تطبيقات React SPA.

المشكلة: المنصة React SPA — Google يرى فقط:
- title: "منصة Bright AI"
- description: "منصة لإدارة الأتمتة وتحليل البيانات بالذكاء الاصطناعي للشركات في السعودية"
- لا يوجد Open Graph
- لا يوجد Twitter Cards
- لا يوجد Structured Data

المطلوب:
1. **React Helmet:**
   - أضف react-helmet-async
   - أنشئ مكون `SEOHead.tsx` يقبل: title, description, image, type, url
   - أضف SEOHead لكل صفحة:
     * الرئيسية: "منصة الوكلاء الأذكياء | Bright AI"
     * لوحة التحكم: "لوحة التحكم | Bright AI Platform"
     * بناء وكيل: "بناء وكيل ذكي | Bright AI"
     * السوق: "سوق الوكلاء الأذكياء | Bright AI"
     * التحليلات: "تحليلات الأداء | Bright AI"
     * القوالب: "قوالب جاهزة للوكلاء | Bright AI"

2. **Open Graph + Twitter Cards** لكل صفحة

3. **Structured Data (JSON-LD):**
   - SoftwareApplication schema في `public/index.html`
   - Organization schema
   - FAQPage schema في الصفحة الرئيسية

4. **Pre-rendering:**
   - أضف react-snap أو prerender.io configuration
   - أو أنشئ `sitemap.xml` ثابت للصفحات العامة

5. **robots.txt** محدّث:
   - السماح بالصفحات العامة (/, /login, /signup)
   - منع الصفحات الخاصة (/dashboard, /agents, /settings)

أعد الكود الكامل.
```

---

### برومبت 9: نظام الصلاحيات والأدوار (RBAC)

```
أنت مهندس أمان وصلاحيات.

الوضع الحالي:
- Supabase Auth للمصادقة
- لا يوجد نظام أدوار أو صلاحيات
- كل المستخدمين لهم نفس الوصول
- `useAuth.ts` يتحقق من session فقط

المطلوب:
1. **جدول أدوار في Supabase:**
   - `user_roles` (user_id, role: 'owner' | 'admin' | 'member' | 'viewer')
   - `team_memberships` (team_id, user_id, role, invited_at, accepted_at)

2. **صلاحيات لكل دور:**
   - Owner: كل شيء + حذف الفريق + إدارة الفوترة
   - Admin: إنشاء/تعديل/حذف الوكلاء + إدارة الأعضاء
   - Member: إنشاء/تعديل الوكلاء + عرض التحليلات
   - Viewer: عرض فقط

3. **Row Level Security (RLS):**
   - سياسات Supabase لكل جدول بناءً على الدور
   - Agents: owner/admin يعدّل، member يشاهد ويُنشئ، viewer يشاهد فقط

4. **React Components:**
   - `PermissionGate.tsx` → يخفي العناصر حسب الصلاحية
   - `usePermissions()` hook → يُرجع الصلاحيات الحالية
   - تعديل `useAuth.ts` ليشمل الدور

5. **صفحة إدارة الفريق:**
   - دعوة أعضاء بالبريد
   - تغيير الأدوار
   - إزالة أعضاء

أعد: SQL migrations + RLS policies + React components + hooks.
```

---

### برومبت 10: التدويل المتقدم (i18n Enhancement)

```
أنت مطور متخصص في التدويل (i18n) للتطبيقات العربية.

الوضع الحالي:
- `src/i18n/` يحتوي على 3 ملفات
- useTranslation مستخدم في بعض الأماكن
- كثير من النصوص hardcoded بالعربية في المكونات مباشرة
- الأسماء العربية في الكود: خطوة, وضعسير, لهجة, حالةحفظ (مما يصعب الصيانة)

المشاكل:
1. خلط بين نصوص hardcoded ومترجمة
2. لا يوجد ملف ترجمة إنجليزية كامل
3. أسماء المتغيرات بالعربية تسبب مشاكل في بعض IDEs والأدوات
4. لا يوجد language switcher في الواجهة

المطلوب:
1. **استخراج كل النصوص:**
   - اسح كل ملفات tsx/ts
   - استخرج كل نص عربي إلى ملف `ar.json`
   - أنشئ `en.json` مع ترجمة كاملة

2. **إعادة تسمية المتغيرات:**
   - حوّل أسماء المتغيرات العربية إلى إنجليزية
   - مثال: خطوة → Step, حالةالنموذج → FormState, رسالةاختبار → TestMessage
   - أبقِ التعليقات بالعربية

3. **Language Switcher:**
   - مكون في الـ Header أو Settings
   - يحفظ الاختيار في localStorage
   - يغيّر RTL/LTR تلقائياً

4. **Number/Date formatting:**
   - استخدم Intl.NumberFormat مع locale
   - أنشئ hook `useLocaleFormat()` للأرقام والتواريخ والعملات

أعد الكود الكامل مع ملفات الترجمة.
```

---

### برومبت 11: توثيق API والمكونات (Documentation)

```
أنت كاتب توثيق تقني.

المشروع: منصة Bright AI Agents — React + TypeScript + Supabase

المطلوب:
1. **README.md محدّث:**
   - وصف المشروع
   - المتطلبات (Node, npm, Supabase)
   - خطوات التشغيل
   - المتغيرات البيئية (.env.local)
   - بنية المشروع (شجرة الملفات مع شرح كل مجلد)
   - أوامر مفيدة (start, build, test, lint)

2. **ARCHITECTURE.md:**
   - رسم بياني للهيكل (Mermaid)
   - تدفق البيانات (Supabase → Services → Hooks → Components → Pages)
   - تفاعل المكونات
   - نظام التوجيه (Routes)
   - إدارة الحالة

3. **CONTRIBUTING.md:**
   - قواعد الكود (naming conventions, file structure)
   - عملية الـ PR
   - معايير الكود

4. **Storybook Stories** (المجلد stories/ موجود لكن يحتوي 9 ملفات فقط):
   - أضف stories لـ: Button, Card, Badge, Modal, Input, Select, Tooltip, Loading, EmptyState
   - كل story يعرض جميع الـ variants

5. **JSDoc:**
   - أضف JSDoc لكل دالة عامة في services/ و lib/
   - أضف @param و @returns و @example

أعد الكود الكامل لكل ملف.
```

---

### برومبت 12: CI/CD وبيئة الإنتاج (DevOps)

```
أنت مهندس DevOps متخصص في مشاريع React.

الملفات الموجودة:
- `Dockerfile` → 391 bytes (أساسي جداً)
- `docker-compose.yml` → 1.2 KB
- `nginx.conf` → 2 KB
- `netlify.toml` → 942 bytes
- `vercel.json` → 1.2 KB
- `.github/` → مجلد واحد

المطلوب:
1. **GitHub Actions CI/CD:**
   - `.github/workflows/ci.yml`:
     * Lint + Type Check
     * Unit Tests
     * Build
     * Bundle Size Check (فشل إذا تجاوز 200KB gzip)
   - `.github/workflows/deploy.yml`:
     * Deploy to Vercel (staging on PR, production on main)

2. **Dockerfile محسّن:**
   - Multi-stage build
   - Non-root user
   - Health check
   - حجم أصغر (Alpine + nginx)

3. **Docker Compose:**
   - خدمات: app, supabase-local, redis (للكاش)
   - volumes للبيانات المحلية
   - health checks

4. **nginx.conf محسّن:**
   - Gzip compression
   - Browser caching (1 year للـ static assets)
   - Security headers (CSP, X-Frame-Options, HSTS)
   - SPA fallback إلى index.html

5. **Monitoring:**
   - Sentry (موجود كـ dependency @sentry/react لكن غير مفعّل)
   - فعّل Sentry error tracking
   - أضف performance monitoring
   - أضف custom breadcrumbs

أعد الكود الكامل لكل ملف.
```

---

## 📋 ترتيب التنفيذ المقترح

| # | البرومبت | الأولوية | التأثير | الجهد |
|---|---------|---------|--------|------|
| 1 | تقسيم الملفات العملاقة | 🔴 حرج | قابلية صيانة | متوسط |
| 2 | إصلاح أمان API Keys | 🔴 حرج | أمان | عالي |
| 3 | تحسين الأداء | 🔴 حرج | سرعة | عالي |
| 4 | إدارة الحالة | 🟠 عالي | هيكلة | متوسط |
| 6 | تحسين UX | 🟠 عالي | تجربة مستخدم | عالي |
| 5 | نظام الإشعارات | 🟠 عالي | ميزة جديدة | متوسط |
| 8 | SEO للمنصة | 🟡 متوسط | اكتشاف | منخفض |
| 9 | نظام الصلاحيات | 🟡 متوسط | أمان | عالي |
| 7 | الاختبارات | 🟡 متوسط | جودة | عالي |
| 10 | التدويل | 🟡 متوسط | توسع | متوسط |
| 11 | التوثيق | 🟡 متوسط | صيانة | منخفض |
| 12 | CI/CD | 🟡 متوسط | بنية تحتية | متوسط |
