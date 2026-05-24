import { chromium } from 'playwright';

const browser = await chromium.launch();
for (const v of [{ name: 'desktop', w: 1440, h: 900 }, { name: 'mobile', w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/dress-code', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `/tmp/dresscode-${v.name}.png`, fullPage: true });
  console.log(`/tmp/dresscode-${v.name}.png`);
  await ctx.close();
}
await browser.close();
