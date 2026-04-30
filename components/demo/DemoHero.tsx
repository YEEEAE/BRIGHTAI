import Link from "next/link";

type DemoHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  kpis: Array<{ label: string; value: string }>;
  primaryHref: string;
  whatsappText: string;
};

export function DemoHero({ eyebrow, title, description, kpis, primaryHref, whatsappText }: DemoHeroProps) {
  const whatsappUrl = `https://wa.me/966538229013?text=${encodeURIComponent(whatsappText)}`;

  return (
    <section className="demo-hero demo-container" aria-labelledby="demo-title">
      <div className="demo-hero__copy">
        <p className="demo-eyebrow">{eyebrow}</p>
        <h1 id="demo-title">{title}</h1>
        <p>{description}</p>
        <div className="demo-hero__actions">
          <Link className="demo-button demo-button--primary focus-ring" href={primaryHref}>
            جرّب الآن
          </Link>
          <a className="demo-button demo-button--ghost focus-ring" href={whatsappUrl} target="_blank" rel="noreferrer">
            احجز عرض واتساب
          </a>
        </div>
      </div>
      <div className="demo-hero__metrics glass-panel" aria-label="مؤشرات فورية">
        {kpis.map((kpi) => (
          <div key={kpi.label}>
            <strong>{kpi.value}</strong>
            <span>{kpi.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
