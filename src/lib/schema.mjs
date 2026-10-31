import { z } from 'astro/zod';
import {
  AFFILIATE_LINK_MISSING,
  AMAZON_STRATEGIES,
  CALCULATORS,
  CATEGORIES,
  CONTENT_TYPES,
  IMAGE_KEYS,
  STATUSES,
} from '../config/constants.mjs';

function asDateString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return value;
}

const isoDate = z.preprocess(asDateString, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'));
const isoOrEmpty = z.preprocess(
  asDateString,
  z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD or leave empty'),
);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase slug');

const productRef = z.object({
  product_id: z.string().min(1),
  role: z.enum(['primary', 'alternate', 'comparison', 'mentioned']),
  rank: z.number().int().positive().optional(),
  editor_note: z.string().optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
});

export const articleSchema = z
  .object({
    content_id: z.string().regex(/^GI-\d{4}-\d{4}$/, 'content_id must look like GI-2026-0001'),
    revision: z.number().int().positive(),
    title: z.string().min(1),
    seo_title: z.string().min(10).max(80),
    slug,
    meta_description: z.string().min(50).max(170),
    author: z.string().min(1),
    publish_date: isoDate,
    last_updated: isoDate,
    category: z.enum(CATEGORIES),
    content_type: z.enum(CONTENT_TYPES),
    primary_keyword: z.string().min(1),
    secondary_keywords: z.array(z.string()),
    products: z.array(productRef),
    product_ids: z.array(z.string()),
    affiliate_links: z.array(z.string()),
    sources: z.array(
      z.object({
        title: z.string().min(1),
        url: z.string().optional(),
        note: z.string().optional(),
      }),
    ),
    hero_image: z.enum(IMAGE_KEYS),
    hero_image_alt: z.string().min(1),
    social_image: z.enum(IMAGE_KEYS),
    social_image_alt: z.string().min(1),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    specifications: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })),
    alternatives: z.array(z.object({ product_id: z.string().min(1), reason: z.string().min(1) })),
    faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
    status: z.enum(STATUSES),
    verdict: z.string().optional(),
    symptom: z.string().optional(),
    calculator_id: z.string().optional(),
    deal_note: z.string().optional(),
    comparison_rows: z
      .array(z.object({ label: z.string().min(1), values: z.array(z.string().min(1)).min(2) }))
      .optional(),
    compatibility_notes: z
      .array(z.object({ label: z.string().min(1), value: z.string().min(1) }))
      .optional(),
  })
  .superRefine((data, ctx) => {
    const listed = data.products.map((product) => product.product_id);
    if (new Set(listed).size !== listed.length) {
      ctx.addIssue({ code: 'custom', message: 'products contains a duplicate product_id', path: ['products'] });
    }
    const listedSet = new Set(listed);
    for (const id of data.product_ids) {
      if (!listedSet.has(id)) {
        ctx.addIssue({
          code: 'custom',
          message: `product_ids includes ${id}, which is not in products`,
          path: ['product_ids'],
        });
      }
    }
    for (const id of listedSet) {
      if (!data.product_ids.includes(id)) {
        ctx.addIssue({
          code: 'custom',
          message: `products includes ${id}, which is missing from product_ids`,
          path: ['product_ids'],
        });
      }
    }
    if (data.last_updated < data.publish_date) {
      ctx.addIssue({ code: 'custom', message: 'last_updated is earlier than publish_date', path: ['last_updated'] });
    }
    if (data.content_type === 'best-of' && listed.length < 2) {
      ctx.addIssue({ code: 'custom', message: 'A best-of article needs at least two products', path: ['products'] });
    }
    if (data.content_type === 'review' && listed.length !== 1) {
      ctx.addIssue({ code: 'custom', message: 'A review covers exactly one product', path: ['products'] });
    }
    if (data.content_type === 'versus') {
      const compared = data.products.filter((product) => product.role === 'comparison');
      if (compared.length !== 2) {
        ctx.addIssue({ code: 'custom', message: 'A versus article needs two comparison products', path: ['products'] });
      }
      if (!data.comparison_rows?.length) {
        ctx.addIssue({ code: 'custom', message: 'A versus article needs comparison_rows', path: ['comparison_rows'] });
      }
      for (const row of data.comparison_rows ?? []) {
        if (row.values.length !== 2) {
          ctx.addIssue({
            code: 'custom',
            message: `Comparison row "${row.label}" must have two values`,
            path: ['comparison_rows'],
          });
        }
      }
    }
    if (data.content_type === 'troubleshooting' && !data.symptom) {
      ctx.addIssue({ code: 'custom', message: 'Troubleshooting articles need a symptom', path: ['symptom'] });
    }
    if (data.content_type === 'calculator') {
      if (!data.calculator_id || !CALCULATORS[data.calculator_id]) {
        ctx.addIssue({
          code: 'custom',
          message: 'calculator_id must match a calculator registered in src/config/constants.mjs',
          path: ['calculator_id'],
        });
      }
    }
    if (data.content_type === 'deal' && !data.deal_note) {
      ctx.addIssue({ code: 'custom', message: 'Deal articles need a deal_note', path: ['deal_note'] });
    }
    if (data.content_type === 'alternatives' && data.alternatives.length < 1) {
      ctx.addIssue({ code: 'custom', message: 'Alternatives articles need an alternatives list', path: ['alternatives'] });
    }
    if (data.content_type === 'compatibility' && !data.compatibility_notes?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Compatibility articles need compatibility_notes',
        path: ['compatibility_notes'],
      });
    }
    if ((data.status === 'sample' || data.status === 'draft') && !/sample|demo/i.test(data.title)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Sample and draft titles must include "sample" or "demo" so they cannot be mistaken for published reviews',
        path: ['title'],
      });
    }
  });

