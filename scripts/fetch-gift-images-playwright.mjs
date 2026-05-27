/**
 * Variante do fetch-gift-images que usa Playwright pra renderizar a página
 * (Mercado Livre e Amazon não expõem og:image direto para alguns SKUs).
 *
 * Uso:
 *   node scripts/fetch-gift-images-playwright.mjs               (rapidinho — só os faltantes)
 *   node scripts/fetch-gift-images-playwright.mjs <id> <id>...  (filtra por id)
 *   node scripts/fetch-gift-images-playwright.mjs --force       (re-baixa todos)
 */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GIFTS_TS = join(ROOT, 'src/data/gifts.ts');
const OUT_DIR = join(ROOT, 'src/assets/gifts/links');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const idFilters = new Set(args.filter((a) => !a.startsWith('--')));

await mkdir(OUT_DIR, { recursive: true });
const existingFiles = new Set(
  (await readdir(OUT_DIR).catch(() => [])).map((f) => f.replace(/\.[^.]+$/, ''))
);

const giftsContent = await readFile(GIFTS_TS, 'utf8');
const ITEM_RE =
  /\{\s*kind:\s*'link',\s*id:\s*'([^']+)',\s*title:\s*'([^']*)',\s*url:\s*'([^']+)'\s*\}/g;
const items = [...giftsContent.matchAll(ITEM_RE)].map(([, id, title, url]) => ({
  id,
  title,
  url,
}));

const targets = items.filter((it) => {
  if (idFilters.size > 0) return idFilters.has(it.id);
  if (FORCE) return true;
  return !existingFiles.has(it.id);
});

console.log(`Tentando ${targets.length} item(s): ${targets.map((t) => t.id).join(', ')}`);
console.log('---');

const browser = await chromium.launch();
const context = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  locale: 'pt-BR',
  viewport: { width: 1400, height: 900 },
});

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function bestImageSelectorsFor(host) {
  if (host.includes('mercadolivre')) {
    return [
      'figure.ui-pdp-gallery__figure img.ui-pdp-image',
      'img.ui-pdp-image',
      'figure.ui-pdp-gallery__figure img',
    ];
  }
  if (host.includes('amazon') || host === 'a.co') {
    return [
      '#landingImage',
      '#imgBlkFront',
      '#imgTagWrapperId img',
      '#main-image',
      '#ebooksImgBlkFront',
    ];
  }
  if (host.includes('riachuelo')) {
    return [
      'img.product-image',
      '.gallery-image img',
      'img[itemprop="image"]',
    ];
  }
  return ['img[itemprop="image"]', 'meta[property="og:image"]'];
}

async function pickBestImageUrl(page, host) {
  // Try selectors in priority order. For each, look at:
  // - data-zoom-image / data-zoom-hires / data-old-hires / src / data-src / srcset (largest)
  const selectors = bestImageSelectorsFor(host);
  for (const sel of selectors) {
    try {
      const handle = await page.$(sel);
      if (!handle) continue;
      const url = await handle.evaluate((el) => {
        const tryAttrs = [
          'data-zoom-image',
          'data-zoom-hires',
          'data-old-hires',
          'data-a-hires',
          'data-src',
          'src',
        ];
        for (const a of tryAttrs) {
          const v = el.getAttribute(a);
          if (v && /^https?:/i.test(v) && !/data:image\/svg/i.test(v)) return v;
        }
        const srcset = el.getAttribute('srcset');
        if (srcset) {
          // pick widest
          const candidates = srcset
            .split(',')
            .map((s) => s.trim().split(/\s+/))
            .map(([u, w]) => ({ u, w: parseInt(w || '0', 10) }));
          candidates.sort((a, b) => b.w - a.w);
          if (candidates[0]) return candidates[0].u;
        }
        return null;
      });
      if (url) return url;
    } catch {
      /* keep trying */
    }
  }
  // Final fallback: og:image
  return await page
    .$eval('meta[property="og:image"]', (el) => el.getAttribute('content'))
    .catch(() => null);
}

function extToExtension(contentType, url) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('webp')) return '.webp';
  if (ct.includes('gif')) return '.gif';
  const m = url.match(/\.(jpe?g|png|webp|gif)(?:[?#]|$)/i);
  if (m) return '.' + m[1].toLowerCase().replace('jpeg', 'jpg');
  return '.jpg';
}

const results = [];

for (const item of targets) {
  process.stdout.write(`  ${item.id.padEnd(28)} `);
  const page = await context.newPage();
  try {
    await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    // wait a bit for hydration / image load
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const host = hostnameOf(page.url());
    const imgUrl = await pickBestImageUrl(page, host);
    if (!imgUrl) {
      console.log('✗ sem imagem identificada');
      results.push({ ...item, status: 'fail', reason: 'sem imagem' });
      continue;
    }
    const absImg = new URL(imgUrl, page.url()).toString();
    // Download via Playwright request context to keep cookies/UA
    const imgResp = await context.request.get(absImg, {
      headers: { Referer: page.url() },
      timeout: 20000,
    });
    if (!imgResp.ok()) {
      console.log(`✗ HTTP ${imgResp.status()}`);
      results.push({ ...item, status: 'fail', reason: `HTTP ${imgResp.status()}` });
      continue;
    }
    const buf = await imgResp.body();
    if (buf.length < 15000) {
      console.log(`✗ imagem pequena (${buf.length}B)`);
      results.push({ ...item, status: 'fail', reason: `pequena ${buf.length}B` });
      continue;
    }
    const ext = extToExtension(imgResp.headers()['content-type'], absImg);
    const outPath = join(OUT_DIR, `${item.id}${ext}`);
    await writeFile(outPath, buf);
    console.log(`✓ ${ext} (${(buf.length / 1024).toFixed(0)}KB) ${absImg.slice(0, 60)}`);
    results.push({ ...item, status: 'ok' });
  } catch (err) {
    console.log(`✗ ${err.message}`);
    results.push({ ...item, status: 'fail', reason: err.message });
  } finally {
    await page.close();
  }
}

await browser.close();

console.log('---');
const ok = results.filter((r) => r.status === 'ok').length;
const fail = results.filter((r) => r.status === 'fail');
console.log(`OK: ${ok} | Fail: ${fail.length}`);
if (fail.length) {
  console.log('\nFalhas:');
  fail.forEach((f) => console.log(`  - ${f.id}: ${f.reason}`));
}
