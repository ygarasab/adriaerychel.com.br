import sharp from 'sharp';

const targets = [
  { src: 'base/flor1.PNG', out: 'src/assets/flowers/anthurium.webp', marginBottomPct: 0.06 },
  { src: 'base/flor2.PNG', out: 'src/assets/flowers/calla-lily.webp', marginBottomPct: 0.06 },
  // flor3 has no stem (only bloom). Add generous bottom margin so it doesn't sit
  // awkwardly tight at the visible bottom when aligned to baseline.
  { src: 'base/flor3.PNG', out: 'src/assets/flowers/pink-lily.webp', marginBottomPct: 0.18 },
];

function bboxOfAlpha(buf, W, H, threshold = 16) {
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = buf[(y * W + x) * 4 + 3];
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

for (const t of targets) {
  const img = sharp(t.src).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const bb = bboxOfAlpha(data, W, H);

  const padX = Math.round(bb.w * 0.05);
  const padTop = Math.round(bb.h * 0.05);
  const padBottom = Math.round(bb.h * t.marginBottomPct);

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: bb.minX, top: bb.minY, width: bb.w, height: bb.h })
    .extend({ top: padTop, bottom: padBottom, left: padX, right: padX, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88 })
    .toFile(t.out);

  const meta = await sharp(t.out).metadata();
  console.log(`${t.src} → ${t.out}: bbox ${bb.w}x${bb.h} → ${meta.width}x${meta.height} (pad t=${padTop} b=${padBottom} s=${padX})`);
}
