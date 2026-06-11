export type ProposalBlockType =
  | "cover"
  | "clientInfo"
  | "companyInfo"
  | "summary"
  | "problem"
  | "solution"
  | "scope"
  | "pricing"
  | "timeline"
  | "terms"
  | "signature";

export type ProposalBlock = {
  id: string;
  type: ProposalBlockType;
  order: number;
  content: Record<string, unknown>;
};

export type CoverContent = {
  title: string;
  subtitle: string;
  clientName: string;
  eyebrow?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
};

export type SectionContent = {
  heading: string;
  body: string;
  points: string;
};

export type ScopeContent = SectionContent & {
  deliverables?: string;
};

export type PricingItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
};

export type PricingContent = {
  heading: string;
  items: PricingItem[];
};

export type TimelineContent = {
  heading: string;
  milestones: string;
};

export type TermsContent = {
  heading: string;
  body: string;
};

export type SignatureContent = {
  heading: string;
  acceptanceText: string;
  signerName: string;
  signerTitle: string;
};

export type BlockProps<TContent> = {
  content: TContent;
  onChange: (content: TContent) => void;
  readOnly?: boolean;
  signatureData?: string | null;
  signatureMeta?: string | null;
};

export const blockLabels: Record<ProposalBlockType, string> = {
  cover: "Cover",
  clientInfo: "Client information",
  companyInfo: "Company information",
  summary: "Proposal summary",
  problem: "Problem statement",
  solution: "Solution",
  scope: "Scope",
  pricing: "Pricing table",
  timeline: "Timeline",
  terms: "Terms",
  signature: "Signature",
};

export function createDefaultBlock(type: ProposalBlockType): ProposalBlock {
  const id = createBlockId(type);

  return {
    id,
    type,
    order: 0,
    content: getDefaultContent(type),
  };
}

export function createBlockId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getDefaultContent(
  type: ProposalBlockType,
): Record<string, unknown> {
  if (type === "cover") {
    return {
      title: "Growth proposal",
      subtitle: "Prepared for your next phase of scale",
      clientName: "Client company",
      eyebrow: "Prepared proposal",
      backgroundColor: "#0f172a",
      textColor: "#ffffff",
      accentColor: "#14b8a6",
    } satisfies CoverContent;
  }

  if (type === "clientInfo") {
    return {
      heading: "Client information",
      body: "Client company\nPrimary contact\nDecision team",
      points: "Business goals\nSuccess metrics\nKey stakeholders",
    } satisfies SectionContent;
  }

  if (type === "companyInfo") {
    return {
      heading: "Company information",
      body: "Introduce your company, relevant experience, and why your team is the right fit for this work.",
      points: "Proven delivery process\nSenior project team\nClear communication cadence",
    } satisfies SectionContent;
  }

  if (type === "summary") {
    return {
      heading: "Proposal summary",
      body: "A concise overview of the recommended engagement, expected outcomes, and next steps.",
      points: "Outcome-focused plan\nTransparent pricing\nFast approval path",
    } satisfies SectionContent;
  }

  if (type === "problem") {
    return {
      heading: "Problem statement",
      body: "The current process creates delays, unclear ownership, and missed opportunities to convert prospects.",
      points: "Manual follow-up\nFragmented approvals\nLimited visibility",
    } satisfies SectionContent;
  }

  if (type === "solution") {
    return {
      heading: "Recommended solution",
      body: "We will deliver a focused plan that combines strategy, execution, reporting, and client-ready handoff.",
      points: "Discovery workshop\nImplementation roadmap\nReporting and optimization",
    } satisfies SectionContent;
  }

  if (type === "scope") {
    return {
      heading: "Scope of work",
      body: "We will plan, design, and deliver the agreed scope through focused weekly milestones.",
      points:
        "Strategy workshop\nDesign direction\nImplementation support",
      deliverables:
        "Strategy workshop\nDesign direction\nImplementation support",
    } satisfies ScopeContent;
  }

  if (type === "pricing") {
    return {
      heading: "Investment",
      items: [
        {
          id: "pricing-1",
          description: "Discovery and strategy",
          quantity: 1,
          unitPrice: 45000,
          gstRate: 18,
        },
      ],
    } satisfies PricingContent;
  }

  if (type === "timeline") {
    return {
      heading: "Timeline",
      milestones:
        "Week 1: Discovery\nWeek 2: Design\nWeek 3: Build\nWeek 4: Review",
    } satisfies TimelineContent;
  }

  if (type === "terms") {
    return {
      heading: "Terms and acceptance",
      body: "This proposal is valid for 30 days. Work begins after signature and initial payment.",
    } satisfies TermsContent;
  }

  return {
    heading: "Approval",
    acceptanceText:
      "By signing below, the client approves the scope, timeline, pricing, and terms in this proposal.",
    signerName: "Authorized signer",
    signerTitle: "Client representative",
  } satisfies SignatureContent;
}
