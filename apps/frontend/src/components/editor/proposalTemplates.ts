import { templateCards } from "@/components/marketing/site-data";
import {
  getCustomTemplateCards,
  getCustomTemplatePreset,
} from "@/lib/custom-templates";
import type { ProposalBlock, ProposalBlockType } from "./types";

type EditorTheme = {
  accent: string;
  dark: string;
  soft: string;
  coverText: string;
  layout: "executive" | "campaign" | "studio" | "advisory" | "operations";
};

export type ProposalTemplatePreset = {
  slug: string;
  title: string;
  category: string;
  description: string;
  editorTitle: string;
  clientName: string;
  theme: EditorTheme;
  blocks: ProposalBlock[];
  recommendedBlocks: ProposalBlockType[];
};

function block(
  type: ProposalBlockType,
  order: number,
  content: Record<string, unknown>,
): ProposalBlock {
  return {
    id: `${type}-${order}`,
    type,
    order,
    content,
  };
}

const templateBySlug = new Map(templateCards.map((template) => [template.slug, template]));

const presets: ProposalTemplatePreset[] = [
  {
    slug: "business-proposal",
    title: "Business proposal",
    category: "Sales",
    description: "A polished executive proposal for sales-led business deals.",
    editorTitle: "Business proposal workspace",
    clientName: "Acme Industries",
    theme: {
      accent: "#0f766e",
      dark: "#0f172a",
      soft: "#ecfdf5",
      coverText: "#ffffff",
      layout: "executive",
    },
    recommendedBlocks: ["summary", "problem", "solution", "scope", "timeline", "pricing", "terms", "signature"],
    blocks: [
      block("cover", 0, {
        eyebrow: "Executive proposal",
        title: "Business growth proposal",
        subtitle: "A clear commercial plan for improving conversion, delivery, and revenue visibility.",
        clientName: "Prepared for Acme Industries",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
        accentColor: "#2dd4bf",
      }),
      block("clientInfo", 1, {
        heading: "Client information",
        body: "Acme Industries\nPrimary contact: Riya Mehta\nDecision team: Sales, Finance, Operations",
        points: "Revenue target: INR 2.4 Cr\nApproval window: 14 days\nPrimary market: India",
      }),
      block("summary", 2, {
        heading: "Proposal summary",
        body: "We recommend a focused sales enablement and proposal automation rollout that reduces manual work and improves buyer follow-up.",
        points: "Shorter sales cycle\nReusable proposal system\nClear approval and signature flow",
      }),
      block("problem", 3, {
        heading: "Problem statement",
        body: "The current proposal process depends on manual document edits, delayed approvals, and limited visibility after sending.",
        points: "Slow proposal turnaround\nNo central content library\nLimited client engagement data",
      }),
      block("solution", 4, {
        heading: "Recommended solution",
        body: "Build a repeatable proposal workflow with branded templates, interactive pricing, approval gates, and signature-ready acceptance.",
        points: "Template library\nInteractive pricing table\nClient portal and analytics",
      }),
      block("scope", 5, {
        heading: "Scope of work",
        body: "Our team will configure the workspace, migrate core content, and prepare the sales team to send polished proposals.",
        points: "Workspace setup\nTemplate customization\nSales team onboarding",
        deliverables: "Workspace setup\nTemplate customization\nSales team onboarding",
      }),
      block("timeline", 6, {
        heading: "Timeline",
        milestones: "Week 1: Discovery and content audit\nWeek 2: Template build\nWeek 3: Pricing and approval setup\nWeek 4: Training and launch",
      }),
      block("pricing", 7, {
        heading: "Investment",
        items: [
          { id: "business-1", description: "Implementation setup", quantity: 1, unitPrice: 65000, gstRate: 18 },
          { id: "business-2", description: "Template customization", quantity: 3, unitPrice: 22000, gstRate: 18 },
        ],
      }),
      block("terms", 8, {
        heading: "Terms and conditions",
        body: "This proposal is valid for 30 days. Work begins after signature and a 40% kickoff payment.",
      }),
      block("signature", 9, {
        heading: "Approval",
        acceptanceText: "Sign below to approve the proposed scope, investment, and project timeline.",
        signerName: "Riya Mehta",
        signerTitle: "Authorized representative",
      }),
    ],
  },
  {
    slug: "marketing-agency",
    title: "Marketing retainer",
    category: "Agency",
    description: "A campaign-focused retainer proposal for marketing agencies.",
    editorTitle: "Marketing retainer workspace",
    clientName: "Brightlane Foods",
    theme: {
      accent: "#db2777",
      dark: "#831843",
      soft: "#fdf2f8",
      coverText: "#ffffff",
      layout: "campaign",
    },
    recommendedBlocks: ["summary", "companyInfo", "solution", "scope", "timeline", "pricing", "terms", "signature"],
    blocks: [
      block("cover", 0, {
        eyebrow: "Campaign proposal",
        title: "Quarterly growth retainer",
        subtitle: "Content, paid media, reporting, and conversion experiments designed around measurable growth.",
        clientName: "Prepared for Brightlane Foods",
        backgroundColor: "#831843",
        textColor: "#ffffff",
        accentColor: "#f9a8d4",
      }),
      block("summary", 1, {
        heading: "Campaign snapshot",
        body: "A 90-day retainer combining audience research, creative production, paid acquisition, and weekly optimization.",
        points: "Awareness campaigns\nLead generation\nWeekly performance reporting",
      }),
      block("companyInfo", 2, {
        heading: "Agency credentials",
        body: "Our agency team blends strategy, creative, media buying, and analytics into one accountable workflow.",
        points: "Creative direction\nPerformance marketing\nConversion analytics",
      }),
      block("solution", 3, {
        heading: "Marketing approach",
        body: "We will launch fast, test focused campaign angles, and scale the strongest channels based on performance.",
        points: "Message testing\nLanding page recommendations\nRetargeting plan",
      }),
      block("scope", 4, {
        heading: "Monthly deliverables",
        body: "Each month includes strategy, production, media management, reporting, and optimization support.",
        points: "8 social creatives\n2 landing page tests\nWeekly campaign optimization\nMonthly growth report",
        deliverables: "8 social creatives\n2 landing page tests\nWeekly campaign optimization\nMonthly growth report",
      }),
      block("timeline", 5, {
        heading: "Retainer rhythm",
        milestones: "Week 1: Strategy and creative plan\nWeek 2: Campaign launch\nWeek 3: Optimization sprint\nWeek 4: Reporting and next-month planning",
      }),
      block("pricing", 6, {
        heading: "Monthly retainer",
        items: [
          { id: "agency-1", description: "Strategy and account management", quantity: 1, unitPrice: 45000, gstRate: 18 },
          { id: "agency-2", description: "Creative production", quantity: 1, unitPrice: 55000, gstRate: 18 },
          { id: "agency-3", description: "Paid media management", quantity: 1, unitPrice: 35000, gstRate: 18 },
        ],
      }),
      block("terms", 7, {
        heading: "Retainer terms",
        body: "Minimum commitment is three months. Media spend is billed separately and approved before campaign launch.",
      }),
      block("signature", 8, {
        heading: "Retainer approval",
        acceptanceText: "Sign below to activate the marketing retainer and begin campaign onboarding.",
        signerName: "Marketing lead",
        signerTitle: "Client approver",
      }),
    ],
  },
  {
    slug: "website-redesign",
    title: "Website redesign",
    category: "Creative",
    description: "A visual web design proposal with phases, UX, and launch scope.",
    editorTitle: "Web design proposal workspace",
    clientName: "Northstar Studio",
    theme: {
      accent: "#7c3aed",
      dark: "#2e1065",
      soft: "#f5f3ff",
      coverText: "#ffffff",
      layout: "studio",
    },
    recommendedBlocks: ["problem", "solution", "scope", "timeline", "pricing", "terms", "signature"],
    blocks: [
      block("cover", 0, {
        eyebrow: "Website redesign",
        title: "Digital experience redesign",
        subtitle: "A modern web presence built around clarity, conversion, and a sharper brand story.",
        clientName: "Prepared for Northstar Studio",
        backgroundColor: "#2e1065",
        textColor: "#ffffff",
        accentColor: "#c4b5fd",
      }),
      block("problem", 1, {
        heading: "Current website challenges",
        body: "The current site does not clearly communicate value, guide visitors to action, or support easy content updates.",
        points: "Unclear conversion path\nOutdated visual system\nDifficult content maintenance",
      }),
      block("solution", 2, {
        heading: "Design direction",
        body: "We will create a flexible website system with stronger hierarchy, reusable sections, and responsive page templates.",
        points: "UX wireframes\nVisual design system\nResponsive implementation",
      }),
      block("scope", 3, {
        heading: "Project scope",
        body: "The redesign covers strategy, UX, visual design, frontend implementation, QA, and launch support.",
        points: "Homepage\nServices pages\nCase study template\nContact flow",
        deliverables: "Homepage\nServices pages\nCase study template\nContact flow",
      }),
      block("timeline", 4, {
        heading: "Design and launch plan",
        milestones: "Week 1: Discovery and sitemap\nWeek 2: Wireframes\nWeek 3: Visual design\nWeek 4-5: Build and QA\nWeek 6: Launch",
      }),
      block("pricing", 5, {
        heading: "Project investment",
        items: [
          { id: "web-1", description: "UX and content architecture", quantity: 1, unitPrice: 50000, gstRate: 18 },
          { id: "web-2", description: "Visual design and development", quantity: 1, unitPrice: 140000, gstRate: 18 },
        ],
      }),
      block("terms", 6, {
        heading: "Project terms",
        body: "Includes two design revision rounds. Additional pages or integrations are scoped separately.",
      }),
      block("signature", 7, {
        heading: "Project approval",
        acceptanceText: "Sign below to approve the redesign scope and begin discovery.",
        signerName: "Project sponsor",
        signerTitle: "Client representative",
      }),
    ],
  },
];

