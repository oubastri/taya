#!/usr/bin/env node
/**
 * Generates PWA icon PNGs from public/icon.svg for iOS "Add to Home Screen".
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp (devDependency)
 */

import sharp from "sharp";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const svgPath = join(publicDir, "icon.svg");

const SIZES = [
  { size: 180, name: "apple-touch-icon.png" }, // iPhone (required)
  { size: 167, name: "apple-touch-icon-167x167.png" }, // iPad Pro
  { size: 152, name: "apple-touch-icon-152x152.png" }, // iPad
  { size: 120, name: "apple-touch-icon-120x120.png" }, // iPhone (older)
];

const svg = readFileSync(svgPath);

for (const { size, name } of SIZES) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

console.log("Done. Icons are in /public");
