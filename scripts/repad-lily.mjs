import sharp from 'sharp';
import { promises as fs } from 'node:fs';

const src = '/tmp/flowers-backup/pink-lily.webp';
const out = '/home/ygarasab/projs/adriaerychel/src/assets/flowers/pink-lily.webp';

// detect tight bbox of the original (unrecentered) lily
const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels } = info;
let minX = W, minY = H, maxX = -1, maxY = -1;
const threshold = 16;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const a = data[(y * W + x) * channels + 3];
    if (a > threshold) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const bbW = maxX - minX + 1;
const bbH = maxY - minY + 1;

// Crop tight to bbox
const cropped = await sharp(src).ensureAlpha().extract({
  left: minX, top: minY, width: bbW, height: bbH,
}).toBuffer();

// Pad asymmetrically: small margin top/sides, generous margin bottom so the
// leaves don't sit at the visible bottom edge.
const padTop = Math.round(bbH * 0.05);
const padSides = Math.round(bbW * 0.05);
const padBottom = Math.round(bbH * 0.22);

const result = await sharp(cropped).extend({
  top: padTop, bottom: padBottom, left: padSides, right: padSides,
  background: { r: 0, g: 0, b: 0, alpha: 0 },
}).webp({ quality: 86 }).toBuffer();

const meta = await sharp(result).metadata();
await fs.writeFile(out, result);
console.log(`pink-lily.webp: bbox ${bbW}x${bbH} → canvas ${meta.width}x${meta.height} (pad t=${padTop} b=${padBottom} s=${padSides})`);