const httpsOrEmpty = z.string().refine((value) => value === '' || /^https:\/\//.test(value), 'https URL or empty');

export const productSchema = z.object({
  product_id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brand: z.string().min(1),
  product_name: z.string().min(1),
  model: z.string().min(1),
  asin: z.string().regex(/^$|^[A-Z0-9]{10}$/, 'ASIN must be empty or 10 letters/digits'),
  category: z.enum(CATEGORIES),
  manufacturer_url: httpsOrEmpty,
  amazon_affiliate_url: z.string().min(1),
  amazon_tracking_id: z.string().min(1),
  other_affiliate_urls: z.array(z.string()),
  image_source: z.string().min(1),
  date_link_verified: isoOrEmpty,
  date_product_verified: isoOrEmpty,
});

export const affiliateLinkSchema = z
  .object({
    link_id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    product_id: z.string().min(1),
    network: z.enum(['amazon', 'other']),
    retailer: z.string().min(1),
    url: z.string().min(1),
    tracking_id: z.string().min(1),
    strategy: z.enum(AMAZON_STRATEGIES),
    date_verified: isoOrEmpty,
    status: z.enum(['active', 'missing', 'paused', 'needs-review']),
  })
  .superRefine((data, ctx) => {
    const missing = data.url === AFFILIATE_LINK_MISSING || data.url.includes(AFFILIATE_LINK_MISSING);
    if (data.status === 'missing' && !missing) {
      ctx.addIssue({ code: 'custom', message: 'status missing requires the AFFILIATE_LINK_MISSING url', path: ['url'] });
    }
    if (data.status === 'active' && missing) {
      ctx.addIssue({ code: 'custom', message: 'status active cannot use AFFILIATE_LINK_MISSING', path: ['status'] });
    }
    if (data.status === 'active' && !/^https:\/\//.test(data.url)) {
      ctx.addIssue({ code: 'custom', message: 'An active affiliate url must be https', path: ['url'] });
    }
  });
