import { chromium } from 'playwright';

const base = 'http://localhost:4321';
const targets = [
  { path: '/', name: 'home' },
  { path: '/dress-code', name: 'dresscode' },
];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const v of viewports) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const t of targets) {
    await page.goto(base + t.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const out = `/tmp/review-${t.name}-${v.name}.png`;
    await page.screenshot({ path: out, fullPage: true });
    console.log(out);
  }
  await ctx.close();
}
await browser.close();
