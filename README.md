
# githib

git add .
git commit -m "feat: direct push"
git push origin main



لاختبار جودة وعمل api :
npm run smoke-test:prod

# BrightAI Monorepo

هذا المستودع الآن مُدار كـ `npm workspaces` بثلاث وحدات مستقلة:

- `frontend` (واجهات static)
- `backend` (Node API + functional tests)
- `brightai-platform` (React platform)

## هيكل الوحدات

| الوحدة | المسار | التشغيل | الاختبار |
|---|---|---|---|
| Frontend | `frontend/` | `npm run dev:frontend` | `npm run test:frontend` |
| Backend | `backend/` | `npm run dev:backend` | `npm run test:backend` |
| BrightAI Platform | `brightai-platform/` | `npm run dev:platform` | `npm run test:platform` |

## استراتيجية التشغيل (بعزل)

- كل وحدة لها `package.json` خاص فيها.
- التشغيل يتم من الجذر عبر workspace محدد، بدون مشاركة runtime command بين الوحدات.
- أوامر الجذر:
  - `npm run dev:frontend`
  - `npm run dev:backend`
  - `npm run dev:platform`

## استراتيجية الاختبار (بعزل)

- `frontend`: اختبارات smoke عبر Node test runner داخل `frontend/tests` فقط.
- `backend`: اختبارات Vitest عبر `backend/vitest.config.mjs` وبنطاق `*.functional.test.js` داخل الوحدة فقط.
- `brightai-platform`: اختبارات `react-scripts test` داخل الوحدة فقط.

## منع تداخل الاختبارات

- لا يوجد أمر عام يعتمد على glob شامل لكل المشروع.
- كل وحدة تُختبر بأمرها المحلي عبر workspace.
- أمر `npm test` في الجذر يشغّل `scripts/run-monorepo-tests.mjs`، وينفّذ الاختبارات للوحدات الثلاث بالتسلسل مع ملخص نهائي منفصل لكل وحدة.

## أمر الاختبار الواحد

```bash
npm test
```

النتيجة المتوقعة:
- إذا نجحت كل الوحدات: يخرج بنجاح.
- إذا فشلت وحدة: يعرض سبب الفشل الخاص بها (مثال: نقص dependencies أو فشل اختبارات)، ثم ينهي بخروج غير صفري.

## تثبيت الحزم

من الجذر:

```bash
npm install
```

أو تثبيت لوحدة محددة:

```bash
npm install --workspace frontend
npm install --workspace backend
npm install --workspace brightai-platform
```

## أوامر إضافية في الجذر

- `npm run sitemap:all`
- `npm run seo:check`
- `npm run performance:budget`
- `npm run deploy:source-of-truth:check`

## حوكمة النشر

- Netlify هو المزود الرسمي للإنتاج.
- مصدر الحقيقة الوحيد لـ redirects/security headers/caching هو `netlify.toml`.
- الدليل التشغيلي: `docs/deployment-governance.md`

### حالة حماية الفرع الحالية (`main`)

- Required check إلزامي: `Validate Netlify Source of Truth`
- `required_approving_review_count = 0` (لا تحتاج موافقة بشرية للدمج)
- `enforce_admins = true` (تنطبق القواعد حتى على الأدمن)

### هل تحتاج تشغيل الأوامر كل مرة؟

- **لا، ليس كل الأوامر كل مرة.**
- إعدادات حماية الفرع عبر `gh api` هي إعداد لمرة واحدة فقط (إلا إذا أردت تغيير السياسة لاحقًا).
- فحص CI (`Validate Netlify Source of Truth`) يعمل تلقائيًا على `pull_request` و`push`.
- محليًا، شغّل هذا الأمر عند تعديل ملفات النشر (`netlify.toml` أو `.htaccess` أو `_headers` أو سكربتات التحقق):
  - `npm run deploy:source-of-truth:check`
- إذا تعديلاتك لا تمس إعدادات النشر، تشغيل الأمر محليًا يبقى اختياريًا.

## سجل آخر 5 محادثات تنفيذية

### 1) توحيد Netlify كمصدر حقيقة وحيد للإنتاج
**Description:**  
مراجعة التضارب بين `netlify.toml` و`.htaccess` و`_headers`، ثم توحيد قواعد redirects/security headers/caching داخل `netlify.toml` فقط، مع تحويل الملفات الأخرى لأرشيف توثيقي.

**Terminal Commands:**
```bash
rg --files -g 'netlify.toml' -g '.htaccess' -g '_headers'
sed -n '1,260p' netlify.toml
sed -n '1,260p' .htaccess
sed -n '1,260p' _headers
mkdir -p docs/deployment-archive && cp .htaccess docs/deployment-archive/.htaccess.legacy && cp _headers docs/deployment-archive/_headers.legacy
npm run deploy:source-of-truth:check
```

### 2) إضافة تحقق آلي وCI Gate
**Description:**  
إضافة سكربت تحقق `scripts/verify-netlify-source-of-truth.mjs`، وإضافة أمر npm مخصص، وإنشاء Workflow باسم `Netlify Source of Truth` لفرض الحوكمة تلقائيًا.

**Terminal Commands:**
```bash
npm run deploy:source-of-truth:check
git show --name-status --oneline --stat -1
```

### 3) تفعيل حماية فرع `main` وربط الفحص الإلزامي
**Description:**  
تفعيل Branch Protection على GitHub مع فرض check باسم `Validate Netlify Source of Truth` كشرط قبل الدمج، مع التأكد من الحالة عبر API.

**Terminal Commands:**
```bash
gh auth status
gh api -X PUT repos/YEEEAE/BRIGHTAI/branches/main/protection -H "Accept: application/vnd.github+json" --input <payload.json>
gh api repos/YEEEAE/BRIGHTAI/branches/main/protection -H "Accept: application/vnd.github+json"
gh run list --workflow "Netlify Source of Truth" --limit 5
```

### 4) تعريب `docs/deployment-governance.md` عبر PR
**Description:**  
بسبب حماية `main` تم إنشاء فرع `codex/*`، رفع التغييرات، فتح PR، تشغيل الـ workflow المطلوب، ثم دمج PR ومزامنة المحلي مع `origin/main`.

**Terminal Commands:**
```bash
git switch -c codex/arabic-deployment-governance
git push -u origin codex/arabic-deployment-governance
gh pr create --base main --head codex/arabic-deployment-governance --title "docs(deploy): Arabic translation for deployment governance runbook"
gh workflow run "Netlify Source of Truth" --ref codex/arabic-deployment-governance
gh pr merge 1 --squash --delete-branch
git pull --rebase origin main
```

### 5) المحادثة الحالية: تعريب `docs/pr/netlify-source-of-truth.md` وتوثيق آخر 5 محادثات
**Description:**  
تعريب ملف `docs/pr/netlify-source-of-truth.md` ثم كتابة هذا السجل داخل `README.md` بحيث يكون مرجع تنفيذي واضح داخل المشروع.

**Terminal Commands:** 
```bash
nl -ba docs/pr/netlify-source-of-truth.md | sed -n '1,260p'
```
