/**
 * Lê src/data/gifts.ts, encontra os GiftItem com kind: 'link' que ainda não têm
 * imagem em src/assets/gifts/links/, e tenta baixar a imagem og:image / twitter:image
 * de cada URL. Salva como src/assets/gifts/links/<id>.<ext>.
 *
 * Uso: node scripts/fetch-gift-images.mjs
 *      node scripts/fetch-gift-images.mjs --force  (re-baixa tudo)
 */
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GIFTS_TS = join(ROOT, 'src/data/gifts.ts');
const OUT_DIR = join(ROOT, 'src/assets/gifts/links');

const FORCE = process.argv.includes('--force');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';
const ACCEPT_LANG = 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7';

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

console.log(`Encontrados ${items.length} item(s) com link.`);
console.log(`Já com imagem: ${existingFiles.size}`);
console.log('---');

const META_PATTERNS = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
  /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
];

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractImageUrl(html) {
  for (const re of META_PATTERNS) {
    const m = html.match(re);
    if (m) return decodeHtml(m[1]);
  }
  return null;
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function processItem(item) {
  const { id, url, title } = item;
  if (!FORCE && existingFiles.has(id)) {
    return { id, status: 'skip', reason: 'já tem imagem' };
  }
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': UA,
        'Accept-Language': ACCEPT_LANG,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    if (!res.ok) {
      return { id, status: 'fail', reason: `HTTP ${res.status}` };
    }
    const html = await res.text();
    const imgUrl = extractImageUrl(html);
    if (!imgUrl) {
      return { id, status: 'fail', reason: 'sem og:image' };
    }
    const absImgUrl = new URL(imgUrl, res.url).toString();

    const imgRes = await fetchWithTimeout(absImgUrl, {
      headers: { 'User-Agent': UA, Referer: res.url },
    });
    if (!imgRes.ok) {
      return { id, status: 'fail', reason: `img HTTP ${imgRes.status}` };
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.length < 15000) {
      return { id, status: 'fail', reason: `imagem muito pequena, provável placeholder/logo (${buf.length}B)` };
    }
    const ext = extToExtension(imgRes.headers.get('content-type'), absImgUrl);
    const outPath = join(OUT_DIR, `${id}${ext}`);
    await writeFile(outPath, buf);
    return { id, status: 'ok', size: buf.length, ext, src: absImgUrl };
  } catch (err) {
    return { id, status: 'fail', reason: err.message || String(err) };
  }
}

const results = [];
for (const item of items) {
  process.stdout.write(`  ${item.id.padEnd(28)} `);
  const r = await processItem(item);
  results.push({ ...r, title: item.title, url: item.url });
  if (r.status === 'ok') console.log(`✓ ${r.ext} (${(r.size / 1024).toFixed(0)}KB)`);
  else if (r.status === 'skip') console.log(`· ${r.reason}`);
  else console.log(`✗ ${r.reason}`);
}

console.log('---');
const ok = results.filter((r) => r.status === 'ok').length;
const skip = results.filter((r) => r.status === 'skip').length;
const fail = results.filter((r) => r.status === 'fail');
console.log(`OK: ${ok} | Skip: ${skip} | Fail: ${fail.length}`);
if (fail.length) {
  console.log('\nFalhas (adicione imagem manual em src/assets/gifts/links/<id>.jpg):');
  fail.forEach((f) => console.log(`  - ${f.id}: ${f.reason} → ${f.url}`));
}
