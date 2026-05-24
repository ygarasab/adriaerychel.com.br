import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const computed = await page.$eval('.card__flower--anthurium img', img => {
  const cs = getComputedStyle(img);
  const parent = img.parentElement;
  const pcs = getComputedStyle(parent);
  return {
    img: {
      width: cs.width, height: cs.height, maxWidth: cs.maxWidth, maxHeight: cs.maxHeight,
      objectFit: cs.objectFit, display: cs.display, position: cs.position,
      htmlW: img.getAttribute('width'), htmlH: img.getAttribute('height'),
    },
    parent: {
      width: pcs.width, height: pcs.height, display: pcs.display,
      gridAutoRows: pcs.gridAutoRows, alignItems: pcs.alignItems, justifyItems: pcs.justifyItems,
    },
  };
});

console.log(JSON.stringify(computed, null, 2));
await browser.close();
