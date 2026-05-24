import sharp from 'sharp';

const targets = [
  { src: 'base/dress1.jpeg', out: 'src/assets/dress/dress1.webp' },
  { src: 'base/dress2.jpeg', out: 'src/assets/dress/dress2.webp' },
  { src: 'base/dress3.jpeg', out: 'src/assets/dress/dress3.webp' },
];

// Trim Pinterest UI chip from top of each source (top-left "Colagem no Pinterest"
// pill). 8% of height is a safe bite that always removes the chip and a thin
// strip below; doesn't cut visible content (which starts ~10% down in all 3).
const TRIM_TOP_PCT = 0.08;

for (const t of targets) {
  const meta = await sharp(t.src).metadata();
  const trim = Math.round(meta.height * TRIM_TOP_PCT);
  await sharp(t.src)
    .extract({ left: 0, top: trim, width: meta.width, height: meta.height - trim })
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(t.out);
  const out = await sharp(t.out).metadata();
  console.log(`${t.src} (${meta.width}x${meta.height}, trim ${trim}px) → ${t.out}: ${out.width}x${out.height}`);
}