const fallbackPresets = [
  {
    match: "Consulting",
    theme: { accent: "#2563eb", dark: "#1e3a8a", soft: "#eff6ff", coverText: "#ffffff", layout: "advisory" as const },
    title: "Consulting engagement workspace",
    points: "Discovery interviews\nOperating model review\nMilestone recommendations",
  },
  {
    match: "Operations",
    theme: { accent: "#475569", dark: "#111827", soft: "#f8fafc", coverText: "#ffffff", layout: "operations" as const },
    title: "Operations proposal workspace",
    points: "Service plan\nCompliance notes\nRecurring delivery cadence",
  },
  {
    match: "Technology",
    theme: { accent: "#0891b2", dark: "#164e63", soft: "#ecfeff", coverText: "#ffffff", layout: "executive" as const },
    title: "Technology implementation workspace",
    points: "Integration plan\nTechnical rollout\nSupport model",
  },
  {
    match: "Finance",
    theme: { accent: "#16a34a", dark: "#14532d", soft: "#f0fdf4", coverText: "#ffffff", layout: "advisory" as const },
    title: "Finance proposal workspace",
    points: "GST-ready workflow\nPayment terms\nInvoice handoff",
  },
  {
    match: "Service",
    theme: { accent: "#ca8a04", dark: "#713f12", soft: "#fefce8", coverText: "#ffffff", layout: "operations" as const },
    title: "Service agreement workspace",
    points: "SLA coverage\nMaintenance cadence\nEscalation path",
  },
];

