import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = "https://brightai.site/";
const pageTitle = "حلول الذكاء الاصطناعي للشركات في السعودية | Bright AI";
const pageDescription =
  "Bright AI تساعد الشركات السعودية على بناء حلول ذكاء اصطناعي عملية تشمل الأتمتة، وكلاء AI، تحليل البيانات، وتجارب العملاء الذكية مع جاهزية مؤسسية وقياس واضح للأثر.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: siteUrl,
    languages: {
      "ar-SA": siteUrl,
      "en-SA": "https://brightai.site/en/",
      "x-default": siteUrl
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Bright AI",
    locale: "ar_SA",
    alternateLocale: ["en_SA"],
    title: pageTitle,
    description: pageDescription,
    images: [
      {
        url: "https://brightai.site/assets/images/og/brightai-og-1200x630.webp",
        width: 1200,
        height: 630,
        alt: "Bright AI - حلول ذكاء اصطناعي للشركات السعودية"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@BrightAI_SA",
    creator: "@BrightAI_SA",
    title: pageTitle,
    description: pageDescription,
    images: ["https://brightai.site/assets/images/og/brightai-og-1200x630.webp"]
  }
};

const capabilities = [
  "أتمتة العمليات المتكررة وربطها بأنظمة العمل",
  "وكلاء ذكاء اصطناعي للمبيعات، الدعم، الموارد البشرية، والعمليات",
  "تحليل بيانات تنبؤي ولوحات قياس تنفيذية",
  "حوكمة وتجهيز مؤسسي يناسب متطلبات السوق السعودي"
];

const outcomes = [
  { label: "تشخيص سريع", value: "خريطة فرص AI قابلة للتنفيذ" },
  { label: "تنفيذ مضبوط", value: "نماذج أولية ثم إطلاق تدريجي" },
  { label: "قياس الأثر", value: "مؤشرات أداء واضحة قبل التوسع" }
];

export default function HomePage() {
  return (
    <main className="marketing-home" lang="ar-SA" dir="rtl">
      <section className="hero" aria-labelledby="home-heading">
        <div className="hero__content">
          <p className="eyebrow">Bright AI للشركات السعودية</p>
          <h1 id="home-heading">حلول الذكاء الاصطناعي للشركات في السعودية</h1>
          <p className="hero__lead">
            نبني حلول AI عملية تساعد فرق الإدارة والعمليات على تقليل العمل اليدوي، رفع جودة القرار،
            وتحويل البيانات اليومية إلى نتائج قابلة للقياس.
          </p>

          <div className="hero__actions" aria-label="إجراءات رئيسية">
            <Link className="button button--primary" href="/consultation/" data-analytics-event="consultation_request" data-cta-location="homepage">
              احجز جلسة تشخيص AI
            </Link>
            <Link className="button button--secondary" href="/services/" data-analytics-event="services_view" data-cta-location="homepage">
              استعرض الخدمات المؤسسية
            </Link>
          </div>
        </div>

        <aside className="signal-panel" aria-label="ملخص طريقة العمل">
          <p className="signal-panel__title">من الفكرة إلى تشغيل فعلي</p>
          <ol>
            <li>نحدد فرص الأتمتة الأعلى أثراً.</li>
            <li>نصمم تجربة آمنة وسهلة للفريق.</li>
            <li>نربط الحل بالمؤشرات والأنظمة.</li>
          </ol>
        </aside>
      </section>

      <section className="section" aria-labelledby="capabilities-heading">
        <div className="section__header">
          <p className="eyebrow">مجالات التركيز</p>
          <h2 id="capabilities-heading">حلول مؤسسية خفيفة على الفريق، واضحة على الإدارة</h2>
        </div>
        <ul className="capability-list">
          {capabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      </section>

      <section className="section section--outcomes" aria-labelledby="outcomes-heading">
        <div className="section__header">
          <p className="eyebrow">ماذا تستلم؟</p>
          <h2 id="outcomes-heading">مسار واضح قبل الاستثمار الكبير</h2>
        </div>
        <div className="outcomes">
          {outcomes.map((item) => (
            <article className="outcome" key={item.label}>
              <h3>{item.label}</h3>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <style>{`
        .marketing-home {
          min-height: 100vh;
          padding-block: 48px;
          background:
            linear-gradient(180deg, rgba(0, 212, 170, 0.08), transparent 340px),
            #06111f;
          color: #ecfdf7;
        }

        .hero,
        .section {
          width: min(1120px, calc(100% - 32px));
          margin-inline: auto;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 28px;
          align-items: center;
          padding-block: 32px 56px;
        }

        .hero__content {
          max-width: 820px;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: #67e8c9;
          font-size: 0.95rem;
          font-weight: 700;
        }

        h1,
        h2,
        h3,
        p {
          letter-spacing: 0;
        }

        h1 {
          max-width: 780px;
          margin: 0;
          font-size: 4.35rem;
          line-height: 1.12;
          font-weight: 800;
        }

        h2 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.35;
        }

        h3 {
          margin: 0;
          font-size: 1.08rem;
        }

        .hero__lead {
          max-width: 720px;
          margin: 22px 0 0;
          color: #b8c8d8;
          font-size: 1.12rem;
          line-height: 1.9;
        }

        .hero__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-block-start: 28px;
        }

        .button {
          display: inline-flex;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          padding: 12px 18px;
          font-weight: 800;
          line-height: 1.4;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .button:focus-visible {
          outline: 3px solid rgba(103, 232, 201, 0.5);
          outline-offset: 3px;
        }

        .button:hover {
          transform: translateY(-1px);
        }

        .button--primary {
          background: #67e8c9;
          color: #03120e;
          box-shadow: 0 14px 34px rgba(0, 212, 170, 0.18);
        }

        .button--secondary {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          color: #ecfdf7;
        }

        .signal-panel,
        .outcome {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          background: rgba(13, 27, 47, 0.82);
        }

        .signal-panel {
          padding: 22px;
        }

        .signal-panel__title {
          margin: 0 0 16px;
          color: #ffcf66;
          font-weight: 800;
        }

        .signal-panel ol {
          margin: 0;
          padding-inline-start: 22px;
          color: #c8d6e4;
          line-height: 1.9;
        }

        .section {
          padding-block: 32px;
          border-block-start: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section__header {
          max-width: 720px;
        }

        .capability-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 22px 0 0;
          padding: 0;
          list-style: none;
        }

        .capability-list li {
          min-height: 72px;
          border-inline-start: 4px solid #67e8c9;
          border-radius: 8px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.055);
          color: #d9e6f2;
          line-height: 1.7;
        }

        .outcomes {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-block-start: 22px;
        }

        .outcome {
          padding: 18px;
        }

        .outcome p {
          margin: 10px 0 0;
          color: #b8c8d8;
          line-height: 1.75;
        }

        @media (max-width: 860px) {
          .marketing-home {
            padding-block: 24px;
          }

          .hero {
            grid-template-columns: 1fr;
            padding-block: 20px 42px;
          }

          h1 {
            font-size: 3rem;
          }

          .capability-list,
          .outcomes {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          h1 {
            font-size: 2.35rem;
          }

          h2 {
            font-size: 1.55rem;
          }

          .hero__actions {
            align-items: stretch;
            flex-direction: column;
          }

          .button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
