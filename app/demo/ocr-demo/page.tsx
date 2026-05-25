import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/demo/BeforeAfterSlider";
import { DemoHero } from "@/components/demo/DemoHero";
import { OcrDemoClient } from "@/components/demo/OcrDemoClient";
import { ROICalculator } from "@/components/demo/ROICalculator";
import { StickyMobileCTA } from "@/components/demo/StickyMobileCTA";
import { TrustBar } from "@/components/demo/TrustBar";

const canonicalUrl = "https://brightai.site/demo/ocr-demo/";

export const metadata: Metadata = {
  title: "ديمو أتمتة الوثائق OCR",
  description:
    "جرّب ديمو أتمتة الوثائق من Bright AI لاستخراج الحقول من الفواتير والعقود وتجهيزها للربط مع أنظمة ERP باستخدام Gemini Vision.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      "ar-SA": canonicalUrl,
      "x-default": canonicalUrl
    }
  },
  openGraph: {
    title: "ديمو أتمتة الوثائق OCR من Bright AI",
    description: "تحويل الوثائق إلى حقول منظمة وقواعد تحقق وبيانات جاهزة للربط.",
    url: canonicalUrl,
    images: [{ url: "https://brightai.site/assets/images/logo-new.PNG", width: 512, height: 512 }]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://brightai.site/demo/ocr-demo/#software",
      name: "ديمو أتمتة الوثائق OCR",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://brightai.site/demo/ocr-demo/",
      inLanguage: "ar-SA",
      provider: { "@type": "Organization", name: "Bright AI", url: "https://brightai.site/" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "SAR" }
    },
    {
      "@type": "FAQPage",
      "@id": "https://brightai.site/demo/ocr-demo/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "هل يحفظ الديمو ملفات المستخدم؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "لا. الديمو العام لا يهدف إلى تخزين مدخلات المستخدم، ويعرض تنبيهاً واضحاً بعدم رفع بيانات حساسة."
          }
        },
        {
          "@type": "Question",
          name: "هل يدعم المستندات العربية؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "نعم، الواجهة والنتائج مبنية للعربية والسوق السعودي مع دعم النصوص المختلطة."
          }
        },
        {
          "@type": "Question",
          name: "هل يمكن ربطه مع ERP؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "نعم، يعرض الديمو payload منظماً يصلح كنقطة بداية للربط بعد ضبط الحقول والصلاحيات في النسخة المخصصة."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://brightai.site/demo/ocr-demo/#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://brightai.site/" },
        { "@type": "ListItem", position: 2, name: "الديموهات", item: "https://brightai.site/demo/" },
        { "@type": "ListItem", position: 3, name: "أتمتة الوثائق", item: "https://brightai.site/demo/ocr-demo/" }
      ]
    }
  ]
};

export default function OcrDemoPage() {
  return (
    <main className="demo-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="top-nav demo-container" aria-label="التنقل الرئيسي">
        <Link href="/" aria-label="Bright AI الرئيسية">
          <Image src="/assets/images/logo-new.PNG" width={42} height={42} alt="شعار Bright AI" />
          <span>Bright AI</span>
        </Link>
        <div>
          <Link href="/demo/">الديموهات</Link>
          <Link href="/services/document-automation/">الخدمة</Link>
          <Link href="/contact/">تواصل</Link>
        </div>
      </nav>

      <DemoHero
        eyebrow="أتمتة وثائق مدعومة بـ Gemini Vision"
        title="حوّل الفواتير والعقود إلى بيانات جاهزة للربط خلال ثوانٍ"
        description="ديمو عربي حي يقرأ المستند، يستخرج الحقول، يكشف النواقص، ويعرض payload قابل للمراجعة قبل الترحيل إلى أنظمة المالية والمشتريات."
        primaryHref="#playground"
        whatsappText="أريد نسخة مخصصة من ديمو أتمتة الوثائق لشركتي"
        kpis={[
          { label: "متوسط تقليل الإدخال اليدوي", value: "82%" },
          { label: "حقول قابلة للمراجعة", value: "20+" },
          { label: "زمن تجربة أولى", value: "90ث" }
        ]}
      />

      <TrustBar />
      <OcrDemoClient />
      <BeforeAfterSlider />
      <ROICalculator />

      <section className="faq demo-container" aria-labelledby="faq-title">
        <p className="demo-eyebrow">أسئلة شائعة</p>
        <h2 id="faq-title">ما الذي يحدث بعد الديمو؟</h2>
        <div className="faq__grid">
          <details open>
            <summary>هل يمكن استخدامه على وثائق فعلية؟</summary>
            <p>نعم في نسخة مخصصة داخل ضوابط العميل، أما الديمو العام فمصمم للعينات غير الحساسة.</p>
          </details>
          <details>
            <summary>كيف يتم التعامل مع الأخطاء؟</summary>
            <p>كل حقل يحمل مستوى ثقة ومصدره، والحقول منخفضة الثقة تنتقل للمراجعة البشرية قبل الاعتماد.</p>
          </details>
          <details>
            <summary>ما الأنظمة التي يمكن الربط معها؟</summary>
            <p>يمكن الربط مع أنظمة ERP وDMS وواجهات API بعد توحيد القاموس وخرائط الحقول والصلاحيات.</p>
          </details>
        </div>
      </section>

      <StickyMobileCTA />
    </main>
  );
}
