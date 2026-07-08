/**
 * @brightai/dashboard — /settings index
 *
 * Phase 0: simple welcome page. Each sub-route replaces with the
 * actual setting UI in Phase 1+.
 */

import styles from './page.module.css';

export default function SettingsIndex() {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>الإعدادات</h1>
      <p className={styles.lead}>
        اختر قسم من القائمة الجانبية. الإعدادات الكاملة (الملف الشخصي، الأمان، الفوترة،
        إعدادات المنظمة) توصل في الـ releases القادمة.
      </p>
      <div className={styles.placeholder}>
        <p>Phase 0 — layouts جاهزة، الـ forms في Phase 1+.</p>
      </div>
    </div>
  );
}
