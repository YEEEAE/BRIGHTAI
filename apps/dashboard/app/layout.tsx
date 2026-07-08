/**
 * @brightai/dashboard — Root layout
 *
 * Sets up:
 *   - ClerkProvider (auth context for client + server)
 *   - <html dir="rtl"> default (Saudi Arabic is the primary locale)
 *   - Theme color, viewport, basic metadata
 *   - Skip link for a11y
 *
 * Locale handling: the marketing site is Arabic-first (dir=rtl). The
 * dashboard mirrors that. If we add an English dashboard later, this
 * becomes a dynamic value per tenant.
 */

import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { arSA, enUS } from '@clerk/localizations';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BrightAI — لوحة التحكم',
    template: '%s | BrightAI Dashboard',
  },
  description: 'لوحة تحكم BrightAI — حوكمة الذكاء الاصطناعي للمؤسسات السعودية',
  applicationName: 'BrightAI Dashboard',
  robots: { index: false, follow: false }, // dashboard is private
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0e1a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={arSA}
      // Fall back to enUS for missing keys in arSA (Clerk supports both)
      // The full bilingual experience needs Clerk's `appearance.locale`
      // set per request — Phase 1 will add that.
      appearance={{
        variables: {
          colorPrimary: '#06b6d4',
          colorBackground: '#0f1525',
          colorText: '#f1f5f9',
          colorInputBackground: '#151c30',
          colorInputText: '#f1f5f9',
          borderRadius: '0.5rem',
          fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', system-ui, sans-serif",
        },
      }}
    >
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <body>
          <a href="#main-content" className="skip-link">
            تخطي إلى المحتوى
          </a>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

// Tell Next.js to opt this layout out of static generation — it's
// dynamic per request (tenant context, session).
export const dynamic = 'force-dynamic';

// Suppress unused import warning for enUS (kept for future EN locale support)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _enUS = enUS;
