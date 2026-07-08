import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      id="main-content"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <h1 style={{ fontSize: 'var(--text-6xl)', margin: 0, color: 'var(--brand-400)' }}>404</h1>
      <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
        الصفحة اللي تدوّر عليها مو موجودة.
      </p>
      <Link
        href="/dashboard"
        style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--brand-500)',
          color: 'var(--text-inverted)',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        العودة للرئيسية
      </Link>
    </main>
  );
}
