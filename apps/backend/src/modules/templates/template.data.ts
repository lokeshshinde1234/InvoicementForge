export type TemplateRecord = {
  templateId: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  previewImages: string[];
  features: string[];
  sections: string[];
  tags: string[];
  popularity: number;
  ratings: number;
  usageCount: number;
  createdAt: string;
};

const baseFeatures = [
  'Drag and drop ready',
  'E-signature compatible',
  'Analytics supported',
  'Team collaboration',
  'Client portal ready',
  'GST invoice friendly',
];

const baseSections = [
  'Cover page',
  'Problem and goals',
  'Scope of work',
  'Pricing options',
  'Timeline',
  'Terms and acceptance',
];

export const templates: TemplateRecord[] = [
  {
    templateId: 'tpl_business_proposal',
    slug: 'business-proposal',
    title: 'Business proposal',
    description:
      'A polished executive proposal with scope, pricing, terms, and approval sections.',
    category: 'Sales',
    previewImages: [
      'https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/Business%20Proposal.png?width=600&height=400&name=Business%20Proposal.png',
    ],
    features: baseFeatures,
    sections: baseSections,
    tags: ['sales', 'proposal', 'business'],
    popularity: 98,
    ratings: 4.8,
    usageCount: 1200,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    templateId: 'tpl_marketing_agency',
    slug: 'marketing-agency',
    title: 'Marketing retainer',
    description:
      'A campaign-ready retainer layout for strategy, deliverables, timelines, and monthly pricing.',
    category: 'Agency',
    previewImages: [
      'https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/Advertising.png?width=600&height=400&name=Advertising.png',
    ],
    features: baseFeatures,
    sections: [
      'Campaign goals',
      'Audience plan',
      'Channel mix',
      'Retainer pricing',
      'Reporting cadence',
      'Approval',
    ],
    tags: ['agency', 'marketing', 'retainer'],
    popularity: 94,
    ratings: 4.7,
    usageCount: 1518,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    templateId: 'tpl_website_redesign',
    slug: 'website-redesign',
    title: 'Website redesign',
    description:
      'A visual website proposal with project phases, optional add-ons, and client sign-off.',
    category: 'Creative',
    previewImages: [
      'https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/branding.png?width=600&height=400&name=branding.png',
    ],
    features: baseFeatures,
    sections: [
      'Design audit',
      'Sitemap',
      'Visual direction',
      'Build phases',
      'Launch plan',
      'Sign-off',
    ],
    tags: ['creative', 'website', 'design'],
    popularity: 89,
    ratings: 4.6,
    usageCount: 1836,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    templateId: 'tpl_consulting_scope',
    slug: 'consulting-scope',
    title: 'Consulting scope',
    description:
      'A clear consulting engagement proposal for discovery, milestones, pricing, and success criteria.',
    category: 'Consulting',
    previewImages: [
      'https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/accounting.png?width=600&height=400&name=accounting.png',
    ],
    features: baseFeatures,
    sections: [
      'Discovery',
      'Workstreams',
      'Milestones',
      'Success criteria',
      'Fees',
      'Acceptance',
    ],
    tags: ['consulting', 'scope', 'strategy'],
    popularity: 87,
    ratings: 4.7,
    usageCount: 2154,
    createdAt: '2026-01-04T00:00:00.000Z',
  },
];
