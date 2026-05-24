import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const data = await page.evaluate(() => {
  const inner = document.querySelector('.contacts__inner');
  const grid = document.querySelector('.contacts__grid');
  const logo = document.querySelector('.contacts__logo');
  const innerCS = inner ? getComputedStyle(inner) : null;
  const gridCS = grid ? getComputedStyle(grid) : null;
  const logoCS = logo ? getComputedStyle(logo) : null;
  return {
    innerWidth: inner?.clientWidth,
    innerStyles: innerCS ? {
      display: innerCS.display, textAlign: innerCS.textAlign, justifyItems: innerCS.justifyItems,
    } : null,
    gridStyles: gridCS ? {
      display: gridCS.display, gridTemplateColumns: gridCS.gridTemplateColumns,
      gridAutoRows: gridCS.gridAutoRows, alignItems: gridCS.alignItems, justifyItems: gridCS.justifyItems,
    } : null,
    logoStyles: logoCS ? { width: logoCS.width, height: logoCS.height, justifySelf: logoCS.justifySelf } : null,
    media: matchMedia('(min-width: 600px)').matches,
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
