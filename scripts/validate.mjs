import fs from 'node:fs';
import path from 'node:path';
import { AFFILIATE_LINK_MISSING, AMAZON_DISCLOSURE, DEFAULT_SITE_URL } from '../src/config/constants.mjs';
import { isLiveAffiliateUrl } from '../src/lib/affiliate.mjs';
import { sections } from '../src/config/sections.mjs';
import { validateData } from './validate-data.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const site = (process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(dist, file);
}

const hardErrors = [];
const { hardErrors: dataErrors, flags, articles } = validateData();
hardErrors.push(...dataErrors);

if (isLiveAffiliateUrl(AFFILIATE_LINK_MISSING) || isLiveAffiliateUrl(`https://example.com/${AFFILIATE_LINK_MISSING}`)) {
  hardErrors.push('isLiveAffiliateUrl treated the missing-link sentinel as a live URL');
}
if (!isLiveAffiliateUrl('https://example.com/product')) {
  hardErrors.push('isLiveAffiliateUrl rejected a normal https URL');
}

if (!fs.existsSync(dist)) {
  hardErrors.push('dist/ is missing. Run npm run build before npm run validate.');
} else {
  const htmlFiles = walk(dist).filter((file) => file.endsWith('.html'));
  const titles = new Map();
  const descriptions = new Map();

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const name = rel(file);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? '';
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim() ?? '';
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
    const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
    if (!title) hardErrors.push(`${name} is missing a title`);
    if (!description) hardErrors.push(`${name} is missing a meta description`);
    if (!canonical) hardErrors.push(`${name} is missing a canonical URL`);
    else if (!canonical.startsWith(site)) hardErrors.push(`${name} canonical ${canonical} is not on ${site}`);
    if (title) {
      if (titles.has(title)) hardErrors.push(`Duplicate title "${title}" on ${name} and ${titles.get(title)}`);
      titles.set(title, name);
    }
    if (description) {
      if (descriptions.has(description) && !name.endsWith('404.html')) {
        hardErrors.push(`Duplicate meta description on ${name} and ${descriptions.get(description)}`);
      }
      descriptions.set(description, name);
    }
    if (!html.includes(`data-disclosure="footer"`) || !html.includes(AMAZON_DISCLOSURE)) {
      hardErrors.push(`${name} is missing the site-wide Amazon disclosure`);
    }
    if (html.includes('data-affiliate-region="true"')) {
      if (!html.includes('data-disclosure="top"') || !html.includes(AMAZON_DISCLOSURE)) {
        hardErrors.push(`${name} has products but no disclosure at the top`);
      }
    }
    if (/href\s*=\s*["'][^"']*AFFILIATE_LINK_MISSING/i.test(html)) {
      hardErrors.push(`${name} has a live href containing AFFILIATE_LINK_MISSING`);
    }
    if (/src\s*=\s*["'][^"']*AFFILIATE_LINK_MISSING/i.test(html)) {
      hardErrors.push(`${name} has a src containing AFFILIATE_LINK_MISSING`);
    }
    const status = html.match(/data-content-status="([^"]+)"/)?.[1] ?? '';
    if ((status === 'sample' || status === 'draft' || status === 'search' || status === 'missing') && !robots.includes('noindex')) {
      hardErrors.push(`${name} status ${status} is missing noindex`);
    }
    const sponsored = [...html.matchAll(/<a\b[^>]*rel="[^"]*sponsored[^"]*"[^>]*>/g)];
    for (const match of sponsored) {
      const tag = match[0];
      for (const token of ['nofollow', 'noopener']) {
        if (!tag.includes(token)) hardErrors.push(`${name} sponsored link is missing ${token}`);
      }
      if (!tag.includes('target="_blank"')) hardErrors.push(`${name} sponsored link is missing target="_blank"`);
      if (!tag.includes('data-affiliate-click')) hardErrors.push(`${name} sponsored link is missing affiliate click data`);
      for (const attr of [
        'data-content-id',
        'data-product-id',
        'data-product-name',
        'data-category',
        'data-content-type',
        'data-affiliate-network',
        'data-retailer',
        'data-button-location',
        'data-destination-domain',
      ]) {
        if (!tag.includes(attr)) hardErrors.push(`${name} sponsored link is missing ${attr}`);
      }
    }
    const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => match[1]);
    for (const block of ldBlocks) {
      if (block.includes('AggregateRating') || block.includes('reviewRating')) {
        hardErrors.push(`${name} JSON-LD includes a rating`);
      }
      if (/"@type"\s*:\s*"Offer"/.test(block) || /"offers"/.test(block)) {
        hardErrors.push(`${name} JSON-LD includes an offer or price`);
      }
    }
  }

  const sitemapFiles = walk(dist).filter((file) => path.basename(file).startsWith('sitemap') && file.endsWith('.xml'));
  if (sitemapFiles.length === 0) hardErrors.push('No XML sitemap was generated');
  const sitemap = sitemapFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname.replace(/\/$/, '') || '/');
  for (const article of articles) {
    const articlePath = `/${article.category}/${article.slug}`;
    if (article.status !== 'published' && locs.includes(articlePath)) {
      hardErrors.push(`Sitemap includes non-published article ${articlePath}`);
    }
  }
  for (const blocked of ['/search', '/404']) {
    if (locs.includes(blocked)) hardErrors.push(`Sitemap includes ${blocked}`);
  }
  const expected = ['/', ...sections.map((section) => `/${section.slug}`), '/about', '/how-we-review', '/affiliate-disclosure', '/privacy', '/contact', '/terms'];
  for (const expectedPath of expected) {
    if (!locs.includes(expectedPath)) hardErrors.push(`Sitemap is missing ${expectedPath}`);
  }

  const robotsPath = path.join(dist, 'robots.txt');
  const adsPath = path.join(dist, 'ads.txt');
  if (!fs.existsSync(robotsPath)) hardErrors.push('dist/robots.txt is missing');
  else if (!fs.readFileSync(robotsPath, 'utf8').includes(`${site}/sitemap-index.xml`)) {
    hardErrors.push('robots.txt does not reference the sitemap');
  }
  if (!fs.existsSync(adsPath)) hardErrors.push('dist/ads.txt is missing');
  else if (fs.readFileSync(adsPath, 'utf8').includes('pub-000')) {
    hardErrors.push('ads.txt contains a fake publisher id');
  }
}

if (hardErrors.length) {
  console.error(`Validation failed with ${hardErrors.length} error(s):`);
  for (const error of hardErrors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validation passed. ${articles.length} articles. ${flags.length} missing-value flags (expected while samples and placeholders are in place).`);
const interesting = flags.filter((flag) => flag.includes('AFFILIATE_LINK_MISSING') || flag.includes('placeholder') || flag.includes('noindex'));
for (const flag of interesting) console.log(`flag: ${flag}`);
