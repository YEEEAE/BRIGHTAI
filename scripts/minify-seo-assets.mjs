import { build } from "esbuild";

const targets = [
  {
    entry: "tenders/api-config.js",
    outfile: "tenders/api-config.min.js",
    type: "js"
  },
  {
    entry: "frontend/js/performance-loader.js",
    outfile: "frontend/js/performance-loader.min.js",
    type: "js"
  },
  {
    entry: "frontend/js/accessibility.js",
    outfile: "frontend/js/accessibility.min.js",
    type: "js"
  },
  {
    entry: "frontend/js/tovik-loader.js",
    outfile: "frontend/js/tovik-loader.min.js",
    type: "js"
  },
  {
    entry: "frontend/js/services-page.js",
    outfile: "frontend/js/services-page.min.js",
    type: "js"
  },
  {
    entry: "frontend/js/index-theme.js",
    outfile: "frontend/js/index-theme.min.js",
    type: "js"
  },
  {
    entry: "frontend/css/services-page.css",
    outfile: "frontend/css/services-page.min.css",
    type: "css"
  },
  {
    entry: "frontend/css/index-critical-overrides.css",
    outfile: "frontend/css/index-critical-overrides.min.css",
    type: "css"
  }
  // runtime-config.min.js و text-ratio-fix.min.css مُصغّرتان مسبقاً — الأصول الأصلية محذوفة
  // ai-scolecs-app.min.js و ai-scolecs-inline.min.css مُصغّرتان مسبقاً — الأصول الأصلية محذوفة
  // Demo/Interview/Sectors/Try — الأصول الأصلية محذوفة، النسخ المصغرة هي النسخ الوحيدة
];

async function minifyTarget(target) {
  await build({
    entryPoints: [target.entry],
    outfile: target.outfile,
    bundle: false,
    minify: true,
    legalComments: "none",
    charset: "utf8",
    target: target.type === "js" ? ["es2019"] : undefined,
    loader: target.type === "css" ? { ".css": "css" } : undefined
  });
}

async function main() {
  for (const target of targets) {
    await minifyTarget(target);
    console.log(`Minified ${target.entry} -> ${target.outfile}`);
  }
}

main().catch((error) => {
  console.error("Failed to minify SEO assets:", error);
  process.exit(1);
});
