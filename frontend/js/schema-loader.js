document.addEventListener("DOMContentLoaded", () => {
  const existingSchemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((node) => node.textContent || "");

  const hasType = (type) => existingSchemas.some((text) =>
    new RegExp(`"@type"\\s*:\\s*(?:\\[\\s*)?(?:"${type}")`).test(text)
  );
  const canonicalHref =
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
    `${window.location.origin}${window.location.pathname}`;
  const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");

  const appendSchema = (payload) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(payload);
    document.head.appendChild(script);
  };

  if (!hasType("Organization")) {
    appendSchema({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://brightai.site/#organization",
      name: "Bright AI",
      url: "https://brightai.site/",
      logo: "https://brightai.site/assets/images/Gemini.png",
      telephone: "+966538229013",
      areaServed: {
        "@type": "Country",
        name: "Saudi Arabia"
      },
      availableLanguage: ["ar-SA", "en-US"]
    });
  }

  if (!hasType("WebSite")) {
    appendSchema({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://brightai.site/#website",
      name: "Bright AI",
      url: "https://brightai.site/",
      inLanguage: isEnglish ? ["en-US", "ar-SA"] : ["ar-SA", "en-US"]
    });
  }

  if (!hasType("WebPage")) {
    appendSchema({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalHref}#webpage`,
      url: canonicalHref,
      inLanguage: document.documentElement.lang || (isEnglish ? "en-US" : "ar-SA"),
      isPartOf: {
        "@id": "https://brightai.site/#website"
      }
    });
  }
});
