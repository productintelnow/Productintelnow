import { resolveAffiliateHref } from './affiliate.mjs';

export function articlePath(article) {
  return `/${article.category}/${article.slug}`;
}

/**
 * Join an article to the products and affiliate-links databases.
 * Throws if a referenced id does not exist, so a build cannot ship a dangling card.
 */
export function resolveArticleData(article, productsById, linksById) {
  const resolvedLinks = article.affiliate_links.map((id) => {
    const link = linksById.get(id);
    if (!link) {
      throw new Error(`${article.content_id} references unknown affiliate link ${id}`);
    }
    return link;
  });

  return article.products.map((ref) => {
    const product = productsById.get(ref.product_id);
    if (!product) {
      throw new Error(`${article.content_id} references unknown product_id ${ref.product_id}`);
    }
    const links = resolvedLinks
      .filter((link) => link.product_id === ref.product_id)
      .map((link) => ({
        link,
        href: resolveAffiliateHref(link),
      }));
    return { ref, product, links };
  });
}
