/** Site-wide constants with no secrets. Safe to import from Astro and from Node scripts. */

export const SITE_NAME = 'GarageIntel';

/** Cloudflare Pages project `garageintel`. Override with PUBLIC_SITE_URL when the domain changes. */
export const DEFAULT_SITE_URL = 'https://garageintel-61v.pages.dev';

export const AMAZON_DISCLOSURE = 'As an Amazon Associate I earn from qualifying purchases.';

export const AMAZON_CTA = 'Check current price on Amazon';

export const AFFILIATE_LINK_MISSING = 'AFFILIATE_LINK_MISSING';

export const PLACEHOLDERS = {
  contactEmail: '[OWNER_CONTACT_EMAIL]',
  legalEntity: '[OWNER_LEGAL_ENTITY]',
  mailingAddress: '[OWNER_MAILING_ADDRESS]',
};

/** Neutral graphics shipped with the repo. Not photographs of products. */
export const IMAGE_KEYS = [
  'placeholder:hero-neutral',
  'placeholder:product-neutral',
  'placeholder:social-neutral',
];

export const CALCULATORS = {
  'shelf-bins': 'Shelf bin count (sample arithmetic)',
};

export const CONTENT_TYPE_LABELS = {
  'best-of': 'Best of',
  review: 'Review',
  versus: 'Comparison',
  troubleshooting: 'Troubleshooting',
  'buying-guide': 'Buying guide',
  alternatives: 'Alternatives',
  compatibility: 'Compatibility',
  deal: 'Deal',
  trending: 'Trending',
  educational: 'Explainer',
  calculator: 'Calculator',
};

export const CONTENT_TYPES = [
  'best-of',
  'review',
  'versus',
  'troubleshooting',
  'buying-guide',
  'alternatives',
  'compatibility',
  'deal',
  'trending',
  'educational',
  'calculator',
];

export const CATEGORIES = [
  'automotive',
  'tools',
  'garage',
  'smart-home',
  'robot-vacuums',
  'security',
  'smart-locks',
];

export const STATUSES = ['draft', 'sample', 'published', 'archived'];

export const AMAZON_STRATEGIES = [
  'garage-tools',
  'automotive',
  'robot-vacuums',
  'smart-home',
  'security',
  'smart-locks',
  'deals',
  'comparisons',
  'buying-guides',
  'social',
];

/**
 * One Amazon Associates tracking ID per strategy.
 * These are campaign tags, never user identifiers. Real IDs have not been provided.
 */
export const AMAZON_TRACKING_IDS = {
  'garage-tools': '[AMAZON_TRACKING_ID_GARAGE_TOOLS]',
  automotive: '[AMAZON_TRACKING_ID_AUTOMOTIVE]',
  'robot-vacuums': '[AMAZON_TRACKING_ID_ROBOT_VACUUMS]',
  'smart-home': '[AMAZON_TRACKING_ID_SMART_HOME]',
  security: '[AMAZON_TRACKING_ID_SECURITY]',
  'smart-locks': '[AMAZON_TRACKING_ID_SMART_LOCKS]',
  deals: '[AMAZON_TRACKING_ID_DEALS]',
  comparisons: '[AMAZON_TRACKING_ID_COMPARISONS]',
  'buying-guides': '[AMAZON_TRACKING_ID_BUYING_GUIDES]',
  social: '[AMAZON_TRACKING_ID_SOCIAL]',
};

export function isPlaceholderTrackingId(id) {
  return typeof id !== 'string' || id.length === 0 || id.startsWith('[') || id.endsWith(']');
}

export function strategyForCategory(category) {
  if (category === 'tools' || category === 'garage') return 'garage-tools';
  if (Object.prototype.hasOwnProperty.call(AMAZON_TRACKING_IDS, category)) return category;
  return null;
}

export function strategyForArticle(article) {
  const type = article.content_type;
  if (type === 'deal') return 'deals';
  if (type === 'versus') return 'comparisons';
  if (type === 'buying-guide') return 'buying-guides';
  return strategyForCategory(article.category);
}

export function validGa4Id(id) {
  return typeof id === 'string' && /^G-[A-Z0-9]+$/.test(id) ? id : '';
}

export function validAdsenseClientId(id) {
  return typeof id === 'string' && /^ca-pub-\d+$/.test(id) ? id : '';
}

export function validGscToken(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{10,128}$/.test(id) ? id : '';
}

/** Content types that may show AdSense slots. Deal and calculator pages stay ad-free. */
export const AD_CONTENT_TYPES = new Set([
  'best-of',
  'review',
  'versus',
  'troubleshooting',
  'buying-guide',
  'alternatives',
  'compatibility',
  'educational',
  'trending',
]);
