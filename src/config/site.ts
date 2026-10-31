import {
  AMAZON_CTA,
  AMAZON_DISCLOSURE,
  DEFAULT_SITE_URL,
  PLACEHOLDERS,
  SITE_NAME,
  validAdsenseClientId,
  validGa4Id,
  validGscToken,
} from './constants.mjs';

function readPublic(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export const site = {
  name: SITE_NAME,
  tagline: 'Product intelligence for the garage, the driveway, and the connected home.',
  description:
    'GarageIntel explains garage, automotive, tool, and connected-home products. Version 1 is the publishing system. Sample articles use fictional demo products.',
  url: (readPublic(import.meta.env.PUBLIC_SITE_URL) || DEFAULT_SITE_URL).replace(/\/$/, ''),
  disclosure: AMAZON_DISCLOSURE,
  amazonCta: AMAZON_CTA,
  ga4: validGa4Id(readPublic(import.meta.env.PUBLIC_GA4_MEASUREMENT_ID)),
  adsense: validAdsenseClientId(readPublic(import.meta.env.PUBLIC_ADSENSE_CLIENT_ID)),
  gsc: validGscToken(readPublic(import.meta.env.PUBLIC_GSC_VERIFICATION)),
  contactEmail: PLACEHOLDERS.contactEmail,
  legalEntity: PLACEHOLDERS.legalEntity,
  mailingAddress: PLACEHOLDERS.mailingAddress,
};

export function documentTitle(title: string): string {
  if (title.includes(SITE_NAME)) return title;
  return `${title} | ${SITE_NAME}`;
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${site.url}/`).href;
}
