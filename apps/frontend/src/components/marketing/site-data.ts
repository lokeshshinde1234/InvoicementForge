export const navItems = [
  { label: "Product", href: "/product" },
  { label: "Features", href: "/features" },
  { label: "Templates", href: "/templates" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
  { label: "Customers", href: "/customers" },
];

export const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Product overview", href: "/product" },
      { label: "Proposal builder", href: "/features#proposal-builder" },
      { label: "Interactive pricing", href: "/features#pricing-tables" },
      { label: "Client portal", href: "/features#client-portal" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { label: "Sales teams", href: "/customers" },
      { label: "Agencies", href: "/templates#agency" },
      { label: "Consultants", href: "/templates#consulting" },
      { label: "GST invoicing", href: "/features#gst" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Product", href: "/product" },
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Pricing", href: "/pricing" },
      { label: "Book demo", href: "/demo" },
      { label: "Contact", href: "/contact" },
      { label: "Login", href: "/login" },
    ],
  },
];

export const featureCards = [
  {
    title: "Drag-and-drop proposals",
    copy: "Build reusable covers, scopes, pricing, timelines, terms, and signature pages without rebuilding every deal from scratch.",
  },
  {
    title: "Interactive quoting",
    copy: "Let buyers review packages, add optional items, and approve cleaner pricing before finance turns it into an invoice.",
  },
  {
    title: "E-signatures and approvals",
    copy: "Capture legally useful acceptance, approval status, comments, audit history, and client signatures in one secure flow.",
  },
  {
    title: "Document analytics",
    copy: "Track opens, sections viewed, proposal value, signature status, invoice readiness, and stalled deals.",
  },
  {
    title: "GST-ready invoices",
    copy: "Move from accepted proposal to CGST, SGST, IGST, HSN/SAC-aware invoices using the backend already in this project.",
  },
  {
    title: "Client portal",
    copy: "Give clients a polished place to view, approve, sign, pay, and download their business documents.",
  },
];

export const planCards = [
  {
    name: "Free",
    monthlyPrice: "INR 0",
    annualPrice: "INR 0",
    sendLimit: "3 sends/mo",
    overage: "Upgrade required",
    cadence: "",
    description: "For individuals validating proposals, GST invoices, and client portal workflows.",
    cta: "Start free",
    href: "/signup",
    features: ["3 document sends", "1 workspace", "Basic templates", "GST invoice builder", "Client preview links"],
  },
  {
    name: "Starter",
    monthlyPrice: "INR 1,499",
    annualPrice: "INR 999",
    sendLimit: "10 sends/mo",
    overage: "INR 45 per extra send",
    cadence: "/user/mo",
    description: "For small teams sending branded proposals, quotes, and GST-ready invoices.",
    cta: "Start free trial",
    href: "/signup",
    popular: true,
    features: ["10 document sends", "Up to 5 templates", "E-signatures", "Document tracking", "Payment links"],
  },
  {
    name: "Business",
    monthlyPrice: "INR 3,999",
    annualPrice: "INR 2,999",
    sendLimit: "50 sends/mo",
    overage: "INR 25 per extra send",
    cadence: "/user/mo",
    description: "For growing businesses that need teams, analytics, compliance, and integrations.",
    cta: "Start free trial",
    href: "/signup",
    features: ["Unlimited drafting", "Up to 25 templates", "Roles and permissions", "Document analytics", "Accounting integrations"],
  },
  {
    name: "Enterprise",
    monthlyPrice: "Let's talk",
    annualPrice: "Let's talk",
    sendLimit: "Custom",
    overage: "Custom",
    cadence: "",
    description: "For organizations that need advanced security, support, APIs, and custom rollout.",
    cta: "Book a demo",
    href: "/demo",
    features: ["Unlimited templates", "Single Sign-On", "API access", "Feature flags", "Multiple workspaces"],
  },
];

export const templateCards = [
  {
    slug: "business-proposal",
    title: "Business proposal",
    category: "Sales",
    image:
      "https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/Business%20Proposal.png?width=600&height=400&name=Business%20Proposal.png",
    description: "A polished executive proposal with scope, pricing, terms, and approval sections.",
  },
  {
    slug: "marketing-agency",
    title: "Marketing retainer",
    category: "Agency",
    image:
      "https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/Advertising.png?width=600&height=400&name=Advertising.png",
    description: "A campaign-ready retainer layout for strategy, deliverables, timelines, and monthly pricing.",
  },
  {
    slug: "website-redesign",
    title: "Website redesign",
    category: "Creative",
    image:
      "https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/branding.png?width=600&height=400&name=branding.png",
    description: "A visual website proposal with project phases, optional add-ons, and client sign-off.",
  },
  {
    slug: "consulting-scope",
    title: "Consulting scope",
    category: "Consulting",
    image:
      "https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/accounting.png?width=600&height=400&name=accounting.png",
    description: "A clear consulting engagement proposal for discovery, milestones, pricing, and success criteria.",
  },
  {
    slug: "facility-services",
    title: "Facility services",
    category: "Operations",
    image:
      "https://www.proposify.com/hs-fs/hubfs/2026%20Templates%20(V3)/cleaning.png?width=600&height=400&name=cleaning.png",
    description: "A service proposal for recurring operations, teams, compliance notes, and quote options.",
  },
  {
    slug: "software-development",
    title: "Software implementation",
    category: "Technology",
    image:
      "https://www.proposify.com/hs-fs/hubfs/assets/images/templates/proposal/adwords-ppc-proposal-template-cover.jpg?width=600&height=400&name=adwords-ppc-proposal-template-cover.jpg",
    description: "A structured implementation template for onboarding, integrations, support, and delivery phases.",
  },
  {
    slug: "gst-invoice-package",
    title: "GST invoice package",
    category: "Finance",
    image:
      "https://www.proposify.com/hs-fs/hubfs/assets/images/templates/quote/catering-quote-template-cover.png?width=600&height=400&name=catering-quote-template-cover.png",
    description: "A finance-friendly package that bridges accepted proposals into GST-ready invoicing.",
  },
  {
    slug: "maintenance-agreement",
    title: "Maintenance agreement",
    category: "Service",
    image:
      "https://www.proposify.com/hs-fs/hubfs/assets/images/templates/proposal/construction-job-proposal-template-cover.jpg?width=600&height=400&name=construction-job-proposal-template-cover.jpg",
    description: "A recurring service agreement with scope, SLAs, contract terms, and acceptance controls.",
  },
];

export const integrationCards = [
  "Razorpay",
  "Stripe",
  "Tally Prime",
  "QuickBooks",
  "Xero",
  "Salesforce",
  "HubSpot",
  "Zapier",
];
