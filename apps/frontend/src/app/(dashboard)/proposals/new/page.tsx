"use client";

import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PreviewPanel } from "@/components/editor/PreviewPanel";
import { ProposalEditor } from "@/components/editor/ProposalEditor";
import { templateCards } from "@/components/marketing/site-data";
import {
  getProposalTemplatePreset,
  type ProposalTemplatePreset,
} from "@/components/editor/proposalTemplates";
import {
  blockLabels,
  createDefaultBlock,
  type ProposalBlock,
  type ProposalBlockType,
} from "@/components/editor/types";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-storage";
import { getCustomTemplateCards } from "@/lib/custom-templates";
import {
  CompanyBrandHeader,
  useCompanyBranding,
} from "@/components/branding/CompanyBranding";

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

const COUNTRIES = [
  { name: "India", code: "IN", dialCode: "+91" },
  { name: "United States", code: "US", dialCode: "+1" },
  { name: "United Kingdom", code: "GB", dialCode: "+44" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971" },
  { name: "Australia", code: "AU", dialCode: "+61" },
  { name: "Canada", code: "CA", dialCode: "+1" },
  { name: "Germany", code: "DE", dialCode: "+49" },
  { name: "France", code: "FR", dialCode: "+33" },
  { name: "Singapore", code: "SG", dialCode: "+65" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966" },
];

const NSN_LENGTHS: Record<string, number> = {
  US: 10,
  CA: 10,
  IN: 10,
  GB: 10,
  AU: 9,
  AE: 9,
  DE: 10,
  FR: 9,
  SG: 8,
  SA: 9,
};

const queryClient = new QueryClient();

type Client = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  state?: string | null;
  address?: string | null;
};

export default function NewProposalPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
        <ProposalBuilder />
      </Suspense>
    </QueryClientProvider>
  );
}

