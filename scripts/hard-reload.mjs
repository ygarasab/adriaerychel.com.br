import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
await ctx.route('**/*', (route) => route.continue({ headers: { ...route.request().headers(), 'cache-control': 'no-cache' }}));
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'load' });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);
const r = await page.evaluate(() => {
  const inner = document.querySelector('.contacts__inner');
  const grid = document.querySelector('.contacts__grid');
  return {
    innerDisplay: inner ? getComputedStyle(inner).display : null,
    gridDisplay: grid ? getComputedStyle(grid).display : null,
    gridCols: grid ? getComputedStyle(grid).gridTemplateColumns : null,
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
