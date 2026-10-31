/** Section hubs. Topic sections filter by category. Cross sections filter by content_type. */

export const sections = [
  {
    slug: 'automotive',
    title: 'Automotive',
    group: 'topic',
    category: 'automotive',
    contentType: null,
    kicker: 'Driveway',
    description:
      'Diagnostics, fluids, and the parts that live in a car or truck. Published pages will cite sources. Sample pages, if listed, are fictional templates.',
  },
  {
    slug: 'tools',
    title: 'Tools',
    group: 'topic',
    category: 'tools',
    contentType: null,
    kicker: 'Bench',
    description:
      'Hand tools, power tools, and the gear that earns a hook on the wall. Rankings are published only after the product records are verified.',
  },
  {
    slug: 'garage',
    title: 'Garage',
    group: 'topic',
    category: 'garage',
    contentType: null,
    kicker: 'Bay',
    description:
      'Openers, storage, lighting, and the layout of the bay itself. Troubleshooting articles will separate safety warnings from steps a homeowner can actually do.',
  },
  {
    slug: 'smart-home',
    title: 'Smart Home',
    group: 'topic',
    category: 'smart-home',
    contentType: null,
    kicker: 'House',
    description:
      'Plugs, sensors, hubs, and the other small devices that tie a house together. Compatibility claims stay empty until a source says otherwise.',
  },
  {
    slug: 'robot-vacuums',
    title: 'Robot Vacuums',
    group: 'topic',
    category: 'robot-vacuums',
    contentType: null,
    kicker: 'Floors',
    description:
      'Navigation, docks, and the maintenance a robot actually needs. Buying guides here explain tradeoffs. They do not invent suction numbers.',
  },
  {
    slug: 'security',
    title: 'Security',
    group: 'topic',
    category: 'security',
    contentType: null,
    kicker: 'Watch',
    description:
      'Cameras, sensors, and the subscriptions that come with them. Alternatives pages will say what changes if you skip a brand’s cloud.',
  },
  {
    slug: 'smart-locks',
    title: 'Smart Locks',
    group: 'topic',
    category: 'smart-locks',
    contentType: null,
    kicker: 'Door',
    description:
      'Keypads, deadbolts, and the ecosystems they join. A lock page does not ship until fit and power are sourced.',
  },
  {
    slug: 'deals',
    title: 'Deals',
    group: 'cross',
    category: null,
    contentType: 'deal',
    kicker: 'Price check',
    description:
      'Deal notes point at a retailer. GarageIntel does not display an Amazon price or an availability claim. If a link is missing, the button stays inactive.',
  },
  {
    slug: 'trending',
    title: 'Trending',
    group: 'cross',
    category: null,
    contentType: 'trending',
    kicker: 'Signal',
    description:
      'Trending pages explain why a product is getting attention and what is still unverified. They are not a sales ranking.',
  },
  {
    slug: 'comparisons',
    title: 'Comparisons',
    group: 'cross',
    category: null,
    contentType: 'versus',
    kicker: 'Head to head',
    description:
      'Two products, the same questions, and a verdict only when both records are verified. Sample comparisons use fictional demo models.',
  },
  {
    slug: 'buying-guides',
    title: 'Buying Guides',
    group: 'cross',
    category: null,
    contentType: 'buying-guide',
    kicker: 'How to choose',
    description:
      'Guides teach the decision. Product cards, when the links exist, sit below the explanation and never pretend to be the explanation.',
  },
];

export function sectionBySlug(slug) {
  return sections.find((section) => section.slug === slug) ?? null;
}

export const topicSections = sections.filter((section) => section.group === 'topic');
export const crossSections = sections.filter((section) => section.group === 'cross');
