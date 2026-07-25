import assert from "node:assert/strict";
import test from "node:test";

import { findHtmlDestinations } from "./check-render-route-hygiene.mjs";

test("Render route hygiene allows legacy HTML sources but rejects HTML destinations", () => {
  const yaml = `
routes:
  - type: redirect
    source: /about.html
    destination: /about/
  - type: rewrite
    source: /kernel/chat/
    destination: /kernel/chat.html
`;

  assert.deepEqual(findHtmlDestinations(yaml), [
    { line: 8, destination: "/kernel/chat.html" },
  ]);
});
