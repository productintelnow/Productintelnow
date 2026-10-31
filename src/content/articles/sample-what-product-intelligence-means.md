---
content_id: GI-2026-0010
revision: 1
title: "Sample explainer: what a product record contains"
seo_title: "Sample explainer of a product record"
slug: sample-what-product-intelligence-means
meta_description: "Sample educational article on how GarageIntel stores a product. It describes the fields. It does not review a real product."
author: GarageIntel Desk
publish_date: 2026-10-31
last_updated: 2026-10-31
category: garage
content_type: educational
primary_keyword: garageintel product record
secondary_keywords:
  - sample educational article
  - affiliate link sentinel
  - content id
products: []
product_ids: []
affiliate_links: []
sources:
  - title: Project data files
    note: The field list matches src/data/products.json and the article schema in this repository.
hero_image: placeholder:hero-neutral
hero_image_alt: Neutral placeholder graphic for a sample explainer. Not a photograph of a product.
social_image: placeholder:social-neutral
social_image_alt: Neutral placeholder graphic used when this sample explainer is shared.
pros: []
cons: []
specifications: []
alternatives: []
faqs:
  - question: Does this explainer earn a commission?
    answer: It has no product and no affiliate link, so there is no commission control on the page. The site footer still carries the Amazon Associates sentence because other pages do.
  - question: What is a content id?
    answer: Every article gets an id such as GI-2026-0010. Editorial branches should use that id, for example content/GI-2026-0010.
status: sample
---

This is the educational template. It has no product ids and no affiliate links. Use it for definitions, checklists, and other pieces that teach without sending a reader to a retailer.

## Fields editors actually fill

A product row stores the brand, the name, the model, an ASIN only when one is known, the category, the manufacturer URL, the Amazon URL, the tracking id for that category, any other affiliate URLs, the image source, and the dates the link and the product were verified. An empty ASIN is allowed. A made-up ASIN is not.

An article row stores the content id, revision, titles, slug, description, author, dates, category, content type, keywords, the product ids it may mention, the affiliate link ids, sources, image keys, pros, cons, specifications, alternatives, FAQs, and a status. Status `sample` or `draft` is noindex and stays out of the sitemap.

## Images

`image_source` has to say where the picture came from. Demo pages use a neutral graphic generated for the template. They do not use an AI picture presented as a real tool. When a manufacturer authorizes a photo, the field names that source and the file replaces the placeholder key.
