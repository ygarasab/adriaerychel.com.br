import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const src = '/home/ygarasab/projs/adriaerychel/base/logo.PNG';
const outFull = '/home/ygarasab/projs/adriaerychel/src/assets/logo-ar.png';
const outFavicon = '/home/ygarasab/projs/adriaerychel/public/favicon.png';

// 1) Decode + chromakey white → transparent using whiteness = min(r,g,b)
//    Un-premultiply so antialiased edges keep their original tint.
const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels } = info;

const out = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += channels) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const w = Math.min(r, g, b);
  const alpha = 255 - w;
  if (alpha === 0) {
    out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 0;
  } else {
    const a = alpha / 255;
    const nr = Math.round((r - 255 * (1 - a)) / a);
    const ng = Math.round((g - 255 * (1 - a)) / a);
    const nb = Math.round((b - 255 * (1 - a)) / a);
    out[i] = Math.max(0, Math.min(255, nr));
    out[i + 1] = Math.max(0, Math.min(255, ng));
    out[i + 2] = Math.max(0, Math.min(255, nb));
    out[i + 3] = alpha;
  }
}

// 2) Find bbox of non-transparent content (threshold alpha > 10) and crop tight.
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const a = out[(y * W + x) * 4 + 3];
    if (a > 10) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const bbW = maxX - minX + 1;
const bbH = maxY - minY + 1;
console.log(`logo bbox: ${bbW}x${bbH} (offset ${minX},${minY}) in ${W}x${H} canvas`);

const transparent = sharp(out, { raw: { width: W, height: H, channels: 4 } });

// 3) Save the full-resolution transparent logo, cropped tight with a small margin.
const marginPct = 0.03;
const padX = Math.round(bbW * marginPct);
const padY = Math.round(bbH * marginPct);
await transparent
  .extract({ left: minX, top: minY, width: bbW, height: bbH })
  .extend({ top: padY, bottom: padY, left: padX, right: padX, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(outFull);

// 4) Favicon: pad to a square with extra breathing room so it reads well at small sizes.
const sq = Math.max(bbW, bbH);
const padToSq = Math.round(sq * 0.12); // 12% margin around content
const sqSize = sq + padToSq * 2;
const dx = Math.round((sqSize - bbW) / 2);
const dy = Math.round((sqSize - bbH) / 2);

await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: minX, top: minY, width: bbW, height: bbH })
  .extend({
    top: dy, bottom: sqSize - bbH - dy,
    left: dx, right: sqSize - bbW - dx,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .resize(256, 256)
  .png({ compressionLevel: 9 })
  .toFile(outFavicon);

console.log(`wrote: ${outFull}`);
console.log(`wrote: ${outFavicon} (256x256)`);
