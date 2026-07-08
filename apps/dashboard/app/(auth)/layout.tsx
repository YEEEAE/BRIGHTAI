/**
 * @brightai/dashboard — (auth) route group
 *
 * Renders a centered card layout for sign-in / sign-up / unauthorized.
 * This layout does NOT require an active session.
 */

import Link from 'next/link';
import styles from './layout.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logo}>BrightAI</span>
        </Link>
      </header>
      <main id="main-content" className={styles.main}>
        <div className={styles.card}>{children}</div>
      </main>
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          © {new Date().getFullYear()} BrightAI. كل الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
