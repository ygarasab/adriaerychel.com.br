import { chromium } from 'playwright';

const browser = await chromium.launch();
for (const v of [{ name: 'desktop', w: 1440, h: 900 }, { name: 'mobile', w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
  const page = await ctx.newPage();
  await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const el = await page.$('section.gift');
  if (el) {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await el.screenshot({ path: `/tmp/gift-${v.name}.png` });
    console.log(`/tmp/gift-${v.name}.png`);
  }
  await ctx.close();
}
await browser.close();
