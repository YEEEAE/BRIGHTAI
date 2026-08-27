/**
 * @brightai/dashboard — Root page
 *
 * Renders a landing experience that adapts to the request:
 *   - On the root domain (brightai.live, www.brightai.live):
 *     marketing-style page pointing to the dashboard + sign-in CTA.
 *   - On a tenant subdomain (acme.brightai.live):
 *     redirect to /dashboard.
 *   - Custom domains: same as tenant subdomain.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTenantFromHeaders } from '@/lib/tenant';
import styles from './page.module.css';

export default async function HomePage() {
  const tenant = await getTenantFromHeaders();

  if (tenant.kind !== 'root') {
    redirect('/dashboard');
  }

  return (
    <main id="main-content" className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>BrightAI</span>
          <span className={styles.tagline}>Saudi AI Safety OS</span>
        </div>

        <h1 className={styles.title}>
          لوحة التحكم لمنصة <span className={styles.brandAccent}>BrightAI</span>
        </h1>
        <p className={styles.lead}>
          حوكمة وأمان وامتثال استخدامات الذكاء الاصطناعي داخل المؤسسات السعودية.
          ادخل من subdomain شركتك — مثل <code>acme.brightai.live</code> — أو سجّل الدخول إلى
          حسابك إن كنت عندك واحد.
        </p>

        <div className={styles.actions}>
          <Link href="/sign-in" className={styles.primaryBtn}>
            تسجيل الدخول
          </Link>
          <Link href="/sign-up" className={styles.secondaryBtn}>
            إنشاء حساب شركة
          </Link>
        </div>

        <p className={styles.small}>
          <Link href="https://brightai.live" className={styles.link}>
            ← العودة للموقع الرئيسي
          </Link>
        </p>
      </div>
    </main>
  );
}
