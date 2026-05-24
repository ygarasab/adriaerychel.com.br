import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const dir = path.resolve('src/assets/flowers');
const targets = ['anthurium.webp', 'calla-lily.webp', 'pink-lily.webp'];

async function bboxOf(buf, W, H, channels, threshold = 16) {
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = buf[(y * W + x) * channels + 3];
      if (a > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

for (const file of targets) {
  const src = path.join(dir, file);
  const orig = sharp(src).ensureAlpha();
  const { data, info } = await orig.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels } = info;
  const bb = await bboxOf(data, W, H, channels);

  // 1) Crop tight to bbox
  const cropped = await sharp(src).ensureAlpha().extract({
    left: bb.minX, top: bb.minY, width: bb.w, height: bb.h,
  }).toBuffer();

  // 2) Pad symmetrically to make the visible content centered.
  //    Choose a canvas with a small symmetric margin around the bbox so the
  //    flower has a tiny breathing room but is *exactly* centered.
  const marginPct = 0.04; // 4% margin on each side
  const padX = Math.round(bb.w * marginPct);
  const padY = Math.round(bb.h * marginPct);

  const out = await sharp(cropped).extend({
    top: padY, bottom: padY, left: padX, right: padX,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).webp({ quality: 86 }).toBuffer();

  const meta = await sharp(out).metadata();
  await fs.writeFile(src, out);
  console.log(`${file}: ${W}x${H} → ${meta.width}x${meta.height} (bbox ${bb.w}x${bb.h}, off ${bb.minX},${bb.minY})`);
}
