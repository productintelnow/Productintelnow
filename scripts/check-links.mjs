import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function pageToPath(file) {
  const rel = path.relative(dist, file).replaceAll(path.sep, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}`;
  if (rel.endsWith('.html')) return `/${rel.slice(0, -'.html'.length)}`;
  return `/${rel}`;
}

function resolveInternal(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (clean === '' || clean === '/') return path.join(dist, 'index.html');
  const rel = clean.replace(/^\//, '');
  const candidates = [
    path.join(dist, rel),
    path.join(dist, `${rel}.html`),
    path.join(dist, rel, 'index.html'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

if (!fs.existsSync(dist)) {
  console.error('dist/ is missing. Run npm run build first.');
  process.exit(1);
}

const htmlFiles = walk(dist).filter((file) => file.endsWith('.html'));
const cssFiles = walk(dist).filter((file) => file.endsWith('.css'));
const errors = [];
const idsByFile = new Map();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  idsByFile.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
  const refs = [
    ...html.matchAll(/\s(?:href|src|poster)=["']([^"']+)["']/g),
    ...html.matchAll(/\ssrcset=["']([^"']+)["']/g),
  ];
  for (const match of refs) {
    const rawValues = match[1].split(',').map((part) => part.trim().split(/\s+/)[0]);
    for (const raw of rawValues) {
      if (!raw || raw.startsWith('data:') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) {
        continue;
      }
      if (raw.includes('AFFILIATE_LINK_MISSING')) {
        errors.push(`${pageToPath(file)} references AFFILIATE_LINK_MISSING in ${raw}`);
        continue;
      }
      let url;
      try {
        url = new URL(raw, 'https://internal.local');
      } catch {
        errors.push(`${pageToPath(file)} has an unparseable reference ${raw}`);
        continue;
      }
      const external = raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//');
      if (external) continue;
      const target = resolveInternal(url.pathname);
      if (!target) {
        errors.push(`${pageToPath(file)} -> missing ${url.pathname}`);
        continue;
      }
      if (url.hash) {
        const id = url.hash.slice(1);
        const ids = idsByFile.get(target) ?? new Set([...fs.readFileSync(target, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((item) => item[1]));
        if (!ids.has(id)) errors.push(`${pageToPath(file)} -> ${url.pathname}#${id} has no matching id`);
      }
    }
  }
}

for (const file of cssFiles) {
  const css = fs.readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(([^)]+)\)/g)) {
    const raw = match[1].replace(/["']/g, '').trim();
    if (!raw || raw.startsWith('data:')) continue;
    const url = new URL(raw, 'https://internal.local');
    if (raw.startsWith('http://') || raw.startsWith('https://')) continue;
    const fromCss = path.resolve(path.dirname(file), raw.split('?')[0].split('#')[0]);
    const fromRoot = resolveInternal(url.pathname);
    if (!fs.existsSync(fromCss) && !fromRoot) {
      errors.push(`${path.relative(dist, file)} missing asset ${raw}`);
    }
  }
}

if (errors.length) {
  console.error(`Broken link check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Link check passed for ${htmlFiles.length} HTML files.`);
