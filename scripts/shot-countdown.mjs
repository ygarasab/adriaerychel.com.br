import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:4322/';
const out = process.argv[3] || 'screenshots/countdown-full.png';
const viewportArg = process.argv[4] || 'wide';

const viewports = {
  mobile: { width: 390, height: 844 },
  fullhd: { width: 1920, height: 1080 },
  wide: { width: 1440, height: 900 },
  laptop: { width: 1366, height: 768 },
};

await mkdir('screenshots', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: viewports[viewportArg], deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });

const el = page.locator('#countdown');
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await el.screenshot({ path: out });

console.log(`Saved: ${out}`);
await browser.close();
