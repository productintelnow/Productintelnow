/**
 * Affiliate click events. No user id, email, cookie, or full destination URL.
 * gtag is absent until PUBLIC_GA4_MEASUREMENT_ID is set, and then this is a no-op.
 */
const FIELDS = [
  ['content_id', 'contentId'],
  ['product_id', 'productId'],
  ['product_name', 'productName'],
  ['category', 'category'],
  ['content_type', 'contentType'],
  ['affiliate_network', 'affiliateNetwork'],
  ['retailer', 'retailer'],
  ['button_location', 'buttonLocation'],
  ['destination_domain', 'destinationDomain'],
];

function paramsFrom(element) {
  const params = {};
  for (const [key, dataKey] of FIELDS) {
    params[key] = element.dataset[dataKey] || '';
  }
  return params;
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-affiliate-click]') : null;
  if (!target || typeof window.gtag !== 'function') return;
  const params = paramsFrom(target);
  window.gtag('event', 'affiliate_click', params);
  if (params.affiliate_network === 'amazon') window.gtag('event', 'amazon_click', params);
  else if (params.affiliate_network) window.gtag('event', 'retailer_click', params);
  if (params.content_type === 'deal') window.gtag('event', 'deal_click', params);
  if (params.content_type === 'versus') window.gtag('event', 'comparison_click', params);
});
