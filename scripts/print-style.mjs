import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const css = await page.evaluate(() => {
  const styles = Array.from(document.querySelectorAll('style'));
  const c = styles.find(s => (s.textContent||'').includes('contacts'));
  return c?.textContent;
});
console.log('CSS in style tag:');
console.log(css);
await browser.close();
