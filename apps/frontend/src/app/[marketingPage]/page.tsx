import { notFound } from "next/navigation";
import { CollectionPage } from "@/components/marketing/CollectionPage";

const pages = {
  about: {
    label: "Company",
    title: "InvoiceForge is built for document-led businesses.",
    copy: "A professional operating system for teams that sell services, manage clients, issue compliant invoices, and need every approval to feel clear.",
    cards: [
      {
        title: "Operating-system mindset",
        body: "The product connects proposals, invoices, contracts, payments, compliance, clients, and accounting in one workspace.",
      },
      {
        title: "India-first, global-ready",
        body: "GST, HSN/SAC, Razorpay, UPI, Stripe, multi-currency, and export workflows sit together by design.",
      },
      {
        title: "Built for trust",
        body: "Role-based controls, activity logs, client portals, audit trails, and secure document flows support serious businesses.",
      },
    ],
  },
  help: {
    label: "Help center",
    title: "Guides for setup, sending, signing, billing, and compliance.",
    copy: "Use these documentation entry points to understand the full flow from onboarding to client payment.",
    primaryAction: { label: "Contact support", href: "/contact" },
    cards: [
      {
        title: "Getting started",
        body: "Create your workspace, configure company details, invite your team, and connect payment providers.",
        href: "/onboarding",
      },
      {
        title: "Proposal workflow",
        body: "Pick a template, edit blocks, save versions, send a secure link, and review client activity.",
        href: "/proposals/new",
      },
      {
        title: "GST and accounting",
        body: "Configure tax settings, maintain HSN/SAC values, generate reports, and export to accounting tools.",
        href: "/dashboard/gst",
      },
      {
        title: "Client portal",
        body: "Help clients review documents, comment, approve, sign, pay, and download shared files.",
        href: "/portal/login",
      },
    ],
  },
  docs: {
    label: "Docs",
    title: "Technical and workflow documentation.",
    copy: "Reference pages for teams configuring InvoiceForge as a complete SaaS business workspace.",
    primaryAction: { label: "Open API settings", href: "/dashboard/settings/api" },
    cards: [
      {
        title: "Workspace configuration",
        body: "Company profile, branding, tax, currency, payment, security, and notification setup.",
      },
      {
        title: "Document modules",
        body: "Proposals, invoices, quotes, POs, expenses, challans, notes, receipts, and contracts.",
      },
      {
        title: "Automation points",
        body: "Webhooks, API keys, accounting exports, payment events, client portal events, and audit logs.",
      },
    ],
  },
  blog: {
    label: "Blog",
    title: "Ideas for better proposals, invoices, payments, and GST workflows.",
    copy: "Practical articles for founders, agencies, consultants, and finance teams building a cleaner close-to-cash process.",
    cards: [
      {
        title: "How to turn a proposal into an invoice cleanly",
        body: "A workflow playbook for approvals, scope locking, signatures, taxes, and payment collection.",
        meta: "Workflow",
      },
      {
        title: "GST-ready invoicing for service teams",
        body: "What to capture before sending invoices across state lines and how HSN/SAC data helps reporting.",
        meta: "Compliance",
      },
      {
        title: "Why client portals improve payment speed",
        body: "Shared context, secure files, comments, and payment links reduce follow-up friction.",
        meta: "Client experience",
      },
    ],
  },
  careers: {
    label: "Careers",
    title: "Build the business workspace modern service teams deserve.",
    copy: "InvoiceForge needs product-minded engineers, designers, and operators who care about fast workflows and polished client experiences.",
    primaryAction: { label: "Contact hiring", href: "/contact" },
    cards: [
      {
        title: "Full-stack engineering",
        body: "Work across Next.js, NestJS, document workflows, compliance, payments, and integrations.",
      },
      {
        title: "Product design",
        body: "Shape dense, elegant SaaS surfaces for proposal builders, dashboards, and client portals.",
      },
      {
        title: "Customer success",
        body: "Help agencies, consultants, and finance teams move from scattered documents to a single workflow.",
      },
    ],
  },
};

type PageParams = {
  params: Promise<{
    marketingPage: string;
  }>;
};

export default async function MarketingDynamicPage({ params }: PageParams) {
  const { marketingPage } = await params;
  const page = pages[marketingPage as keyof typeof pages];

  if (!page) {
    notFound();
  }

  return <CollectionPage {...page} />;
}
