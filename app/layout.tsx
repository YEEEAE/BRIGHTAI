import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

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
    images: [{ url: "/assets/images/logo-new.PNG", width: 512, height: 512 }]
  },
  twitter: {
    card: "summary_large_image",
    images: ["/assets/images/logo-new.PNG"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A2540"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
      <body>{children}</body>
    </html>
  );
}
