import { templateCards } from "@/components/marketing/site-data";
import type { ProposalTemplatePreset } from "@/components/editor/proposalTemplates";
import {
  createDefaultBlock,
  type ProposalBlock,
  type ProposalBlockType,
} from "@/components/editor/types";

export const CUSTOM_TEMPLATE_EVENT = "invoiceforge:custom-template-imported";

const STORAGE_KEY = "invoiceforgeCustomProposalTemplates";
const HIDDEN_STORAGE_KEY = "invoiceforgeHiddenProposalTemplates";
const LAST_IMPORTED_STORAGE_KEY = "invoiceforgeLastImportedProposalTemplate";
const MAX_PDF_TEXT_LENGTH = 30000;
const MAX_IMPORTED_SECTIONS = 18;
const blockTypes: ProposalBlockType[] = [
  "cover",
  "clientInfo",
  "companyInfo",
  "summary",
  "problem",
  "solution",
  "scope",
  "pricing",
  "timeline",
  "terms",
  "signature",
];

export type CustomTemplateCard = (typeof templateCards)[number] & {
  custom: true;
};

export function getCustomTemplatePresets(): ProposalTemplatePreset[] {
  if (typeof window === "undefined") {
    return [];
  }

  migrateLegacyTemplates();

  try {
    const raw = window.localStorage.getItem(scopedStorageKey(STORAGE_KEY));
    const parsed = raw ? JSON.parse(raw) : [];
    const savedTemplates = Array.isArray(parsed)
      ? parsed
          .map((item) => normalizeTemplatePreset(item))
          .filter((item): item is ProposalTemplatePreset => Boolean(item))
      : [];
    const handoffTemplate = getLastImportedTemplate();

    if (
      handoffTemplate &&
      !savedTemplates.some((template) => template.slug === handoffTemplate.slug)
    ) {
      return [handoffTemplate, ...savedTemplates];
    }

    return savedTemplates;
  } catch {
    return [];
  }
}

export function getCustomTemplateCards(): CustomTemplateCard[] {
  const hiddenSlugs = getHiddenTemplateSlugs();

  return getCustomTemplatePresets()
    .map(
      (preset): CustomTemplateCard => ({
        slug: preset.slug,
        title: preset.title,
        category: preset.category,
        description: preset.description,
        image: "",
        custom: true,
      }),
    )
    .filter((template) => !hiddenSlugs.includes(template.slug));
}

export function getCustomTemplatePreset(
  slug?: string | null,
): ProposalTemplatePreset | null {
  if (!slug) {
    return null;
  }

  return (
    getCustomTemplatePresets().find((template) => template.slug === slug) ??
    null
  );
}

export async function importTemplateFile(file: File): Promise<ProposalTemplatePreset> {
  if (isPdfFile(file)) {
    const pdfText = await extractPdfText(file).catch(() => "");
    const preset = createPdfTemplatePreset(file, pdfText);
    saveCustomTemplate(preset);
    return preset;
  }

  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  const preset = normalizeTemplatePreset(parsed, file.name);

  if (!preset) {
    throw new Error(
      "Template file must include a title and valid proposal blocks.",
    );
  }

  saveCustomTemplate(preset);

  return preset;
}

export function deleteCompanyTemplate(slug: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const isCustomTemplate = Boolean(getCustomTemplatePreset(slug));

  if (isCustomTemplate) {
    const next = getCustomTemplatePresets().filter(
      (template) => template.slug !== slug,
    );
    window.localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(next));
    removeLastImportedTemplate(slug);
  } else {
    const hiddenSlugs = getHiddenTemplateSlugs();
    if (!hiddenSlugs.includes(slug)) {
      window.localStorage.setItem(
        scopedStorageKey(HIDDEN_STORAGE_KEY),
        JSON.stringify([slug, ...hiddenSlugs]),
      );
    }
  }

  window.dispatchEvent(new CustomEvent(CUSTOM_TEMPLATE_EVENT));
}

