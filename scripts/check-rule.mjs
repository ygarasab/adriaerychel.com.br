import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const result = await page.evaluate(() => {
  const inner = document.querySelector('.contacts__inner');
  const attrs = inner ? Array.from(inner.attributes).map(a => a.name) : null;
  // look at all stylesheets and find any rule selecting .contacts__inner
  const matches = [];
  for (const ss of document.styleSheets) {
    try {
      for (const r of ss.cssRules) {
        if (r.selectorText && r.selectorText.includes('contacts__inner')) {
          matches.push({ selector: r.selectorText, css: r.style.cssText });
        }
      }
    } catch (e) { /* cross-origin */ }
  }
  return { attrs, matches };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
