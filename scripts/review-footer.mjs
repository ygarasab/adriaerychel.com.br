import { chromium } from 'playwright';

const browser = await chromium.launch();
for (const v of [{ name: 'desktop', w: 1440, h: 900 }, { name: 'mobile', w: 390, h: 844 }]) {
const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.querySelector('.contacts__logo')?.scrollIntoView());
await page.waitForFunction(() => {
  const img = document.querySelector('.contacts__logo');
  return img && img.complete && img.naturalWidth > 0;
}, { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(600);
const el = await page.$('section.contacts');
if (el) {
  const out = `/tmp/footer-${v.name}.png`;
  await el.screenshot({ path: out });
  console.log(out);
}
await ctx.close();
}
await browser.close();
