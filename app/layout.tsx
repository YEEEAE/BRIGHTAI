import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

const defaultOgImage = "https://brightai.site/assets/images/logo-new.PNG";

export const metadata: Metadata = {
  metadataBase: new URL("https://brightai.site"),
  title: {
    default: "Bright AI | ديموهات ذكاء اصطناعي تفاعلية",
    template: "%s | Bright AI"
  },
  description:
    "مجموعة ديموهات Bright AI التفاعلية للشركات السعودية: أتمتة الوثائق، التوظيف، البيانات، المستشفيات، التعليم، الدعم، التسويق وسلاسل التوريد.",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "Bright AI",
    images: [{ url: defaultOgImage, width: 512, height: 512 }]
  },
  twitter: {
    card: "summary_large_image",
    images: [defaultOgImage]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A2540"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar-SA" dir="rtl" suppressHydrationWarning>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8LLESL207Q');
          `}
        </Script>
      </head>
      <body>
        {children}
        <footer className="border-t border-white/10 bg-black/40 pt-12 pb-8 px-6" style={{ marginTop: '3rem' }}>
          <div style={{ maxWidth: '1120px', margin: '0 auto', textAlign: 'center' }}>
            <div className="sitewide-cta" data-cta-section="nextjs-footer" style={{ marginBottom: '2rem' }}>
              <p>اتخذ الخطوة الأولى نحو التحول الرقمي</p>
              <a href="/consultation/" className="sitewide-cta-primary" data-analytics-event="consultation_request" data-cta-location="footer">احجز جلسة تشخيص AI</a>
              <a href="/demo/" className="sitewide-cta-secondary" data-analytics-event="request_demo" data-cta-location="footer">جرّب نماذج Bright AI</a>
              <a href="https://api.whatsapp.com/send?phone=966538229013" className="sitewide-cta-whatsapp" data-analytics-event="whatsapp_click" data-cta-location="footer">تواصل عبر واتساب</a>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>© {new Date().getFullYear()} Bright AI. جميع الحقوق محفوظة.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
