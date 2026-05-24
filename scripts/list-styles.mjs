import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const result = await page.evaluate(() => {
  const out = [];
  for (const ss of document.styleSheets) {
    try {
      const rules = ss.cssRules?.length ?? 0;
      out.push({ href: ss.href, ownerNode: ss.ownerNode?.nodeName, rules });
    } catch (e) { out.push({ href: ss.href, error: e.message }); }
  }
  return out;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
