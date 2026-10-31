import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  AFFILIATE_LINK_MISSING,
  AMAZON_STRATEGIES,
  AMAZON_TRACKING_IDS,
  isPlaceholderTrackingId,
  strategyForCategory,
} from '../src/config/constants.mjs';
import { isLiveAffiliateUrl } from '../src/lib/affiliate.mjs';
import { affiliateLinkSchema, articleSchema, productSchema } from '../src/lib/schema.mjs';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function parseFrontmatter(filePath, text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    throw new Error(`${filePath} is missing YAML frontmatter`);
  }
  return parseYaml(match[1]);
}

function formatZod(error) {
  return error.issues
    ? error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')
    : error.message;
}

/**
 * Validate the content, product, and affiliate-link databases.
 * Hard errors fail the build. Flags are missing values that are allowed on samples.
 */
export function validateData() {
  const hardErrors = [];
  const flags = [];
  const articles = [];
  const products = [];
  const links = [];

  let productJson;
  let linkJson;
  try {
    productJson = JSON.parse(read('src/data/products.json'));
    linkJson = JSON.parse(read('src/data/affiliate-links.json'));
  } catch (error) {
    return { hardErrors: [`Could not parse data JSON: ${error.message}`], flags, articles, products, links };
  }

  if (productJson === null || typeof productJson !== 'object' || Array.isArray(productJson)) {
    hardErrors.push('src/data/products.json must be an object keyed by product_id');
  }
  if (linkJson === null || typeof linkJson !== 'object' || Array.isArray(linkJson)) {
    hardErrors.push('src/data/affiliate-links.json must be an object keyed by link_id');
  }

  for (const strategy of AMAZON_STRATEGIES) {
    const tag = AMAZON_TRACKING_IDS[strategy];
    if (!tag) hardErrors.push(`Amazon tracking map is missing ${strategy}`);
    else if (isPlaceholderTrackingId(tag)) flags.push(`Amazon tracking id for ${strategy} is still a placeholder (${tag})`);
    else if (/@/.test(tag) || /\s/.test(tag)) hardErrors.push(`Tracking id for ${strategy} must be a campaign tag, not a user identifier`);
  }

  for (const [key, value] of Object.entries(productJson ?? {})) {
    const parsed = productSchema.safeParse(value);
    if (!parsed.success) {
      hardErrors.push(`Product ${key}: ${formatZod(parsed.error)}`);
      continue;
    }
    if (key !== parsed.data.product_id) {
      hardErrors.push(`Product key ${key} does not match product_id ${parsed.data.product_id}`);
    }
    const strategy = strategyForCategory(parsed.data.category);
    const expectedTag = strategy ? AMAZON_TRACKING_IDS[strategy] : '';
    if (parsed.data.amazon_tracking_id !== expectedTag) {
      hardErrors.push(
        `Product ${key} amazon_tracking_id must match the ${strategy} id in src/config/constants.mjs`,
      );
    }
    if (!isLiveAffiliateUrl(parsed.data.amazon_affiliate_url)) {
      flags.push(`Product ${key} has no live Amazon URL (${parsed.data.amazon_affiliate_url})`);
    }
    if (parsed.data.amazon_affiliate_url.includes(AFFILIATE_LINK_MISSING) && parsed.data.product_id.startsWith('demo-')) {
      flags.push(`Demo product ${key} is flagged AFFILIATE_LINK_MISSING`);
    }
    if (parsed.data.product_id.startsWith('demo-') && isLiveAffiliateUrl(parsed.data.amazon_affiliate_url)) {
      hardErrors.push(`Demo product ${key} must not carry a live affiliate URL. Change the product_id when the record is real.`);
    }
    if (!parsed.data.asin) flags.push(`Product ${key} has no ASIN`);
    if (!parsed.data.date_link_verified) flags.push(`Product ${key} has no date_link_verified`);
    if (!parsed.data.date_product_verified) flags.push(`Product ${key} has no date_product_verified`);
    for (const extra of parsed.data.other_affiliate_urls) {
      if (!isLiveAffiliateUrl(extra)) {
        hardErrors.push(`Product ${key} other_affiliate_urls contains a non-live value. Omit it or use a real https URL.`);
      }
    }
    products.push(parsed.data);
  }

  const productIds = new Set(products.map((product) => product.product_id));

  for (const [key, value] of Object.entries(linkJson ?? {})) {
    const parsed = affiliateLinkSchema.safeParse(value);
    if (!parsed.success) {
      hardErrors.push(`Affiliate link ${key}: ${formatZod(parsed.error)}`);
      continue;
    }
    if (key !== parsed.data.link_id) {
      hardErrors.push(`Affiliate link key ${key} does not match link_id ${parsed.data.link_id}`);
    }
    if (!productIds.has(parsed.data.product_id)) {
      hardErrors.push(`Affiliate link ${key} points at unknown product_id ${parsed.data.product_id}`);
    }
    const expectedTag = AMAZON_TRACKING_IDS[parsed.data.strategy];
    if (parsed.data.tracking_id !== expectedTag) {
      hardErrors.push(`Affiliate link ${key} tracking_id must match strategy ${parsed.data.strategy} in the tracking map`);
    }
    if (!isLiveAffiliateUrl(parsed.data.url)) {
      flags.push(`Affiliate link ${key} is not live (${parsed.data.url})`);
    }
    if (parsed.data.url.includes(AFFILIATE_LINK_MISSING)) {
      flags.push(`Affiliate link ${key} flagged AFFILIATE_LINK_MISSING`);
    }
    const product = products.find((item) => item.product_id === parsed.data.product_id);
    if (product && parsed.data.network === 'amazon' && product.category) {
      const categoryStrategy = strategyForCategory(product.category);
      if (
        parsed.data.strategy !== categoryStrategy &&
        !['deals', 'comparisons', 'buying-guides', 'social'].includes(parsed.data.strategy)
      ) {
        hardErrors.push(`Affiliate link ${key} strategy does not match product category ${product.category}`);
      }
    }
    links.push(parsed.data);
  }

  const linkIds = new Set(links.map((link) => link.link_id));
  const articleDir = path.join(root, 'src/content/articles');
  const files = fs.existsSync(articleDir)
    ? fs.readdirSync(articleDir).filter((name) => name.endsWith('.md')).sort()
    : [];

  if (files.length === 0) hardErrors.push('src/content/articles has no markdown articles');

  for (const file of files) {
    const relative = `src/content/articles/${file}`;
    let data;
    try {
      data = parseFrontmatter(relative, read(relative));
    } catch (error) {
      hardErrors.push(error.message);
      continue;
    }
    const parsed = articleSchema.safeParse(data);
    if (!parsed.success) {
      hardErrors.push(`${relative}: ${formatZod(parsed.error)}`);
      continue;
    }
    const article = parsed.data;
    for (const productId of article.product_ids) {
      if (!productIds.has(productId)) {
        hardErrors.push(`${article.content_id} references unknown product_id ${productId}`);
      }
      const matchingLinks = links.filter(
        (link) => link.product_id === productId && article.affiliate_links.includes(link.link_id),
      );
      if (matchingLinks.length === 0) {
        hardErrors.push(`${article.content_id} lists product ${productId} without an affiliate_links id for it`);
      }
    }
    for (const linkId of article.affiliate_links) {
      if (!linkIds.has(linkId)) hardErrors.push(`${article.content_id} references unknown affiliate link ${linkId}`);
    }
    for (const alt of article.alternatives) {
      if (!productIds.has(alt.product_id)) {
        hardErrors.push(`${article.content_id} alternative ${alt.product_id} is not in the products database`);
      }
    }
    if (article.status === 'published') {
      const commercial = article.product_ids.length > 0;
      if (commercial) {
        const live = article.affiliate_links.some((id) => {
          const link = links.find((item) => item.link_id === id);
          return link && isLiveAffiliateUrl(link.url);
        });
        if (!live) {
          hardErrors.push(`${article.content_id} is published but has no live affiliate URL`);
        }
      }
    } else {
      flags.push(`${article.content_id} status is ${article.status} and must stay noindex`);
    }
    articles.push(article);
  }

  const count = (values) => {
    const seen = new Set();
    for (const value of values) {
      if (seen.has(value)) hardErrors.push(`Duplicate ${value}`);
      seen.add(value);
    }
  };
  count(articles.map((article) => article.content_id));
  count(articles.map((article) => article.slug));
  count(products.map((product) => product.product_id));
  count(links.map((link) => link.link_id));

  return { hardErrors, flags, articles, products, links };
}
