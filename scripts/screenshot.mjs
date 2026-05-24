import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const url = process.argv[2] || 'http://localhost:4321/';
const out = process.argv[3] || 'screenshots/landing.png';
const selector = process.argv[4];
const viewportArg = process.argv[5];
const viewport = viewportArg === 'mobile'
  ? { width: 390, height: 844 }
  : viewportArg === 'fullhd'
  ? { width: 1920, height: 1080 }
  : viewportArg === 'wide'
  ? { width: 1440, height: 900 }
  : viewportArg === 'laptop'
  ? { width: 1366, height: 768 }
  : viewportArg === 'small'
  ? { width: 1024, height: 768 }
  : { width: 1280, height: 900 };

await mkdir(dirname(out), { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });

// Pula envelope no localStorage
await page.evaluate(() => sessionStorage.setItem('envelope-opened', 'true'));
await page.reload({ waitUntil: 'networkidle' });

if (selector) {
  const el = await page.locator(selector).first();
  await el.screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: true });
}

console.log(`Screenshot saved: ${out}`);
await browser.close();
