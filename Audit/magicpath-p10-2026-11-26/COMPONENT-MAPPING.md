# Component mapping — P10

**الحالة العامة: PARTIAL / NOT ACCEPTED.** التغيير المحلي يطبّق shell ومؤشرات على صفحة المختبر فقط؛ لا يثبت تطابق rendering مع MagicPath ولا تفعيل بقية عناصر القبول.

| MagicPath region | المصدر المحلي المرشح | الموجود بحسب المصدر والدليل | الفجوة / الحالة |
|---|---|---|---|
| App shell / sidebar / topbar | `src/pages/demo/governance.astro`, `src/scripts/governance-demo.ts` | RTL shell للصفحة العامة؛ sidebar ثابت على desktop وقائمة `details` قابلة للطي حتى 768px؛ topbar/hero وروابط الأقسام السبعة. E2E يتحقق من التنقل ولوحة المفاتيح والاستجابة | تنفيذ محلي جزئي؛ لا pipeline أو modal مطابق ولا مقارنة screenshot؛ `PARTIAL` |
| Overview / metrics | `src/pages/demo/governance.astro`, `src/scripts/governance-demo.ts` | أربعة أعداد live من session: الأصول، الأحداث، تقييمات المخاطر، والإحالات المفتوحة للأصل المحدد. E2E يثبت 2 أصول/5 أحداث/0 تقييمات/0 إحالات في الحالة المتكاملة | ليست شاشة Overview الكاملة في المرجع؛ مصادر الأرقام public synthetic؛ parity غير متحقق؛ `PARTIAL` |
| Scenario editor | `src/demo/governance.mjs`, `src/scripts/governance-demo.ts` | سيناريوهات محددة لفحص Firewall وتقييم Risk؛ Session core محدود | لا تغطية كاملة لخيارات guided/custom والقطاع/السياسة كما بالمرجع؛ `PARTIAL` |
| Governance pipeline | `src/demo/governance.mjs`, `src/demo/governance-evidence.mjs` | مسارات Firewall/Risk/Human Gate/Ledger تجريبية في الجلسة العامة | لا دليل على pipeline واحد مطابق للحالات والانتقالات في النموذج؛ `NOT VERIFIED` |
| Product panes | `src/pages/demo/[product].astro` + مكونات workspace | صفحة governance تجمع أقسامًا محدودة؛ صفحات منفصلة لـFirewall وRisk Engine وHuman Gate وLedger وSecure Chat | ليست جميع panes المرجعية داخل shell؛ التكافؤ غير مثبت؛ `PARTIAL` |
| Registry | `src/pages/demo/governance.astro` + `src/demo/governance.mjs`; registry الحوكمة في `src/server/governance/registry.mjs` | إضافة قوالب أصول اصطناعية وتحديث القائمة والأعداد؛ E2E يضيف أصلًا ويبدل للسجل الجديد | لا توصيل إلى registry المؤسسة، ولا search/filter/revisions من UI؛ `PARTIAL` |
| Policy library | `src/pages/demo/governance.astro`, `src/demo/governance.mjs`, `src/server/governance/internal-pack.mjs` | حزمتان توضيحيتان؛ E2E يطبق supervision ويختبر نتيجة Firewall والإحالة والمراجعة | لا عرض إصدار/اعتماد/تطبيق مؤسسي؛ الحزم العامة منفصلة عن approved/published policies؛ `PARTIAL` |
| Developer workbench | لا شاشة عامة مقابلة عُثر عليها ضمن الملفات المفحوصة | عقود API محلية في `src/server/api/request-schemas.mjs` و`routes.mjs` | لم يُعثر على Workbench في الشاشات التي تمت مراجعتها؛ `NOT VERIFIED` |
| Trust center | `/trust/` (يلزم فحص الصفحة عند الاستكمال) | مسار Trust مستقل معروف من بنية الموقع | لا mapping لمحتوى المكوّن أو أدلة badge هنا؛ `NOT VERIFIED` |
| Enterprise request modal | صفحة `/request-access/` ومسار `/contact/`؛ CTA في shell المحلي | روابط طلب/تواصل منفصلة؛ لا إرسال من داخل المختبر العام | لا مطابقة modal ولا تدفق success/error/retry في shell؛ `NOT VERIFIED` |
| Tokens / styling | `src/styles/variables.css`, `src/styles/design-system.css` | shell يستخدم tokens الموجودة ويدعم RTL/reflow؛ axe/overflow E2E عند 320/768/1440 PASS؛ candidate captures عند 1440×900 و390×844 | لا screenshot مرجعي ولا overlay/diff؛ token parity غير مثبت؛ `BLOCKED` |

## شروط النقل قبل التنفيذ

1. حفظ كامل ملفات revision المرجعي محليًا كمرجع read-only، مع hash لكل ملف.
2. بناء Astro/TypeScript محليًا دون استيراد `App.tsx` أو `src/index.css` من النموذج، وبلا React dependency جديدة دون مبرر.
3. ربط public synthetic وenterprise authenticated كلٌ في سياقه؛ لا خلط لصلاحيات أو بيانات المسارين.
4. الحفاظ على RTL وkeyboard/focus وresponsive وCSP؛ الدليل الحالي smoke للمرشح، وليس مراجعة شاملة.
5. تنفيذ screenshot parity فقط بعد التقاط source preview والمرشح من نفس revision وعلى المقاسات المطلوبة.
