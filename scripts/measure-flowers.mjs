import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const data = await page.$$eval('.card__flower', els => els.map(el => {
  const img = el.querySelector('img');
  const elRect = el.getBoundingClientRect();
  const imgRect = img ? img.getBoundingClientRect() : null;
  const cls = el.className;
  return {
    card: cls,
    container: { w: elRect.width, h: elRect.height },
    img: imgRect ? { w: imgRect.width, h: imgRect.height, naturalW: img.naturalWidth, naturalH: img.naturalHeight, src: img.currentSrc } : null,
  };
}));

console.log(JSON.stringify(data, null, 2));
await browser.close();
