import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const resp = await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
console.log('status:', resp?.status());
await page.waitForTimeout(800);

const data = await page.evaluate(() => {
  const sec = document.querySelector('section.contacts');
  const logo = document.querySelector('.contacts__logo');
  const grid = document.querySelector('.contacts__grid');
  return {
    sec: sec ? { w: sec.clientWidth, h: sec.clientHeight, rect: sec.getBoundingClientRect() } : null,
    logo: logo ? { w: logo.clientWidth, h: logo.clientHeight, src: logo.currentSrc, rect: logo.getBoundingClientRect() } : null,
    grid: grid ? { w: grid.clientWidth, h: grid.clientHeight, cols: getComputedStyle(grid).gridTemplateColumns } : null,
  };
});
console.log(JSON.stringify(data, null, 2));
console.log('errors:', errors);
await browser.close();
