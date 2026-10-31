/**
 * Local layout check at 390px. Not part of `npm run build`.
 * Playwright is intentionally not a dependency so Cloudflare Pages does not download browsers.
 *
 *   npm install --no-save playwright
 *   npx playwright install chromium
 *   node scripts/mobile-screenshots.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
const outDir = process.env.SCREENSHOT_DIR || path.join(process.cwd(), 'tmp-screenshots');

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.webp')) return 'image/webp';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.xml')) return 'application/xml';
  if (file.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(url.pathname);
      const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
      const candidates = [
        path.join(dist, rel),
        path.join(dist, `${rel}.html`),
        path.join(dist, rel, 'index.html'),
      ];
      const file = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!file) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType(file) });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

const pages = [
  ['home', '/'],
  ['tools', '/tools'],
  ['best-of', '/tools/sample-best-demo-drivers'],
  ['review', '/automotive/sample-demo-obd-scanner'],
  ['versus', '/smart-home/sample-demo-plug-versus-mini'],
  ['calculator', '/garage/sample-shelf-bin-calculator'],
  ['search', '/search?q=demo'],
  ['privacy', '/privacy'],
];

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. This script is a local check and is not run by Cloudflare.');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const { server, port } = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const notes = [];

for (const [name, route] of pages) {
  const response = await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  const file = path.join(outDir, `${name}-390.png`);
  await page.screenshot({ path: file, fullPage: true });
  notes.push(`${name} ${route} status=${status} horizontalOverflow=${overflow} file=${file}`);
  if (status >= 400) notes.push(`ERROR ${name} returned ${status}`);
  if (overflow) notes.push(`ERROR ${name} overflows horizontally at 390px`);
}

await browser.close();
server.close();
console.log(notes.join('\n'));
if (notes.some((note) => note.startsWith('ERROR'))) process.exit(1);
