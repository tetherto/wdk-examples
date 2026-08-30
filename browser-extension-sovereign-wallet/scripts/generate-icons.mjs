/**
 * Renders public/icon.svg to extension PNG sizes.
 * Run: npm run icons
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'public', 'icon.svg');
const OUT = path.join(ROOT, 'public', 'icons');

const svg = fs.readFileSync(SVG_PATH);

fs.mkdirSync(OUT, { recursive: true });

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const file = path.join(OUT, `icon${size}.png`);
  await sharp(svg, { density: 384 })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 15, alpha: 1 },
    })
    .png({ compressionLevel: 9, palette: size <= 48 })
    .toFile(file);
  console.log(`Wrote ${file} (${size}px)`);
}
