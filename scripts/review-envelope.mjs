import { chromium } from 'playwright';

const browser = await chromium.launch();
for (const v of [{ name: 'desktop', w: 1440, h: 900 }, { name: 'mobile', w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
  const page = await ctx.newPage();
  // DO NOT dismiss the envelope - we want to see it
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const img = document.querySelector('.envelope__logo');
    return img && img.complete && img.naturalWidth > 0;
  }, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
  const out = `/tmp/envelope-${v.name}.png`;
  await page.screenshot({ path: out, fullPage: false });
  console.log(out);
  await ctx.close();
}
await browser.close();