function ProposalBuilder() {
  const { branding } = useCompanyBranding();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTemplate = searchParams.get("template");
  const [isSwitchingTemplate, startTransition] = useTransition();
  const [preset, setPreset] = useState<ProposalTemplatePreset>(() =>
    getProposalTemplatePreset(requestedTemplate),
  );
  const [templateReady, setTemplateReady] = useState(false);
  const [title, setTitle] = useState(preset.title);
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompanyName, setNewClientCompanyName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientCountryCode, setNewClientCountryCode] = useState("+91");
  const [newClientGstin, setNewClientGstin] = useState("");
  const [newClientState, setNewClientState] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [blocks, setBlocks] = useState<ProposalBlock[]>(preset.blocks);
  const [customTemplateCards, setCustomTemplateCards] = useState<
    typeof templateCards
  >([]);

  useEffect(() => {
    const nextCustomTemplateCards = getCustomTemplateCards();
    const nextPreset = getProposalTemplatePreset(requestedTemplate);

    setCustomTemplateCards(nextCustomTemplateCards);
    setPreset(nextPreset);
    setTitle(nextPreset.title);
    setBlocks(nextPreset.blocks);
    setTemplateReady(true);

    if (requestedTemplate) {
      window.localStorage.setItem("selectedTemplate", nextPreset.slug);
    }
  }, [requestedTemplate]);

  const allTemplateCards = useMemo(
    () => [...customTemplateCards, ...templateCards],
    [customTemplateCards],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(allTemplateCards.map((template) => template.category)),
      ),
    [allTemplateCards],
  );
  const templatesByCategory = useMemo(() => {
    return allTemplateCards.reduce<Record<string, typeof templateCards>>((acc, template) => {
      const current = acc[template.category] ?? [];
      acc[template.category] = [...current, template];
      return acc;
    }, {});
  }, [allTemplateCards]);
  const templateOptions = templatesByCategory[preset.category] ?? [];
  const selectedNewClientCountry =
    COUNTRIES.find((country) => country.dialCode === newClientCountryCode) ??
    COUNTRIES[0];
  const newClientMaxDigits = NSN_LENGTHS[selectedNewClientCountry.code] ?? 10;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!templateReady) {
      return;
    }

    if (!getAuthToken()) {
      const templateSlug = requestedTemplate || preset.slug;
      const nextPath = `/proposals/new?template=${encodeURIComponent(templateSlug)}`;
      window.localStorage.setItem("selectedTemplate", templateSlug);
      router.replace(`/signup?next=${encodeURIComponent(nextPath)}`);
    }
  }, [preset.slug, requestedTemplate, router, templateReady]);

  const orderedBlocks = useMemo(
    () => blocks.map((block, index) => ({ ...block, order: index })),
    [blocks],
  );
  const signatureReady = useMemo(() => {
    const signatureBlock = orderedBlocks.find((block) => block.type === "signature");

    if (!signatureBlock) {
      return false;
    }

    const content = signatureBlock.content as Record<string, unknown>;

    return [
      content.heading,
      content.acceptanceText,
      content.signerName,
      content.signerTitle,
    ].every(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
  }, [orderedBlocks]);

  function applyTemplateSelection(templateSlug: string) {
    const nextPreset = getProposalTemplatePreset(templateSlug);
    setPreset(nextPreset);
    setTitle(nextPreset.title);
    setBlocks(nextPreset.blocks);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("selectedTemplate", nextPreset.slug);
    }

    startTransition(() => {
      router.replace(`/proposals/new?template=${encodeURIComponent(nextPreset.slug)}`);
    });
  }

  function handleCategoryChange(nextCategory: string) {
    const nextTemplate = templatesByCategory[nextCategory]?.[0];
    if (!nextTemplate) {
      return;
    }
    applyTemplateSelection(nextTemplate.slug);
  }

  function handleTemplateChange(nextTemplateSlug: string) {
    applyTemplateSelection(nextTemplateSlug);
  }

  function addBlock(type: ProposalBlockType) {
    setBlocks((current) => [
      ...current,
      { ...createDefaultBlock(type), order: current.length },
    ]);
  }

  const clientsQuery = useQuery({
    queryKey: ["company-clients"],
    queryFn: async () => {
      const response = await api.get<Client[]>("/clients");
      return response.data;
    },
    staleTime: 15_000,
  });

  const clientOptions =
    clientsQuery.data?.map((client) => ({
      value: client.id,
      label: [
        client.companyName ?? client.name ?? "Unnamed client",
        client.email,
      ]
        .filter(Boolean)
        .join(" - "),
    })) ?? [];

  const selectedClient = useMemo(
    () => clientsQuery.data?.find((client) => client.id === clientId) ?? null,
    [clientId, clientsQuery.data],
  );

  const createClient = useMutation({
    mutationFn: async () => {
      const phone = newClientPhone.trim()
        ? `${newClientCountryCode} ${newClientPhone.trim()}`
        : null;
      const response = await api.post<Client>("/clients", {
        name: newClientName.trim(),
        companyName: newClientCompanyName.trim() || newClientName.trim(),
        email: newClientEmail.trim() || null,
        phone,
        gstin: newClientGstin.trim().toUpperCase() || null,
        state: newClientState.trim().toUpperCase() || null,
        address: newClientAddress.trim() || null,
      });

      return response.data;
    },
    onSuccess: (client) => {
      setClientId(client.id);
      setNewClientName("");
      setNewClientCompanyName("");
      setNewClientEmail("");
      setNewClientPhone("");
      setNewClientCountryCode("+91");
      setNewClientGstin("");
      setNewClientState("");
      setNewClientAddress("");
      void clientsQuery.refetch();
    },
  });

  const saveProposal = useMutation({
    mutationFn: async (status: "DRAFT" | "SENT") => {
      const response = await api.post<{ id: string }>("/proposals", {
        title,
        clientId,
        status,
        blocks: orderedBlocks,
        totalAmount: calculateProposalTotal(orderedBlocks),
      });

      return response.data;
    },
    onSuccess: (proposal) => {
      router.push(`/proposals/${proposal.id}`);
    },
  });

  if (!templateReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-sm">
          Loading selected template...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-950" style={{ backgroundColor: preset.theme.soft }}>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <CompanyBrandHeader branding={branding} subtitle="Proposal builder" />
            <p
              className="text-sm font-semibold uppercase"
              style={{ color: preset.theme.accent }}
            >
              {preset.category} template editor
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {preset.editorTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Loaded from {preset.title}. Edit the sections, pricing, timeline,
              terms, and signature before sending.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              disabled={saveProposal.isPending || !clientId}
              onClick={() => saveProposal.mutate("DRAFT")}
            >
              Save draft
            </Button>
            <Button
              disabled={saveProposal.isPending || !clientId || !signatureReady}
              onClick={() => saveProposal.mutate("SENT")}
            >
              Send
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr_380px] lg:px-8">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div
              className="h-2"
              style={{ backgroundColor: preset.theme.accent }}
            />
            <CardHeader>
              <CardTitle>Proposal template</CardTitle>
              <CardDescription>
                Switch category or template and the editor will refresh beside you with the matching layout and sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </span>
                <select
                  value={preset.category}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-cyan-500"
                  onChange={(event) => handleCategoryChange(event.target.value)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Template
                </span>
                <select
                  value={preset.slug}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-cyan-500"
                  onChange={(event) => handleTemplateChange(event.target.value)}
                >
                  {templateOptions.map((template) => (
                    <option key={template.slug} value={template.slug}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Current template</p>
                <p className="mt-1 text-slate-500">{preset.title}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Layout style</p>
                <p className="mt-1 capitalize text-slate-500">
                  {preset.theme.layout}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Template notes</p>
                <p className="mt-1 text-slate-500">{preset.description}</p>
              </div>
              {isSwitchingTemplate ? (
                <p className="text-xs font-medium" style={{ color: preset.theme.accent }}>
                  Updating editor and preview...
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposal details</CardTitle>
              <CardDescription>Draft metadata before sending.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Company client
                    </p>
                    <p className="text-xs text-slate-500">
                      All clients saved in this company workspace appear here.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    disabled={clientsQuery.isFetching}
                    onClick={() => clientsQuery.refetch()}
                  >
                    {clientsQuery.isFetching ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                <select
                  value={clientId}
                  disabled={
                    clientsQuery.isLoading ||
                    clientsQuery.isError ||
                    clientOptions.length === 0
                  }
                  className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  onFocus={() => clientsQuery.refetch()}
                  onChange={(event) => setClientId(event.target.value)}
                >
                  <option value="">
                    {clientsQuery.isLoading
                      ? "Loading company clients..."
                      : clientOptions.length
                        ? "Select company client"
                        : "No company clients found"}
                  </option>
                  {clientOptions.map((client) => (
                    <option key={client.value} value={client.value}>
                      {client.label}
                    </option>
                  ))}
                </select>
                {clientsQuery.isError ? (
                  <p className="text-xs font-medium text-red-700">
                    Could not load company clients. Refresh or sign in again.
                  </p>
                ) : null}
                {!clientsQuery.isLoading && !clientsQuery.isError && clientOptions.length === 0 ? (
                  <p className="text-xs text-amber-700">
                    This company does not have clients yet. Add the full client
                    details in the right-side panel without leaving this proposal.
                  </p>
                ) : null}
                {selectedClient ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    <p className="font-semibold">
                      Selected: {selectedClient.companyName ?? selectedClient.name}
                    </p>
                    <p className="mt-1">
                      {selectedClient.email ?? "No email saved"}{" "}
                      {selectedClient.companyName && selectedClient.name
                        ? `- ${selectedClient.name}`
                        : ""}
                    </p>
                  </div>
                ) : null}
              </div>
              {!clientId ? (
                <p className="text-xs text-amber-700">
                  Select or create a client before saving.
                </p>
              ) : null}
              {!signatureReady ? (
                <p className="text-xs text-rose-700">
                  Complete the signature section before sending this proposal.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New client</CardTitle>
              <CardDescription>
                Add the full client profile without leaving the proposal editor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={newClientName}
                placeholder="Contact name"
                onChange={(event) => setNewClientName(event.target.value)}
              />
              <Input
                value={newClientCompanyName}
                placeholder="Company name"
                onChange={(event) => setNewClientCompanyName(event.target.value)}
              />
              <Input
                value={newClientEmail}
                type="email"
                placeholder="Email optional"
                onChange={(event) => setNewClientEmail(event.target.value)}
              />
              <div className="flex gap-2">
                <select
                  value={newClientCountryCode}
                  onChange={(event) => {
                    const nextCountry =
                      COUNTRIES.find(
                        (country) => country.dialCode === event.target.value,
                      ) ?? COUNTRIES[0];
                    const maxDigits = NSN_LENGTHS[nextCountry.code] ?? 10;

                    setNewClientCountryCode(event.target.value);
                    setNewClientPhone((current) => current.slice(0, maxDigits));
                  }}
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.dialCode}>
                      {country.code} {country.dialCode}
                    </option>
                  ))}
                </select>
                <Input
                  value={newClientPhone}
                  placeholder="Phone"
                  maxLength={newClientMaxDigits}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    setNewClientPhone(digits.slice(0, newClientMaxDigits));
                  }}
                />
              </div>
              <Input
                value={newClientGstin}
                placeholder="GSTIN / Tax ID"
                onChange={(event) =>
                  setNewClientGstin(event.target.value.toUpperCase())
                }
              />
              <Input
                value={newClientState}
                placeholder="State / region"
                onChange={(event) =>
                  setNewClientState(event.target.value.toUpperCase())
                }
              />
              <textarea
                value={newClientAddress}
                placeholder="Billing address"
                rows={4}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                onChange={(event) => setNewClientAddress(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!newClientName.trim() || createClient.isPending}
                onClick={() => createClient.mutate()}
              >
                Add client
              </Button>
              {createClient.isError ? (
                <p className="text-sm text-red-600">
                  Could not create client. Check your API connection.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blocks</CardTitle>
              <CardDescription>
                Add sections that fit this template.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {preset.recommendedBlocks.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="justify-start"
                  onClick={() => addBlock(type)}
                >
                  Add {blockLabels[type]}
                </Button>
              ))}
              <details className="mt-2 rounded-md border border-slate-200 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                  More sections
                </summary>
                <div className="mt-3 grid gap-2">
                  {blockTypes
                    .filter((type) => !preset.recommendedBlocks.includes(type))
                    .map((type) => (
                      <Button
                        key={type}
                        variant="ghost"
                        className="justify-start"
                        onClick={() => addBlock(type)}
                      >
                        Add {blockLabels[type]}
                      </Button>
                    ))}
                </div>
              </details>
            </CardContent>
          </Card>
        </aside>

        <section>
          <ProposalEditor blocks={orderedBlocks} onChange={setBlocks} />
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <PreviewPanel
                blocks={orderedBlocks}
                accent={preset.theme.accent}
                soft={preset.theme.soft}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function calculateProposalTotal(blocks: ProposalBlock[]): number {
  const pricingBlocks = blocks.filter((block) => block.type === "pricing");

  return pricingBlocks.reduce((total, block) => {
    const items = block.content.items;

    if (!Array.isArray(items)) {
      return total;
    }

    return (
      total +
      items.reduce((sum, item) => {
        const record = item as Record<string, unknown>;
        const quantity = Number(record.quantity ?? 0);
        const unitPrice = Number(record.unitPrice ?? 0);
        const gstRate = Number(record.gstRate ?? 0);
        const taxRate = gstRate > 1 ? gstRate / 100 : gstRate;

        return sum + quantity * unitPrice * (1 + taxRate);
      }, 0)
    );
  }, 0);
}
