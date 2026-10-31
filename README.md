# GarageIntel

Product intelligence for the garage, the driveway, and the connected home. Version 1 is the publishing system: static pages, a product database, affiliate-link rules, and sample templates. It is not a catalog of finished reviews.

The live preview is the Cloudflare Pages project `garageintel` at <https://garageintel-61v.pages.dev>. Production is the `main` branch. This site ships on `feature/v1-site` and stays there until the owner approves a merge.

## Architecture

- [Astro](https://astro.build) static output (`output: 'static'`). No SSR adapter.
- Content lives in Astro content collections validated by Zod (`astro/zod`).
- Articles are Markdown. Products and affiliate links are JSON objects keyed by id.
- Templates join an article to those databases by `product_id` and `link_id`. They do not copy specs into the prose.
- Plain CSS in `src/styles/global.css`. Self-hosted fonts via `@fontsource`. Very little JavaScript: affiliate click events, on-site search filtering, and one sample calculator.
- `npm run build` writes `dist/`. Node is pinned to 22 in `.nvmrc`. Cloudflare Pages is set to `NODE_VERSION=22`.

Amazon price and availability are never rendered. There is no scraper. `src/lib/amazon/creators.ts` is the hook for a future Amazon Creators API client. It returns `null` and will throw during the build if it ever returns data before a real client exists.

## Folder map

```
src/config/constants.mjs          # name, disclosure, tracking ids, content types
src/config/sections.mjs           # section hubs and their filters
src/config/site.ts                # PUBLIC_* env values used by pages
src/content.config.ts             # content collections
src/content/articles/*.md         # one file per article
src/data/products.json            # product database
src/data/affiliate-links.json     # affiliate-link database
src/lib/schema.mjs                # Zod schemas shared by Astro and the validator
src/lib/affiliate.mjs             # live-link check; sentinel never becomes an href
src/lib/resolve.mjs               # join article -> products -> links
src/lib/structured.mjs            # JSON-LD
src/lib/amazon/creators.ts        # future Creators API hook
src/components/templates/         # one layout per content type
src/components/ArticleShell.astro # shared article chrome
src/layouts/BaseLayout.astro      # head, header, footer, analytics, ads
src/pages/                        # routes
src/styles/global.css
scripts/validate-data.mjs         # data checks; also runs at the start of the build
scripts/validate.mjs              # data + built HTML
scripts/check-links.mjs           # internal links in dist/
scripts/sitemap-excludes.mjs      # keeps samples, search, and 404 out of the sitemap
scripts/mobile-screenshots.mjs    # optional local 390px check; not used by Pages
public/                           # favicon, Cloudflare _headers
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/automotive` `/tools` `/garage` `/smart-home` `/robot-vacuums` `/security` `/smart-locks` | Topic sections |
| `/deals` `/trending` `/comparisons` `/buying-guides` | Cross sections |
| `/{category}/{slug}` | Article |
| `/about` `/how-we-review` `/affiliate-disclosure` `/privacy` `/contact` `/terms` | Supporting pages |
| `/search` | Site search (`?q=`). `noindex` |
| `/robots.txt` `/ads.txt` | Generated at build |
| `/sitemap-index.xml` | `@astrojs/sitemap` |

Sample articles in this branch (all `status: sample`, `noindex`, omitted from the sitemap):

| Content id | Type | Path |
| --- | --- | --- |
| GI-2026-0001 | best-of | `/tools/sample-best-demo-drivers` |
| GI-2026-0002 | review | `/automotive/sample-demo-obd-scanner` |
| GI-2026-0003 | versus | `/smart-home/sample-demo-plug-versus-mini` |
| GI-2026-0004 | troubleshooting | `/garage/sample-demo-opener-reverses` |
| GI-2026-0005 | buying-guide | `/robot-vacuums/sample-buying-demo-robot-vacuums` |
| GI-2026-0006 | alternatives | `/security/sample-demo-camera-alternatives` |
| GI-2026-0007 | compatibility | `/smart-locks/sample-demo-lock-compatibility` |
| GI-2026-0008 | deal | `/tools/sample-demo-driver-deal` |
| GI-2026-0009 | trending | `/robot-vacuums/sample-demo-robot-trending` |
| GI-2026-0010 | educational | `/garage/sample-what-product-intelligence-means` |
| GI-2026-0011 | calculator | `/garage/sample-shelf-bin-calculator` |

## How to add a product

Edit `src/data/products.json`. The object key and `product_id` are the same slug (`demo-impact-driver` is the sample shape; real ids should not start with `demo-`).

Required fields: `product_id`, `brand`, `product_name`, `model`, `asin` (empty string until you have the real ASIN), `category`, `manufacturer_url` (https or empty), `amazon_affiliate_url`, `amazon_tracking_id`, `other_affiliate_urls`, `image_source`, `date_link_verified`, `date_product_verified`.

`amazon_tracking_id` must match the category’s id in `src/config/constants.mjs`. Tools and garage use the `garage-tools` id. Do not invent an ASIN, a price, or a product photo. `image_source` has to say where the picture came from. Demo products use `AFFILIATE_LINK_MISSING` and must not carry a live affiliate URL.

## How to add an affiliate link

Edit `src/data/affiliate-links.json`. One row per destination. Fields: `link_id`, `product_id`, `network` (`amazon` or `other`), `retailer`, `url`, `tracking_id`, `strategy`, `date_verified`, `status`.

Strategies: `garage-tools`, `automotive`, `robot-vacuums`, `smart-home`, `security`, `smart-locks`, `deals`, `comparisons`, `buying-guides`, `social`. The same product can have more than one row when a deal page and a buying guide need different tags. `tracking_id` must equal that strategy’s value in `AMAZON_TRACKING_IDS`.

Until the URL is real, set `url` to `AFFILIATE_LINK_MISSING` and `status` to `missing`. That sentinel is not an href. The template renders an inactive control and the text “Affiliate link unavailable.” A `status` of `active` requires an `https` URL. Placeholder tracking ids are never appended to a URL.

Live anchors use `rel="sponsored nofollow noopener"` and `target="_blank"`. Amazon labels read “Check current price on Amazon”.

## How to add an article

1. Add any new products and affiliate links first.
2. Create `src/content/articles/{slug}.md` with YAML frontmatter. The schema is `articleSchema` in `src/lib/schema.mjs`.
3. `content_id` looks like `GI-2026-0012`. `slug` is lowercase. `category` is one of the topic categories, which is also the first URL segment.
4. `content_type` is one of: `best-of`, `review`, `versus`, `troubleshooting`, `buying-guide`, `alternatives`, `compatibility`, `deal`, `trending`, `educational`, `calculator`.
5. List every product in both `products` and `product_ids`, and list a `link_id` for each product in `affiliate_links`.
6. Images are keys, not remote files: `placeholder:hero-neutral`, `placeholder:product-neutral`, `placeholder:social-neutral`.
7. Keep `status` as `sample` or `draft` until the facts and the links are verified. Those statuses are `noindex` and excluded from the sitemap. The title must contain “sample” or “demo”.
8. Run `npm run check`.

Type-specific fields: `comparison_rows` for versus, `symptom` for troubleshooting, `deal_note` for deals, `compatibility_notes` for compatibility, `alternatives` for alternatives pages, `calculator_id` for calculators (`shelf-bins` is the only one registered). Do not add a rating field. JSON-LD does not emit stars or offers.

`src/components/templates/` has the layout for each type. Shared chrome (disclosure, hero, ads, sources, FAQ, related links) is `ArticleShell.astro`.

## Branch naming

- `content/GI-YYYY-NNNN` for an article.
- `feature/...` for site features. Version 1 is `feature/v1-site`.
- `update/...` for a revision of something already published.

## Preview workflow

1. Branch from `main`. Do not commit the site onto `main` yourself.
2. Build and run the checks below.
3. Push the branch. Cloudflare Pages builds a preview for every branch other than `main`.
4. Read the preview. Stop.
5. Only GarageIntel Publisher merges to `main`, and only after the owner approves. Production must not receive the site before that approval.

## Commands

```bash
npm run build        # static site -> dist/  (this is what Cloudflare runs)
npm run validate     # schemas, references, disclosure, canonicals, sitemap rules
npm run check:links  # broken internal links in dist/
npm run check        # build, then validate, then links
npm run dev          # local preview
```

`npm run check:mobile` is a local 390px screenshot pass. Playwright is not installed by the project, so Cloudflare will not download a browser during `npm run build`. To run it locally: install Playwright, install Chromium, then `node scripts/mobile-screenshots.mjs`.

The build itself runs the data validator. A dangling `product_id`, a demo product with a live affiliate URL, or a published article with no live link fails the build. `AFFILIATE_LINK_MISSING` on sample rows is reported as a flag and does not fail the build. It does fail validation if that sentinel shows up in an `href` or `src`.

## Cloudflare Pages

| Setting | Value |
| --- | --- |
| Project | `garageintel` |
| Production URL | `https://garageintel-61v.pages.dev` |
| Framework | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Production branch | `main` |
| Preview | all other branches |
| Node | `NODE_VERSION=22` (matches `.nvmrc`) |

Environment variables:

| Name | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Canonical origin. Set to `https://garageintel-61v.pages.dev` until a final domain exists. The code falls back to that same URL. |
| `PUBLIC_GA4_MEASUREMENT_ID` | GA4 measurement id (`G-…`). Empty means the gtag script is not emitted. |
| `PUBLIC_ADSENSE_CLIENT_ID` | AdSense client (`ca-pub-…`). Empty means no ad script and a comment-only `ads.txt`. |
| `PUBLIC_GSC_VERIFICATION` | Google Search Console meta token. Empty means the verification tag is omitted. |

Copy `.env.example` to `.env` for local builds. Do not put secrets in git. Tracking ids are campaign tags, not secrets, but they still are not user identifiers.

## Analytics

Enhanced Measurement in the GA4 admin is the source of `page_view`, scroll, outbound clicks, and site search. Site search uses the query parameter `q` on `/search`.

Do not send a user id, email, client id of your own, or the full affiliate URL. When a live affiliate control is clicked and gtag is present, the page sends:

| Event | When |
| --- | --- |
| `affiliate_click` | Every live affiliate control |
| `amazon_click` | `network` is `amazon` |
| `retailer_click` | `network` is `other` |
| `deal_click` | `content_type` is `deal` |
| `comparison_click` | `content_type` is `versus` |

Register these event-scoped custom dimensions in GA4 before relying on reports:

- `content_id`
- `product_id`
- `product_name`
- `category`
- `content_type`
- `affiliate_network`
- `retailer`
- `button_location`
- `destination_domain` (hostname only)

There is no consent banner in version 1. Do not set the GA4 or AdSense ids for visitors in regions that require consent until a consent tool is added. The privacy policy says this in plain language.

## Ads

`AdSlot.astro` renders only when `PUBLIC_ADSENSE_CLIENT_ID` is valid. Slots are labeled “Advertisement”, use a reserved height, and sit after the intro, mid-article, and before the FAQ on informational articles, reviews, comparisons, buying guides, troubleshooting, alternatives, compatibility, trending, and explainers. They are not on the home page, section indexes, legal pages, deal templates, or the calculator, and they are not placed inside a product card. `ads.txt` is produced by `src/pages/ads.txt.ts` at build time.

## SEO

Every page has a unique title, meta description, canonical URL, Open Graph tags, and Twitter card. `robots.txt` points at the sitemap. JSON-LD is Organization and WebSite (with `SearchAction`) on every page, plus `BreadcrumbList` and `Article` on articles, `FAQPage` when FAQs exist, and `ItemList` on best-of pages. `Product` JSON-LD is limited to published reviews and never includes `offers` or a rating. Samples are `noindex` and filtered out of the sitemap.

## Conventions for agents

- One schema (`src/lib/schema.mjs`) is the contract. Do not duplicate field lists in a second unchecked file.
- Do not display an Amazon price, a strikethrough price, or a stock status.
- Do not invent ASINs, ratings, test numbers, or manufacturer URLs.
- Do not present an AI image as a product photo. Keep `image_source` honest.
- Demo ids (`demo-…`, Example Brand) stay on `AFFILIATE_LINK_MISSING`.
- Tracking ids are edited only in `AMAZON_TRACKING_IDS`.
- A published article with products and no live https affiliate URL fails the build.
- Prefer editing a template component over pasting layout HTML into Markdown.

## Missing information

The owner still has to supply:

- `[OWNER_CONTACT_EMAIL]`
- `[OWNER_LEGAL_ENTITY]`
- `[OWNER_MAILING_ADDRESS]`
- Governing law, once the legal entity exists (called out on the terms page, not invented here)
- `[AMAZON_TRACKING_ID_GARAGE_TOOLS]`
- `[AMAZON_TRACKING_ID_AUTOMOTIVE]`
- `[AMAZON_TRACKING_ID_ROBOT_VACUUMS]`
- `[AMAZON_TRACKING_ID_SMART_HOME]`
- `[AMAZON_TRACKING_ID_SECURITY]`
- `[AMAZON_TRACKING_ID_SMART_LOCKS]`
- `[AMAZON_TRACKING_ID_DEALS]`
- `[AMAZON_TRACKING_ID_COMPARISONS]`
- `[AMAZON_TRACKING_ID_BUYING_GUIDES]`
- `[AMAZON_TRACKING_ID_SOCIAL]`
- `PUBLIC_GA4_MEASUREMENT_ID`
- `PUBLIC_ADSENSE_CLIENT_ID`
- `PUBLIC_GSC_VERIFICATION`
- A final domain, if it will not stay `https://garageintel-61v.pages.dev` (change `PUBLIC_SITE_URL`)
- Real products: brand, model, ASIN, manufacturer URL, authorized image and `image_source`, `date_link_verified`, `date_product_verified`
- Real affiliate URLs to replace `AFFILIATE_LINK_MISSING`
- Human author names, if “GarageIntel Desk” should not stay the masthead
- A cookie-consent tool before GA4 or AdSense is enabled where consent is required
- Amazon Creators API credentials, only if that integration is wanted later. Not required for version 1.

Sample articles are fictional on purpose. They are not ready to publish.
