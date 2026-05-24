import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const r = await page.evaluate(() => {
  const out = { found: [], inner: null };
  for (const ss of document.styleSheets) {
    try {
      for (const r of ss.cssRules) {
        if (r.cssText && r.cssText.includes('contacts__inner')) {
          out.found.push(r.cssText);
        }
      }
    } catch (e) {}
  }
  const inner = document.querySelector('.contacts__inner');
  if (inner) {
    out.inner = {
      matches7qny: inner.matches('[data-astro-cid-7qny6o5v]'),
      hasAttr: inner.hasAttribute('data-astro-cid-7qny6o5v'),
      outerHTMLstart: inner.outerHTML.substring(0, 250),
    };
  }
  return out;
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
