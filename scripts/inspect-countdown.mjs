import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:4322/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });

const info = await page.evaluate(() => {
  const list = ['.countdown__envelope', '.countdown__flora--cascata', '.countdown__flora--vertical', '.countdown__art-inner', '.countdown__art'];
  return list.map(sel => {
    const el = document.querySelector(sel);
    if (!el) return { sel, exists: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      sel,
      exists: true,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      position: cs.position,
      width: cs.width,
      src: el.tagName === 'IMG' ? (el).src : el.querySelector('img')?.src,
    };
  });
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