function createFallbackPreset(slug: string): ProposalTemplatePreset {
  const template = templateBySlug.get(slug);

  if (!template) {
    return createMissingImportedPreset(slug);
  }

  const fallback =
    fallbackPresets.find((item) => item.match === template.category) ??
    fallbackPresets[0];

  return {
    slug: template.slug,
    title: template.title,
    category: template.category,
    description: template.description,
    editorTitle: fallback.title,
    clientName: "Client company",
    theme: fallback.theme,
    recommendedBlocks: ["clientInfo", "companyInfo", "summary", "solution", "scope", "timeline", "pricing", "terms", "signature"],
    blocks: [
      block("cover", 0, {
        eyebrow: `${template.category} proposal`,
        title: template.title,
        subtitle: template.description,
        clientName: "Prepared for Client company",
        backgroundColor: fallback.theme.dark,
        textColor: fallback.theme.coverText,
        accentColor: fallback.theme.accent,
      }),
      block("clientInfo", 1, {
        heading: "Client information",
        body: "Client company\nPrimary contact\nApproval team",
        points: "Business objective\nDecision timeline\nKey stakeholders",
      }),
      block("companyInfo", 2, {
        heading: "Company information",
        body: "Introduce your team, relevant experience, and delivery strengths.",
        points: "Experienced specialists\nClear operating cadence\nReliable documentation",
      }),
      block("summary", 3, {
        heading: "Proposal summary",
        body: `This ${template.category.toLowerCase()} proposal is structured to help the client understand the recommended approach and approve next steps.`,
        points: fallback.points,
      }),
      block("solution", 4, {
        heading: "Solution",
        body: "A practical plan tailored to the client’s goals, timeline, budget, and approval process.",
        points: fallback.points,
      }),
      block("scope", 5, {
        heading: "Scope of work",
        body: "The engagement includes planning, delivery, review, and final handoff.",
        points: fallback.points,
        deliverables: fallback.points,
      }),
      block("timeline", 6, {
        heading: "Timeline",
        milestones: "Phase 1: Discovery\nPhase 2: Delivery\nPhase 3: Review\nPhase 4: Approval and handoff",
      }),
      block("pricing", 7, {
        heading: "Pricing",
        items: [
          { id: `${template.slug}-1`, description: `${template.title} setup`, quantity: 1, unitPrice: 55000, gstRate: 18 },
          { id: `${template.slug}-2`, description: "Delivery and support", quantity: 1, unitPrice: 75000, gstRate: 18 },
        ],
      }),
      block("terms", 8, {
        heading: "Terms and conditions",
        body: "This proposal is valid for 30 days. Any scope changes will be estimated and approved before work continues.",
      }),
      block("signature", 9, {
        heading: "Signature",
        acceptanceText: "Sign below to approve this proposal and start the engagement.",
        signerName: "Authorized signer",
        signerTitle: "Client representative",
      }),
    ],
  };
}

