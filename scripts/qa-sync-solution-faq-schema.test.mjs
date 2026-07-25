import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  extractVisibleFaq,
  runSync,
  syncSolutionFaqSchema,
} from "./sync-solution-faq-schema.mjs";

const fixture = `<!doctype html>
<html lang="ar-SA">
<head>
  <link rel="canonical" href="https://brightai.site/solutions/example/">
  <script id="brightai-production-schema" type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://brightai.site/solutions/example/#webpage"
      },
      {
        "@type": "FAQPage",
        "@id": "https://brightai.site/solutions/example/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "عنوان تسويقي ليس سؤالاً",
            "acceptedAnswer": {"@type": "Answer", "text": "إجابة خاطئة"}
          }
        ]
      }
    ]
  }
  </script>
</head>
<body>
  <section><h2>عنوان تسويقي</h2><p>هذا النص لا يدخل في FAQ.</p></section>
  <section id="faq">
    <h2>الأسئلة الشائعة</h2>
    <details>
      <summary><span>هل يدعم النظام العربية؟</span><i>+</i></summary>
      <div>نعم، يدعم العربية وواجهات RTL.</div>
    </details>
    <details>
      <summary>كيف يبدأ التطبيق؟</summary>
      <p>يبدأ بتقييم الاستخدامات والمخاطر الحالية.</p>
    </details>
  </section>
</body>
</html>`;

test("extracts FAQ questions and answers only from the visible FAQ section", () => {
  assert.deepEqual(extractVisibleFaq(fixture), [
    {
      "@type": "Question",
      name: "هل يدعم النظام العربية؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "نعم، يدعم العربية وواجهات RTL.",
      },
    },
    {
      "@type": "Question",
      name: "كيف يبدأ التطبيق؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "يبدأ بتقييم الاستخدامات والمخاطر الحالية.",
      },
    },
  ]);
});

test("replaces only the managed FAQPage node", () => {
  const output = syncSolutionFaqSchema(fixture);
  const match = output.match(
    /<script id="brightai-production-schema" type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
  );
  const graph = JSON.parse(match[1])["@graph"];
  const faq = graph.find((node) => node["@type"] === "FAQPage");

  assert.equal(graph[0]["@type"], "WebPage");
  assert.equal(faq.mainEntity.length, 2);
  assert.equal(faq.mainEntity[0].name, "هل يدعم النظام العربية؟");
  assert.equal(
    faq["@id"],
    "https://brightai.site/solutions/example/#faq",
  );
});

test("sync includes nested city solution pages", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "brightai-faq-"));
  const nested = path.join(root, "solutions", "sector", "city");
  await mkdir(nested, { recursive: true });
  await writeFile(path.join(nested, "index.html"), fixture);

  const changed = await runSync({ root });

  assert.deepEqual(changed, ["solutions/sector/city/index.html"]);
});
