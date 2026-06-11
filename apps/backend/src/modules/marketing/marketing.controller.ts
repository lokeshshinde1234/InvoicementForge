import { Controller, Get } from '@nestjs/common';
import { TenantPlan } from '../tenants/tenant.entity';
import { TemplatesService } from '../templates/templates.service';
import { PLAN_DEFINITIONS } from '../subscriptions/subscription-plans';

const features = [
  {
    title: 'Drag-and-drop proposals',
    copy: 'Build reusable covers, scopes, pricing, timelines, terms, and signature pages without rebuilding every deal from scratch.',
  },
  {
    title: 'Interactive quoting',
    copy: 'Let buyers review packages, add optional items, and approve cleaner pricing before finance turns it into an invoice.',
  },
  {
    title: 'E-signatures and approvals',
    copy: 'Capture legally useful acceptance, approval status, comments, audit history, and client signatures in one secure flow.',
  },
  {
    title: 'Document analytics',
    copy: 'Track opens, sections viewed, proposal value, signature status, invoice readiness, and stalled deals.',
  },
  {
    title: 'GST-ready invoices',
    copy: 'Move from accepted proposal to CGST, SGST, IGST, HSN/SAC-aware invoices using the backend already in this project.',
  },
  {
    title: 'Client portal',
    copy: 'Give clients a polished place to view, approve, sign, pay, and download their business documents.',
  },
];

const productModules = [
  [
    'Proposal editor',
    'Reusable content blocks, pricing tables, terms, timelines, and client-ready layouts.',
  ],
  [
    'Deal rooms',
    'Secure proposal links where clients can review, comment, sign, and download.',
  ],
  [
    'Revenue handoff',
    'Approved proposals can move into invoice and payment workflows without retyping.',
  ],
  [
    'Team control',
    'Workspace structure, tenant-aware auth, and a foundation for roles and permissions.',
  ],
];

const integrations = [
  'Razorpay',
  'Stripe',
  'Tally Prime',
  'QuickBooks',
  'Xero',
  'Salesforce',
  'HubSpot',
  'Zapier',
];

const industries = ['Agencies', 'Consultants', 'Service businesses'];

@Controller('marketing')
export class MarketingController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('site')
  getSiteContent() {
    return {
      features,
      productModules,
      integrations,
      industries,
      templates: this.templatesService.findAll().map((template) => ({
        slug: template.slug,
        title: template.title,
        category: template.category,
        image: template.previewImages[0],
        description: template.description,
      })),
      plans: Object.values(PLAN_DEFINITIONS).map((plan) => ({
        name: plan.name,
        monthlyPrice: this.priceLabel(plan.monthlyPrice),
        annualPrice: this.priceLabel(
          plan.yearlyPrice / (plan.plan === TenantPlan.FREE ? 1 : 12),
        ),
        sendLimit:
          plan.plan === TenantPlan.ENTERPRISE
            ? 'Custom'
            : `${plan.monthlySendLimit} sends/mo`,
        overage:
          plan.plan === TenantPlan.FREE
            ? 'Upgrade required'
            : 'Upgrade for more volume',
        cadence:
          plan.plan === TenantPlan.FREE || plan.plan === TenantPlan.ENTERPRISE
            ? ''
            : '/user/mo',
        description: this.description(plan.plan),
        cta:
          plan.plan === TenantPlan.ENTERPRISE
            ? 'Book a demo'
            : plan.plan === TenantPlan.FREE
              ? 'Start free'
              : 'Start free trial',
        href:
          plan.plan === TenantPlan.ENTERPRISE
            ? '/demo'
            : plan.plan === TenantPlan.FREE
              ? '/signup'
              : `/subscription/checkout?plan=${plan.plan.toLowerCase()}&billing=yearly`,
        popular: plan.plan === TenantPlan.STARTER,
        features: plan.features,
        monthlyDetails: {
          sends: `${plan.monthlySendLimit} sends/mo`,
          templates: `Up to ${plan.monthlyTemplateLimit} templates`,
          overage:
            plan.plan === TenantPlan.FREE
              ? 'Upgrade required'
              : 'Upgrade for more volume',
          features: plan.features,
        },
        yearlyDetails: {
          sends:
            plan.plan === TenantPlan.ENTERPRISE
              ? 'Custom'
              : `${plan.yearlyMonthlySendLimit * 12} sends/year`,
          templates:
            plan.plan === TenantPlan.ENTERPRISE
              ? 'Unlimited templates'
              : `Up to ${plan.yearlyTemplateLimit} templates`,
          overage:
            plan.plan === TenantPlan.FREE
              ? 'Upgrade required'
              : `${plan.yearlyMonthlySendLimit} sends/month equivalent with annual rollover`,
          features:
            plan.plan === TenantPlan.FREE || plan.plan === TenantPlan.ENTERPRISE
              ? plan.features
              : [
                  'Everything in monthly',
                  'Annual usage rollover',
                  'Priority support',
                ],
        },
      })),
    };
  }

  private priceLabel(amount: number): string {
    if (!amount) return 'INR 0';
    return `INR ${Math.round(amount).toLocaleString('en-IN')}`;
  }

  private description(plan: TenantPlan): string {
    if (plan === TenantPlan.FREE) {
      return 'For individuals validating proposals, GST invoices, and client portal workflows.';
    }
    if (plan === TenantPlan.STARTER) {
      return 'For small teams sending branded proposals, quotes, and GST-ready invoices.';
    }
    if (plan === TenantPlan.BUSINESS) {
      return 'For growing businesses that need teams, analytics, compliance, and integrations.';
    }
    return 'For organizations that need advanced security, support, APIs, and custom rollout.';
  }
}
