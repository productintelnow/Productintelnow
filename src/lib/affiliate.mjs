import { AFFILIATE_LINK_MISSING, AMAZON_TRACKING_IDS, isPlaceholderTrackingId } from '../config/constants.mjs';

/**
 * A url is live only when it is a real https URL.
 * The sentinel AFFILIATE_LINK_MISSING must never become an href.
 */
export function isLiveAffiliateUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === AFFILIATE_LINK_MISSING) return false;
  if (trimmed.includes(AFFILIATE_LINK_MISSING)) return false;
  if (trimmed.startsWith('[')) return false;
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  return parsed.protocol === 'https:';
}

export function destinationDomain(url) {
  if (!isLiveAffiliateUrl(url)) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Resolve the href for one affiliate-links row.
 * Placeholder tracking IDs are never appended. Missing urls return null.
 */
export function resolveAffiliateHref(link) {
  if (!link || !isLiveAffiliateUrl(link.url)) return null;
  if (link.network !== 'amazon') return link.url;
  const strategyTag = AMAZON_TRACKING_IDS[link.strategy];
  if (!strategyTag || isPlaceholderTrackingId(strategyTag) || isPlaceholderTrackingId(link.tracking_id)) {
    return link.url;
  }
  const parsed = new URL(link.url);
  if (!parsed.searchParams.get('tag')) parsed.searchParams.set('tag', strategyTag);
  return parsed.toString();
}

export function ctaLabel(link) {
  if (!link || link.network === 'amazon') return 'Check current price on Amazon';
  return `Check current price at ${link.retailer}`;
}
