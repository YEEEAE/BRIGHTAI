import assert from "node:assert/strict";
import test from "node:test";

import {
  extractVisibleHowTo,
  syncDocsHowToSchema,
} from "./sync-docs-howto-schema.mjs";

const proceduralFixture = `<!doctype html>
<html lang="ar-SA">
<head>
  <link rel="canonical" href="https://brightai.site/docs/example/">
  <script id="brightai-page-schema" type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {"@type": "WebPage", "@id": "https://brightai.site/docs/example/#webpage"}
    ]
  }
  </script>
</head>
<body>
  <h2>كيف تطبق الضوابط؟</h2>
  <ol>
    <li>احصر الاستخدامات الحالية.</li>
    <li>صنف البيانات والمخاطر.</li>
    <li>فعّل السجل والموافقة البشرية.</li>
  </ol>
</body>
</html>`;

test("extracts ordered steps under a procedural heading", () => {
  assert.deepEqual(extractVisibleHowTo(proceduralFixture), {
    name: "كيف تطبق الضوابط؟",
    steps: [
      "احصر الاستخدامات الحالية.",
      "صنف البيانات والمخاطر.",
      "فعّل السجل والموافقة البشرية.",
    ],
  });
});

test("ignores checklist and reference lists that are not procedures", () => {
  const html = proceduralFixture.replace(
    "كيف تطبق الضوابط؟",
    "قائمة تحقق قبل الإطلاق",
  );
  assert.equal(extractVisibleHowTo(html), null);
});

test("ignores descriptive how-it-helps lists", () => {
  const html = proceduralFixture.replace(
    "كيف تطبق الضوابط؟",
    "كيف يساعد AI Firewall؟",
  );
  assert.equal(extractVisibleHowTo(html), null);
});

test("adds a managed HowTo node to the page graph", () => {
  const output = syncDocsHowToSchema(proceduralFixture);
  const match = output.match(
    /<script id="brightai-page-schema" type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
  );
  const graph = JSON.parse(match[1])["@graph"];
  const howTo = graph.find((node) => node["@type"] === "HowTo");

  assert.equal(howTo["@id"], "https://brightai.site/docs/example/#howto");
  assert.equal(howTo.step.length, 3);
  assert.equal(howTo.step[0].text, "احصر الاستخدامات الحالية.");
});

test("preserves supported metadata from an existing HowTo node", () => {
  const withHowTo = syncDocsHowToSchema(proceduralFixture).replace(
    '"@type": "HowTo",',
    '"@type": "HowTo",\n      "totalTime": "P30D",',
  );
  const output = syncDocsHowToSchema(withHowTo);
  const match = output.match(
    /<script id="brightai-page-schema" type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
  );
  const howTo = JSON.parse(match[1])["@graph"].find(
    (node) => node["@type"] === "HowTo",
  );

  assert.equal(howTo.totalTime, "P30D");
});

test("removes managed HowTo when the visible list is no longer procedural", () => {
  const withHowTo = syncDocsHowToSchema(proceduralFixture);
  const descriptive = withHowTo.replaceAll(
    "كيف تطبق الضوابط؟",
    "قائمة تحقق قبل الإطلاق",
  );
  const output = syncDocsHowToSchema(descriptive);
  const match = output.match(
    /<script id="brightai-page-schema" type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
  );
  const graph = JSON.parse(match[1])["@graph"];

  assert.equal(graph.some((node) => node["@type"] === "HowTo"), false);
});