export function getHiddenTemplateSlugs(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(scopedStorageKey(HIDDEN_STORAGE_KEY));
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function saveCustomTemplate(preset: ProposalTemplatePreset): void {
  const existing = getCustomTemplatePresets().filter(
    (template) => template.slug !== preset.slug,
  );
  const next = [preset, ...existing].slice(0, 50);
  window.localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(next));
  window.sessionStorage.setItem(LAST_IMPORTED_STORAGE_KEY, JSON.stringify(preset));
  window.dispatchEvent(new CustomEvent(CUSTOM_TEMPLATE_EVENT));
}

function getLastImportedTemplate(): ProposalTemplatePreset | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_IMPORTED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return normalizeTemplatePreset(parsed);
  } catch {
    return null;
  }
}

function removeLastImportedTemplate(slug: string): void {
  const lastImportedTemplate = getLastImportedTemplate();

  if (lastImportedTemplate?.slug === slug) {
    window.sessionStorage.removeItem(LAST_IMPORTED_STORAGE_KEY);
  }
}

function migrateLegacyTemplates(): void {
  const scopedKey = scopedStorageKey(STORAGE_KEY);

  if (scopedKey === STORAGE_KEY || window.localStorage.getItem(scopedKey)) {
    return;
  }

  const legacy = window.localStorage.getItem(STORAGE_KEY);

  if (legacy) {
    window.localStorage.setItem(scopedKey, legacy);
  }
}

function scopedStorageKey(baseKey: string): string {
  const companyKey = readCompanyStorageScope();
  return companyKey ? `${baseKey}:${companyKey}` : baseKey;
}

function readCompanyStorageScope(): string {
  const token =
    window.sessionStorage.getItem("token") || window.localStorage.getItem("token");

  if (!token) {
    return "";
  }

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized)) as {
      tenantId?: string;
      companyId?: string;
      sub?: string;
      email?: string;
    };

    return (
      stringValue(parsed.tenantId) ||
      stringValue(parsed.companyId) ||
      stringValue(parsed.sub) ||
      stringValue(parsed.email)
    );
  } catch {
    return "";
  }
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  let collectedLength = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (collectedLength >= MAX_PDF_TEXT_LENGTH) {
      break;
    }

    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => {
        if (!isRecord(item)) {
          return "";
        }

        const record = item as Record<string, unknown>;
        const value = stringValue(record.str);
        return record.hasEOL === true ? `${value}\n` : value;
      })
      .join(" ")
      .replace(/[ \t]+\n/gu, "\n")
      .replace(/\n[ \t]+/gu, "\n");

    pages.push(pageText);
    collectedLength += pageText.length;
  }

  return normalizePdfText(pages.join("\n\n")).slice(0, MAX_PDF_TEXT_LENGTH);
}

