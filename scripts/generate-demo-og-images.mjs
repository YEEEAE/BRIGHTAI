#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const outDir = path.join(root, "assets", "images", "og", "demos");
fs.mkdirSync(outDir, { recursive: true });

const demos = [
  ["ai-agent", [15, 118, 110], [37, 99, 235]],
  ["ai-tenders-analysis", [180, 83, 9], [15, 118, 110]],
  ["data-analysis", [37, 99, 235], [14, 165, 233]],
  ["smart-automation", [5, 150, 105], [79, 70, 229]],
  ["ai-workflows", [79, 70, 229], [15, 118, 110]],
  ["smart-education-platform", [2, 132, 199], [22, 163, 74]],
  ["smart-hospital-management", [220, 38, 38], [14, 116, 144]]
];

const width = 1200;
const height = 630;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function blend(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function insideRoundRect(x, y, rx, ry, rw, rh, radius) {
  const cx = x < rx + radius ? rx + radius : x > rx + rw - radius ? rx + rw - radius : x;
  const cy = y < ry + radius ? ry + radius : y > ry + rh - radius ? ry + rh - radius : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function paint(slug, primary, secondary) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const i = row + 1 + x * 4;
      const t = (x / width) * 0.62 + (y / height) * 0.38;
      let r = blend(248, 224, t);
      let g = blend(250, 242, t);
      let b = blend(252, 254, t);

      const inPanel = insideRoundRect(x, y, 72, 72, 1056, 486, 30);
      if (inPanel) {
        r = blend(r, 255, 0.8);
        g = blend(g, 255, 0.8);
        b = blend(b, 255, 0.8);
      }

      const d1 = Math.hypot(x - 980, y - 175);
      if (d1 < 150) {
        const k = (1 - d1 / 150) * 0.18;
        r = blend(r, primary[0], k);
        g = blend(g, primary[1], k);
        b = blend(b, primary[2], k);
      }

      const d2 = Math.hypot(x - 890, y - 430);
      if (d2 < 210) {
        const k = (1 - d2 / 210) * 0.14;
        r = blend(r, secondary[0], k);
        g = blend(g, secondary[1], k);
        b = blend(b, secondary[2], k);
      }

      if (insideRoundRect(x, y, 126, 160, 246, 270, 20)) {
        r = 15; g = 23; b = 42;
      }

      const lines = [
        [154, 194, 190, 18, primary],
        [154, 244, 150, 14, [226, 232, 240]],
        [154, 280, 190, 14, [148, 163, 184]],
        [154, 316, 118, 14, [148, 163, 184]],
        [154, 364, 190, 42, primary]
      ];
      for (const [lx, ly, lw, lh, color] of lines) {
        if (insideRoundRect(x, y, lx, ly, lw, lh, Math.max(7, lh / 2))) {
          r = color[0]; g = color[1]; b = color[2];
        }
      }

      for (let n = 0; n < slug.length; n += 1) {
        const bx = 430 + n * 26;
        const by = 414 + ((slug.charCodeAt(n) % 5) * 12);
        if (insideRoundRect(x, y, bx, by, 16, 56, 5)) {
          r = primary[0]; g = primary[1]; b = primary[2];
        }
      }

      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = 255;
    }
  }
  return raw;
}

function writePng(filePath, pixels) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const png = Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(pixels, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
  fs.writeFileSync(filePath, png);
}

for (const [slug, primary, secondary] of demos) {
  writePng(path.join(outDir, `${slug}.png`), paint(slug, primary, secondary));
}

console.log(`Generated ${demos.length} demo OG images.`);