function createMissingImportedPreset(slug: string): ProposalTemplatePreset {
  const title = titleFromSlug(slug);

  return {
    slug,
    title,
    category: "Imported",
    description:
      "This imported template is not available in this company workspace. Browse the file again to restore it.",
    editorTitle: `${title} proposal workspace`,
    clientName: "Client company",
    theme: {
      accent: "#0f766e",
      dark: "#0f172a",
      soft: "#ecfdf5",
      coverText: "#ffffff",
      layout: "executive",
    },
    recommendedBlocks: ["summary", "scope", "pricing", "terms", "signature"],
    blocks: [
      block("cover", 0, {
        eyebrow: "Imported template",
        title,
        subtitle:
          "This selected template could not be loaded from this company workspace.",
        clientName: "Prepared for Client company",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
        accentColor: "#14b8a6",
      }),
      block("summary", 1, {
        heading: "Template not loaded",
        body: "Browse this template file again from the template gallery to restore the original editable sections.",
        points: "Company-scoped template storage\nNo default template substitution\nReady to re-import selected file",
      }),
      block("pricing", 2, {
        heading: "Investment",
        items: [
          {
            id: `${slug}-pricing-1`,
            description: "Imported pricing item - edit amount",
            quantity: 1,
            unitPrice: 0,
            gstRate: 18,
          },
        ],
      }),
      block("terms", 3, {
        heading: "Terms and conditions",
        body: "Add the selected template terms after re-importing the file.",
      }),
      block("signature", 4, {
        heading: "Approval",
        acceptanceText:
          "Sign below to approve this proposal and begin the engagement.",
        signerName: "Authorized signer",
        signerTitle: "Client representative",
      }),
    ],
  };
}

function titleFromSlug(slug: string): string {
  const title = slug
    .replace(/^custom-/u, "")
    .replace(/[-_]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return title
    ? title.replace(/\b\w/gu, (letter) => letter.toUpperCase())
    : "Imported template";
}

export function getProposalTemplatePreset(slug?: string | null): ProposalTemplatePreset {
  const normalizedSlug = slug || "business-proposal";
  const customPreset = getCustomTemplatePreset(normalizedSlug);

  if (customPreset) {
    return clonePreset(customPreset);
  }

  const preset = presets.find((item) => item.slug === normalizedSlug);

  if (preset) {
    return clonePreset(preset);
  }

  return clonePreset(createFallbackPreset(normalizedSlug));
}


export function getAvailableTemplateSlugs(): string[] {
  return [
    ...getCustomTemplateCards().map((template) => template.slug),
    ...templateCards.map((template) => template.slug),
  ];
}

function clonePreset(preset: ProposalTemplatePreset): ProposalTemplatePreset {
  return {
    ...preset,
    blocks: preset.blocks.map((item, index) => ({
      ...item,
      id: `${item.type}-${index}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      content: cloneContent(item.content),
    })),
    recommendedBlocks: [...preset.recommendedBlocks],
  };
}

function cloneContent<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}