function createPdfTemplatePreset(file: File, pdfText: string): ProposalTemplatePreset {
  const importedSections = getPdfSections(pdfText);
  const detectedTitle = importedSections.find(
    (section) => section.kind === "title",
  )?.heading;
  const title =
    detectedTitle ||
    firstReadableLine(pdfText) ||
    filenameTitle(file.name) ||
    "Imported PDF template";
  const slug = slugify(title);
  const readableText = pdfText.trim();
  const matchedSections = new Set<ImportedPdfSection>();
  const sectionByKind = (kind: ImportedSectionKind) => {
    const section = importedSections.find((item) => item.kind === kind);
    if (section) {
      matchedSections.add(section);
    }

    return section;
  };
  const summary = sectionByKind("summary");
  const clientInfo = sectionByKind("clientInfo");
  const companyInfo = sectionByKind("companyInfo");
  const problem = sectionByKind("problem");
  const solution = sectionByKind("solution");
  const scope = sectionByKind("scope");
  const timeline = sectionByKind("timeline");
  const pricing = sectionByKind("pricing");
  const terms = sectionByKind("terms");
  const signature = sectionByKind("signature");
  const blocks: ProposalBlock[] = [];

  function pushBlock(type: ProposalBlockType, content: Record<string, unknown>) {
    blocks.push({
      id: `${type}-${blocks.length}`,
      type,
      order: blocks.length,
      content,
    });
  }

  pushBlock("cover", {
    eyebrow: "Imported PDF template",
    title,
    subtitle:
      summary?.text ||
      "This editable proposal was created from the selected PDF template file.",
    clientName: clientInfo?.text
      ? firstReadableLine(clientInfo.text) || "Prepared for Client company"
      : "Prepared for Client company",
    backgroundColor: "#0f172a",
    textColor: "#ffffff",
    accentColor: "#14b8a6",
  });

  if (clientInfo) {
    pushBlock("clientInfo", createSectionContent(clientInfo.heading, clientInfo.text));
  }

  if (companyInfo) {
    pushBlock("companyInfo", createSectionContent(companyInfo.heading, companyInfo.text));
  }

  pushBlock(
    "summary",
    createSectionContent(
      summary?.heading || "Imported proposal summary",
      summary?.text ||
        readableText ||
        "This PDF does not contain selectable text. Add the proposal information here before sending.",
    ),
  );

  if (problem) {
    pushBlock("problem", createSectionContent(problem.heading, problem.text));
  }

  if (solution) {
    pushBlock("solution", createSectionContent(solution.heading, solution.text));
  }

  if (scope) {
    pushBlock("scope", {
      ...createSectionContent(scope.heading, scope.text),
      deliverables: pointsFromText(scope.text),
    });
  }

  if (timeline) {
    pushBlock("timeline", {
      heading: timeline.heading,
      milestones: timeline.text,
    });
  }

  if (pricing) {
    pushBlock("pricing", {
      heading: pricing.heading,
      items: extractPricingItems(pricing.text, slug),
    });
  } else {
    pushBlock("pricing", {
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
    });
  }

  if (terms) {
    pushBlock("terms", {
      heading: terms.heading,
      body: terms.text,
    });
  }

  importedSections
    .filter(
      (section) =>
        !matchedSections.has(section) &&
        (section.kind !== "title" || Boolean(section.text)),
    )
    .slice(0, MAX_IMPORTED_SECTIONS)
    .forEach((section) => {
      pushBlock("summary", createSectionContent(section.heading, section.text));
    });

  pushBlock("signature", {
    heading: signature?.heading || "Approval",
    acceptanceText:
      signature?.text ||
      "Sign below to approve this proposal and begin the engagement.",
    signerName: "Authorized signer",
    signerTitle: "Client representative",
  });

  return {
    slug,
    title,
    category: "Imported PDF",
    description:
      readableText
        ? "Imported from the selected PDF file with editable proposal sections."
        : "Imported from a PDF file. This PDF has no selectable text, so edit the sections before sending.",
    editorTitle: `${title} proposal workspace`,
    clientName: "Client company",
    theme: {
      accent: "#0f766e",
      dark: "#0f172a",
      soft: "#ecfdf5",
      coverText: "#ffffff",
      layout: "executive",
    },
    recommendedBlocks: [
      "clientInfo",
      "summary",
      "scope",
      "pricing",
      "terms",
      "signature",
    ],
    blocks,
  };
}

type ImportedSectionKind =
  | "title"
  | "clientInfo"
  | "companyInfo"
  | "summary"
  | "problem"
  | "solution"
  | "scope"
  | "pricing"
  | "timeline"
  | "terms"
  | "signature"
  | "other";

type ImportedPdfSection = {
  heading: string;
  text: string;
  kind: ImportedSectionKind;
};

