import { validateData } from './validate-data.mjs';

let cache;

/** Pathnames that must not appear in the XML sitemap. */
export function excludedPathnames() {
  if (cache) return cache;
  const { articles, hardErrors } = validateData();
  if (hardErrors.length) {
    throw new Error(`Refusing to build the sitemap because content validation failed:\n${hardErrors.join('\n')}`);
  }
  const excluded = new Set(['/search', '/404', '/search-index.json']);
  for (const article of articles) {
    if (article.status !== 'published') {
      excluded.add(`/${article.category}/${article.slug}`);
    }
  }
  cache = excluded;
  return cache;
}
