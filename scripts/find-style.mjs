import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const r = await page.evaluate(() => {
  const styles = Array.from(document.querySelectorAll('style'));
  return {
    count: styles.length,
    withContactsText: styles.filter(s => (s.textContent || '').includes('contacts__inner')).map(s => ({ idAttr: s.dataset.viteDevId || null, len: (s.textContent||'').length })),
    withContactsAny: styles.filter(s => (s.textContent || '').includes('contacts')).map(s => ({ idAttr: s.dataset.viteDevId || null, len: (s.textContent||'').length })),
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
