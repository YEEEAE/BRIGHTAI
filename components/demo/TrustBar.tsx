const badges = ["PDPL-ready", "NCA controls", "NDMO aligned", "No public storage"];

export function TrustBar() {
  return (
    <section className="trust-bar demo-container" aria-label="ضوابط الثقة والامتثال">
      {badges.map((badge) => (
        <span key={badge} dir="ltr">
          {badge}
        </span>
      ))}
    </section>
  );
}
