import { SITE_NAME } from '../config/constants.mjs';

export function organizationLd(siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
  };
}

export function websiteLd(siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(siteUrl, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: new URL(item.href, `${siteUrl}/`).href,
    })),
  };
}

export function articleLd({ siteUrl, path, article, image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description,
    datePublished: article.publish_date,
    dateModified: article.last_updated,
    author: { '@type': 'Organization', name: article.author },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl },
    mainEntityOfPage: new URL(path, `${siteUrl}/`).href,
    image,
  };
}

export function faqLd(faqs) {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function itemListLd(siteUrl, path, resolved) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: resolved.map((item, index) => ({
      '@type': 'ListItem',
      position: item.ref.rank ?? index + 1,
      name: item.product.product_name,
      url: `${new URL(path, `${siteUrl}/`).href}#product-${item.product.product_id}`,
    })),
  };
}

/**
 * Product JSON-LD is only for published reviews.
 * No offers (we never display a price) and no aggregateRating (we never invent one).
 */
export function productLd({ product, status }) {
  if (status !== 'published' || !product) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.product_name,
    brand: { '@type': 'Brand', name: product.brand },
    model: product.model,
    sku: product.product_id,
  };
}
