## السياق

صفحة `/tasks/[id]` **موجودة وناضجة** (98/98 E2E) وتطبّق أغلب المواصفة: الـ 12 قسم، قواعد التعليقات، وتنزيل المرفقات الآمن. فيه **3 فجوات حقيقية** قصّت عن المواصفة، وهذا العمل جراحي (additive) بدون ما يكسر الشغل الشغّال.

## التغييرات

### 1) SHA-256 hash للمرفقات (المواصفة: "calculate SHA-256 hash")
عمود `file_hash` موجود بالـ schema لكن دائمًا NULL — ما يُحسب ولا يُخزَّن.
- **`src/lib/types.ts`**: أضيف `file_hash: string | null` + `is_evidence: number` على `TaskAttachment` (مو موجودة بالنوع).
- **`src/lib/taskUpdates.ts`**: 
  - دالة `sha256Hex(bytes)` عبر `node:crypto`.
  - `uploadAttachment`: أحسب الهاش وأخزّنه بعمود `file_hash` (أضيفه لـ INSERT).
  - `closeTask` (تخزين evidence): نفس الشيء.
- **`src/lib/taskDetails.ts`**: أضيف `file_hash` لـ SELECTs (`listAttachmentMeta`, `listEvidenceFiles`, `getAttachment`).
- **`src/pages/tasks/[id].astro`**: أعرض الهاش بشكل خفيف بجانب كل مرفق (أول ١٢ حرف mono + title attribute بالهاش الكامل) — يثبت إنه يُحسب ويُخزَّن.

### 2) تسجيل `notification_created` بالـ activity log (الخيار اللي اخترته: كل إشعار للمنفّذ)
- **`src/lib/activity.ts`**: أضيف `Action.NOTIFICATION_CREATED = 'notification_created'`.
- **`src/lib/notifications.ts`**: أضيف `actorId?: number` على `createNotification`؛ لما يكون موجود + `taskId != null` أسجّل `notification_created` بالـ activity log برسالة: `notified {recipient name}: {title}`. (المستلم يُجلب من جدول users.)
- **`src/lib/taskUpdates.ts`**: أمرّر `actorId: params.actor.id` لكل ٣ استدعاءات createNotification (التعيين/الموعد/الأولوية + الإكمال + التكرار).
- **`src/lib/tasks.ts`**: أضيف `actorId` على `notifyAssigned` وأمرّره لـ createNotification (المنشئ هو المنفّذ).
- **`src/lib/taskDetails.ts`**: أضيف `notification_created` لـ `actionCategory` (→ 'other') و `describeAction`.

### 3) قسم "Locked field summary" (#2) للموظفين
الصفحة ما فيها قسم مستقل يلخّص للموظف الحقول المقفولة.
- **`src/pages/tasks/[id].astro`**: قسم جديد يظهر **للموظفين فقط** (`user.role === 'employee'`) فوق الـ update panel، يعرض `EMPLOYEE_LOCKED_FIELDS` بتسميات واضحة (Title, Description, Department, Assignee, Due date, Priority, Recurrence, Checklist, Dependencies) مع ملاحظة إن المُشرف/المدير يقدر يعدّلها. متوافق مع الوصول (section + ul، RTL، نفس أسلوب الـ callouts الموجودة).

## التحقق
- `pnpm typecheck` (عبر `--filter @brightai/qc-task-manager`) → 0 errors.
- `NODE_ENV=production pnpm build` → Server built.
- `pnpm test` → لازم يعدّي بدون regression.
- **ملاحظة E2E**: `notification_created` بيضيف صفوف للـ activity log. لو سكربت `e2e-task-shared.mjs` يعدّ صفوف النشاط بدقّة، بفحصه وأحدّث العدد المتوقع (تغيير شرعي موثّق بالـ brain، مو تجميل). بشاركك النتيجة.

## تحديث الـ brain
أضيف entry للـ ledger: التغييرات + الأرقام + قرار `notification_created` (كل إشعار للمنفّذ) + ملاحظة للـ future agents إن `file_hash` صار يُحسب/يُخزَّن.

## الالتزام بالقواعد
- ما أدفع ni `git push` (الـ commit عليك).
- ما أكسر CSP، ما أضيف أسرار.
- الكود matches الأسلوب القائم (مسمّيات، تعليقات إنجليزي).