function getPdfSections(text: string): ImportedPdfSection[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const sections: ImportedPdfSection[] = [];
  let current: ImportedPdfSection | null = null;

  lines.forEach((line, index) => {
    if (isLikelyHeading(line, index)) {
      if (current) {
        sections.push(current);
      }

      current = {
        heading: cleanHeading(line),
        text: "",
        kind: index === 0 ? "title" : classifySection(line),
      };
      return;
    }

    if (!current) {
      current = {
        heading:
          index === 0
            ? cleanHeading(line)
            : `Imported section ${sections.length + 1}`,
        text: index === 0 ? "" : line,
        kind: index === 0 ? "title" : classifySection(line),
      };
      return;
    }

    current.text = [current.text, line].filter(Boolean).join("\n");
    if (current.kind === "other") {
      current.kind = classifySection(`${current.heading}\n${current.text}`);
    }
  });

  if (current) {
    sections.push(current);
  }

  const withText = sections.filter((section) => section.heading || section.text);

  if (withText.length <= 1 && text.trim()) {
    return chunkText(text).map((chunk, index) => ({
      heading:
        index === 0
          ? "Imported proposal content"
          : `Imported section ${index + 1}`,
      text: chunk,
      kind: index === 0 ? "summary" : classifySection(chunk),
    }));
  }

  return withText.map((section, index) => ({
    heading:
      section.kind === "title" && !section.text
        ? section.heading
        : section.heading || `Imported section ${index + 1}`,
    text: section.text || section.heading,
    kind: section.kind,
  }));
}

function createSectionContent(heading: string, text: string) {
  return {
    heading,
    body: text,
    points: pointsFromText(text),
  };
}

function extractPricingItems(text: string, slug: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const amountPattern =
    /(?:rs\.?|inr|usd|\$|eur|gbp|\u20b9)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/iu;
  const candidates = lines.filter((line) =>
    /(?:price|pricing|fee|fees|cost|amount|total|investment|package|rs\.?|inr|usd|\$|eur|gbp|\u20b9)/iu.test(
      line,
    ),
  );
  const sourceLines = candidates.length ? candidates : lines.slice(0, 1);
  const items = sourceLines.slice(0, 8).map((line, index) => {
    const match = line.match(amountPattern);

    return {
      id: `${slug}-pricing-${index + 1}`,
      description:
        line.replace(amountPattern, "").replace(/\s{2,}/gu, " ").trim() ||
        line,
      quantity: 1,
      unitPrice: match ? numberValue(match[1].replace(/,/gu, ""), 0) : 0,
      gstRate: 18,
    };
  });

  return items.length
    ? items
    : [
        {
          id: `${slug}-pricing-1`,
          description: "Imported pricing item - edit amount",
          quantity: 1,
          unitPrice: 0,
          gstRate: 18,
        },
      ];
}

function pointsFromText(text: string): string {
  const points = text
    .split("\n")
    .map((line) => line.replace(/^[-*\u2022\d.)\s]+/u, "").trim())
    .filter((line) => line.length > 3)
    .slice(0, 6);

  return points.length ? points.join("\n") : text.slice(0, 180);
}

function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n{2,}/u)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length) {
    return paragraphs.slice(0, MAX_IMPORTED_SECTIONS);
  }

  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += 1800) {
    chunks.push(text.slice(index, index + 1800).trim());
  }

  return chunks.filter(Boolean).slice(0, MAX_IMPORTED_SECTIONS);
}

