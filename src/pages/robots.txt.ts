import type { APIRoute } from 'astro';
import { DEFAULT_SITE_URL } from '../config/constants.mjs';

export const GET: APIRoute = () => {
  const site = (import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
