import { chromium } from 'playwright';

const base = 'http://localhost:4321';
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const v of viewports) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { sessionStorage.setItem('envelope-opened', 'true'); });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const el = await page.$('section.info');
  if (!el) { console.error('no .info'); continue; }
  const out = `/tmp/cards-${v.name}.png`;
  await el.screenshot({ path: out });
  console.log(out);
  await ctx.close();
}
await browser.close();