function normalizePdfText(text: string): string {
  return text
    .replace(/\r\n?/gu, "\n")
    .replace(/[ \t]{2,}/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function firstReadableLine(text: string): string {
  return (
    text
      .split("\n")
      .map((line) => cleanHeading(line))
      .find(
        (line) =>
          line.length >= 3 &&
          line.length <= 120 &&
          !/^page\s+\d+/iu.test(line),
      ) || ""
  );
}

function isLikelyHeading(line: string, index: number): boolean {
  const cleaned = cleanHeading(line);
  if (index === 0 && cleaned.length <= 120) {
    return true;
  }

  if (cleaned.length < 3 || cleaned.length > 90) {
    return false;
  }

  if (classifySection(cleaned) !== "other") {
    return true;
  }

  const letters = cleaned.replace(/[^A-Za-z]/gu, "");
  const upperLetters = cleaned.replace(/[^A-Z]/gu, "");
  const mostlyUpper =
    letters.length >= 4 && upperLetters.length / letters.length > 0.65;

  return mostlyUpper || /^[0-9]+[.)]\s+[A-Z]/u.test(cleaned);
}

function classifySection(value: string): ImportedSectionKind {
  const text = value.toLowerCase();

  if (/(client|customer|recipient|prepared for|bill to|contact)/u.test(text)) {
    return "clientInfo";
  }

  if (
    /(about us|our company|company profile|agency profile|vendor|prepared by)/u.test(
      text,
    )
  ) {
    return "companyInfo";
  }

  if (/(summary|overview|introduction|objective|proposal brief|executive)/u.test(text)) {
    return "summary";
  }

  if (/(problem|challenge|pain point|current state|requirement)/u.test(text)) {
    return "problem";
  }

  if (/(solution|approach|strategy|methodology|recommendation)/u.test(text)) {
    return "solution";
  }

  if (/(scope|deliverable|service|work included|statement of work|sow)/u.test(text)) {
    return "scope";
  }

  if (/(timeline|schedule|milestone|phase|duration|delivery plan)/u.test(text)) {
    return "timeline";
  }

  if (/(price|pricing|fee|fees|cost|amount|total|investment|commercial|package|payment)/u.test(text)) {
    return "pricing";
  }

  if (/(term|condition|validity|acceptance|cancellation|confidential|agreement)/u.test(text)) {
    return "terms";
  }

  if (/(signature|sign off|approval|authorized|accepted by)/u.test(text)) {
    return "signature";
  }

  return "other";
}

function cleanHeading(value: string): string {
  return value.replace(/\s+/gu, " ").replace(/^[-*\u2022\d.)\s]+/u, "").trim();
}

function normalizeTemplatePreset(
  value: unknown,
  fallbackName = "custom-template.json",
): ProposalTemplatePreset | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = stringValue(value.title) || filenameTitle(fallbackName);
  if (!title) {
    return null;
  }

  const slug = slugify(stringValue(value.slug) || title);
  const category = stringValue(value.category) || "Custom";
  const description =
    stringValue(value.description) ||
    "Imported company template ready for proposal editing.";
  const blocks = normalizeBlocks(value.blocks);
  const baseTheme: ProposalTemplatePreset["theme"] = {
    accent: "#0f766e",
    dark: "#0f172a",
    soft: "#ecfdf5",
    coverText: "#ffffff",
    layout: "executive",
  };

  if (blocks.length === 0) {
    return null;
  }

  return {
    slug,
    title,
    category,
    description,
    editorTitle:
      stringValue(value.editorTitle) || `${title} proposal workspace`,
    clientName: stringValue(value.clientName) || "Client company",
    theme: isRecord(value.theme)
      ? {
          accent: stringValue(value.theme.accent) || baseTheme.accent,
          dark: stringValue(value.theme.dark) || baseTheme.dark,
          soft: stringValue(value.theme.soft) || baseTheme.soft,
          coverText:
            stringValue(value.theme.coverText) || baseTheme.coverText,
          layout: normalizeLayout(value.theme.layout) || baseTheme.layout,
        }
      : baseTheme,
    recommendedBlocks: normalizeRecommendedBlocks(value.recommendedBlocks),
    blocks,
  };
}

function normalizeBlocks(value: unknown): ProposalBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!isRecord(item) || !isBlockType(item.type)) {
        return null;
      }

      const fallback = createDefaultBlock(item.type);

      return {
        id: stringValue(item.id) || `${item.type}-${index}`,
        type: item.type,
        order: numberValue(item.order, index),
        content: normalizeBlockContent(item.type, item.content, fallback.content),
      } satisfies ProposalBlock;
    })
    .filter((item): item is ProposalBlock => Boolean(item))
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }));
}

