import assert from "node:assert/strict";
import test from "node:test";

import { auditHtml } from "./seo-schema-audit.mjs";

function page({ body = "", graph = [], canonical = "https://brightai.site/docs/example/" }) {
  return `<!doctype html>
  <html lang="ar-SA">
  <head>
    <link rel="canonical" href="${canonical}">
    <script type="application/ld+json">
    ${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}
    </script>
  </head>
  <body>${body}</body>
  </html>`;
}

const breadcrumb = {
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://brightai.site/" },
  ],
};

test("reports invalid JSON-LD", () => {
  const html = '<script type="application/ld+json">{"@type":</script>';
  assert.match(auditHtml("docs/example/index.html", html).join("\n"), /invalid json-ld/i);
});

test("requires BreadcrumbList on audited pages", () => {
  const errors = auditHtml("docs/example/index.html", page({ graph: [] }));
  assert.match(errors.join("\n"), /missing breadcrumblist/i);
});

test("reports solution FAQ that does not match visible details", () => {
  const html = page({
    canonical: "https://brightai.site/solutions/example/",
    body: '<section id="faq"><details><summary>السؤال الصحيح؟</summary><p>الإجابة الصحيحة.</p></details></section>',
    graph: [
      breadcrumb,
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "سؤال مختلف؟",
            acceptedAnswer: { "@type": "Answer", text: "إجابة مختلفة." },
          },
        ],
      },
    ],
  });
  assert.match(
    auditHtml("solutions/example/index.html", html).join("\n"),
    /faqpage does not match visible faq/i,
  );
});

test("requires HowTo when documentation has a visible procedure", () => {
  const html = page({
    body: "<h2>كيف تبدأ؟</h2><ol><li>الخطوة الأولى.</li><li>الخطوة الثانية.</li></ol>",
    graph: [breadcrumb],
  });
  assert.match(
    auditHtml("docs/example/index.html", html).join("\n"),
    /missing howto/i,
  );
});

test("requires a complete Service node on the services page", () => {
  const html = page({
    canonical: "https://brightai.site/services/",
    graph: [breadcrumb],
  });
  assert.match(
    auditHtml("services/index.html", html).join("\n"),
    /missing valid service schema/i,
  );
});
