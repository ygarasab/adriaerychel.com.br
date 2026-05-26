import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:4322/presentes';
const out = process.argv[3] || 'screenshots/presentes-with-modal.png';

await mkdir('screenshots', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

// Página geral primeiro
await page.screenshot({ path: 'screenshots/presentes-page.png', fullPage: true });
console.log('Saved: screenshots/presentes-page.png');

// Clica no primeiro botão "Presentear via Pix"
const btn = page.locator('[data-pix-open]').first();
await btn.scrollIntoViewIfNeeded();
await btn.click();
await page.waitForTimeout(300);
await page.screenshot({ path: out });
console.log(`Saved: ${out}`);

await browser.close();
