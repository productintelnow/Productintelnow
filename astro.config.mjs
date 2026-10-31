import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { DEFAULT_SITE_URL } from './src/config/constants.mjs';
import { excludedPathnames } from './scripts/sitemap-excludes.mjs';
import { validateData } from './scripts/validate-data.mjs';

const site = (process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
const dataCheck = validateData();
if (dataCheck.hardErrors.length) {
  throw new Error(
    `GarageIntel content validation failed:\n${dataCheck.hardErrors.map((error) => `- ${error}`).join('\n')}`,
  );
}

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter(page) {
        const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';
        if (pathname.endsWith('.txt') || pathname.endsWith('.json')) return false;
        return !excludedPathnames().has(pathname);
      },
      namespaces: {
        news: false,
        xhtml: false,
        image: false,
        video: false,
      },
    }),
  ],
});