function normalizeBlockContent(
  type: ProposalBlockType,
  value: unknown,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  const content = isRecord(value) ? value : fallback;

  if (type === "cover") {
    return {
      ...fallback,
      ...content,
      title: stringValue(content.title) || stringValue(fallback.title),
      subtitle: stringValue(content.subtitle) || stringValue(fallback.subtitle),
      clientName:
        stringValue(content.clientName) || stringValue(fallback.clientName),
      eyebrow: stringValue(content.eyebrow) || stringValue(fallback.eyebrow),
      backgroundColor:
        stringValue(content.backgroundColor) ||
        stringValue(fallback.backgroundColor),
      textColor: stringValue(content.textColor) || stringValue(fallback.textColor),
      accentColor:
        stringValue(content.accentColor) || stringValue(fallback.accentColor),
    };
  }

  if (
    type === "clientInfo" ||
    type === "companyInfo" ||
    type === "summary" ||
    type === "problem" ||
    type === "solution"
  ) {
    return {
      ...fallback,
      ...content,
      heading: stringValue(content.heading) || stringValue(fallback.heading),
      body: stringValue(content.body) || stringValue(fallback.body),
      points: stringValue(content.points) || stringValue(fallback.points),
    };
  }

  if (type === "scope") {
    return {
      ...fallback,
      ...content,
      heading: stringValue(content.heading) || stringValue(fallback.heading),
      body: stringValue(content.body) || stringValue(fallback.body),
      points: stringValue(content.points) || stringValue(fallback.points),
      deliverables:
        stringValue(content.deliverables) ||
        stringValue(content.points) ||
        stringValue(fallback.deliverables),
    };
  }

  if (type === "pricing") {
    const fallbackItems = Array.isArray(fallback.items) ? fallback.items : [];
    const items = Array.isArray(content.items) ? content.items : fallbackItems;

    return {
      ...fallback,
      ...content,
      heading: stringValue(content.heading) || stringValue(fallback.heading),
      items: items.map((item, index) => {
        const record = isRecord(item) ? item : {};

        return {
          id: stringValue(record.id) || `pricing-${index + 1}`,
          description:
            stringValue(record.description) || `Pricing item ${index + 1}`,
          quantity: numberValue(record.quantity, 1),
          unitPrice: numberValue(record.unitPrice, 0),
          gstRate: numberValue(record.gstRate, 18),
        };
      }),
    };
  }

  if (type === "timeline") {
    return {
      ...fallback,
      ...content,
      heading: stringValue(content.heading) || stringValue(fallback.heading),
      milestones:
        stringValue(content.milestones) || stringValue(fallback.milestones),
    };
  }

  if (type === "terms") {
    return {
      ...fallback,
      ...content,
      heading: stringValue(content.heading) || stringValue(fallback.heading),
      body: stringValue(content.body) || stringValue(fallback.body),
    };
  }

  return {
    ...fallback,
    ...content,
    heading: stringValue(content.heading) || stringValue(fallback.heading),
    acceptanceText:
      stringValue(content.acceptanceText) ||
      stringValue(fallback.acceptanceText),
    signerName:
      stringValue(content.signerName) || stringValue(fallback.signerName),
    signerTitle:
      stringValue(content.signerTitle) || stringValue(fallback.signerTitle),
  };
}

function normalizeRecommendedBlocks(value: unknown): ProposalBlockType[] {
  if (!Array.isArray(value)) {
    return ["summary", "scope", "pricing", "terms", "signature"];
  }

  const normalized = value.filter(isBlockType);
  return normalized.length
    ? normalized
    : ["summary", "scope", "pricing", "terms", "signature"];
}

function normalizeLayout(value: unknown): ProposalTemplatePreset["theme"]["layout"] | null {
  return value === "executive" ||
    value === "campaign" ||
    value === "studio" ||
    value === "advisory" ||
    value === "operations"
    ? value
    : null;
}

function isBlockType(value: unknown): value is ProposalBlockType {
  return typeof value === "string" && blockTypes.includes(value as ProposalBlockType);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function filenameTitle(filename: string): string {
  return filename
    .replace(/\.[^.]+$/u, "")
    .replace(/[-_]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return slug ? `custom-${slug}` : `custom-template-${Date.now()}`;
}

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}
