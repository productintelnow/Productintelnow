import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { affiliateLinkSchema, articleSchema, productSchema } from './lib/schema.mjs';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: articleSchema,
});

const products = defineCollection({
  loader: file('./src/data/products.json'),
  schema: productSchema,
});

const affiliateLinks = defineCollection({
  loader: file('./src/data/affiliate-links.json'),
  schema: affiliateLinkSchema,
});

export const collections = { articles, products, affiliateLinks };
