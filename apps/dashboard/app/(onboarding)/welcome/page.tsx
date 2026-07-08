/**
 * @brightai/dashboard — Onboarding welcome page (Step 1)
 *
 * Phase 0 placeholder. Phase 3 will build the real form:
 *   - Organization info (name, size, industry, CR number)
 *   - On click "ابدأ" → POST to /api/onboarding/step-1 → next step
 */

import { getSessionContext } from '@/lib/session';
import styles from './page.module.css';

export default async function OnboardingWelcome() {
  const ctx = await getSessionContext();

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        أهلاً {ctx.user.fullNameAr || ctx.user.fullName} في{' '}
        <span className={styles.brandAccent}>BrightAI</span>
      </h1>
      <p className={styles.lead}>
        نبي نجهّز شركة <strong>{ctx.tenant.nameAr || ctx.tenant.name}</strong> على BrightAI.
        خلال 5 خطوات بسيطة راح تكون جاهز تستخدم حوكمة الذكاء الاصطناعي.
      </p>

      <ol className={styles.steps}>
        <li className={styles.step}>معلومات الشركة (الاسم، الحجم، القطاع، السجل التجاري)</li>
        <li className={styles.step}>اختر الأطر التنظيمية اللي تبي توافقها (PDPL، NCA، SDAIA…)</li>
        <li className={styles.step}>ادعُ فريقك (مع تحديد أدوارهم)</li>
        <li className={styles.step}>اختر طريقة النشر (Cloud / Hybrid / Air-Gapped)</li>
        <li className={styles.step}>اربط أول تكامل (Slack / Teams / SharePoint…)</li>
      </ol>

      <div className={styles.actions}>
        <button className={styles.primaryBtn} disabled>
          ابدأ الإعداد (قريباً في Phase 3)
        </button>
      </div>
      <p className={styles.small}>
        Phase 0 — هذا عرض مؤقت. الـ wizard الكامل يوصل في release قادم.
      </p>
    </div>
  );
}
