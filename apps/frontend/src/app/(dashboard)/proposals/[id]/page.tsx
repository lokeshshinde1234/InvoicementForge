"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProposalEditor } from "@/components/editor/ProposalEditor";
import { BlockForm } from "@/components/editor/SortableBlock";
import type { ProposalBlock } from "@/components/editor/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/gst";
import { downloadAuthenticatedPdf } from "@/lib/pdf-download";
import {
  CompanyBrandHeader,
  useCompanyBranding,
} from "@/components/branding/CompanyBranding";

type ProposalResponse = {
  id: string;
  title: string;
  status: string;
  blocks: ProposalBlock[];
  totalAmount: number;
  portalToken: string;
  createdAt: string;
  notes?: string | null;
  terms?: string | null;
  signatureData?: string | null;
  signedAt?: string | null;
  signatureIp?: string | null;
  signatureMethod?: string | null;
  aadhaarEsignStatus?: string | null;
  aadhaarEsignReference?: string | null;
  aadhaarEsignRequestedAt?: string | null;
  aadhaarEsignCompletedAt?: string | null;
  approvalStatus?: "pending" | "approved" | "rejected";
  aadhaarDocumentAttached?: boolean;
  aadhaarAttachmentNotice?: string | null;
  approvedByClientId?: string | null;
  approvedAt?: string | null;
  auditTrail?: Array<{
    id: string;
    event: string;
    actor: string;
    at: string;
    ip?: string | null;
    metadata?: Record<string, unknown>;
  }>;
};

const queryClient = new QueryClient();

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <QueryClientProvider client={queryClient}>
      <ProposalDetail id={id} />
    </QueryClientProvider>
  );
}

function ProposalDetail({ id }: { id: string }) {
  const { branding } = useCompanyBranding();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldStartEditing = searchParams.get("edit") === "1";
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [blocksDraft, setBlocksDraft] = useState<ProposalBlock[]>([]);

  const proposalQuery = useQuery({
    queryKey: ["proposal", id],
    queryFn: async () => {
      const response = await api.get<ProposalResponse>(
        `/api/company/proposals/${id}`,
      );
      return response.data;
    },
  });

  useEffect(() => {
    if (!proposalQuery.data) {
      return;
    }

    setTitleDraft(proposalQuery.data.title);
    setBlocksDraft(sortBlocks(proposalQuery.data.blocks));
  }, [proposalQuery.data?.id]);

  useEffect(() => {
    if (proposalQuery.data && shouldStartEditing) {
      setIsEditing(true);
    }
  }, [proposalQuery.data, shouldStartEditing]);

  const orderedBlocks = useMemo(
    () => sortBlocks(isEditing ? blocksDraft : (proposalQuery.data?.blocks ?? [])),
    [blocksDraft, isEditing, proposalQuery.data?.blocks],
  );

  const saveProposal = useMutation({
    mutationFn: async () => {
      const currentStatus = proposalQuery.data?.status;
      const response = await api.patch<ProposalResponse>(`/proposals/${id}`, {
        title: titleDraft.trim() || proposalQuery.data?.title || "Untitled proposal",
        blocks: orderedBlocks,
        totalAmount: calculateProposalTotal(orderedBlocks),
        status: currentStatus === "CHANGES_REQUESTED" ? "SENT" : currentStatus,
      });

      return response.data;
    },
    onSuccess: (proposal) => {
      queryClient.setQueryData(["proposal", id], proposal);
      setIsEditing(false);
      router.replace(`/proposals/${id}`);
    },
  });

  const sendProposal = useMutation({
    mutationFn: async () => {
      const response = await api.patch<ProposalResponse>(`/proposals/${id}`, {
        title: proposalQuery.data?.title ?? "Untitled proposal",
        blocks: sortBlocks(proposalQuery.data?.blocks ?? []),
        totalAmount: Number(proposalQuery.data?.totalAmount ?? 0),
        status: "SENT",
      });

      return response.data;
    },
    onSuccess: (proposal) => {
      queryClient.setQueryData(["proposal", id], proposal);
    },
  });

  const convertProposal = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ id: string }>(
        `/proposals/${id}/convert`,
      );
      return response.data;
    },
  });

  const downloadPdf = useMutation({
    mutationFn: () =>
      downloadAuthenticatedPdf(
        `/proposals/${id}/pdf`,
        `${proposalQuery.data?.title ?? "proposal"}.pdf`,
      ),
  });

  if (proposalQuery.isLoading) {
    return <PageState message="Loading proposal..." />;
  }

  if (proposalQuery.isError || !proposalQuery.data) {
    return <PageState message="Proposal not found or unavailable." />;
  }

  const proposal = proposalQuery.data;
  const hasChangeRequest = proposal.status === "CHANGES_REQUESTED";
  const clientChangeRequest = getClientChangeRequest(proposal.notes);
  const displayedTotal = isEditing
    ? calculateProposalTotal(orderedBlocks)
    : Number(proposal.totalAmount ?? 0);
  const signatureMeta = getSignatureMeta(proposal);
  const portalUrl =
    typeof window === "undefined"
      ? `/portal/${proposal.portalToken}`
      : `${window.location.origin}/portal/${proposal.portalToken}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <CompanyBrandHeader branding={branding} subtitle="Proposal document" />
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              {isEditing ? "Edit proposal" : "Proposal"}
            </p>
            {isEditing ? (
              <Input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                className="mt-2 h-12 max-w-2xl text-2xl font-semibold"
                aria-label="Proposal title"
              />
            ) : (
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {proposal.title}
              </h1>
            )}
            <p className="mt-2 text-sm text-slate-500">
              Status: {proposal.status} | Total: {formatCurrency(displayedTotal)}
            </p>
            {hasChangeRequest ? (
              <p className="mt-2 max-w-2xl text-sm font-medium text-rose-700">
                Client requested changes. Save revisions here and the updated
                proposal will appear in the client portal.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  disabled={saveProposal.isPending}
                  onClick={() => {
                    setIsEditing(false);
                    setTitleDraft(proposal.title);
                    setBlocksDraft(sortBlocks(proposal.blocks));
                    router.replace(`/proposals/${id}`);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={saveProposal.isPending || orderedBlocks.length === 0}
                  onClick={() => saveProposal.mutate()}
                >
                  {saveProposal.isPending ? "Saving..." : "Save changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit proposal</Button>
            )}
            {!isEditing && proposal.status === "DRAFT" ? (
              <Button
                disabled={sendProposal.isPending}
                onClick={() => sendProposal.mutate()}
              >
                {sendProposal.isPending ? "Sending..." : "Send to client"}
              </Button>
            ) : null}
            <Link
              href={`/portal/${proposal.portalToken}?preview=company`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm hover:border-teal-500"
            >
              Open portal
            </Link>
            <Button
              variant="outline"
              disabled={downloadPdf.isPending || isEditing}
              onClick={() => downloadPdf.mutate()}
            >
              {downloadPdf.isPending ? "Downloading..." : "Download PDF"}
            </Button>
            <Button
              disabled={convertProposal.isPending || isEditing}
              onClick={() => convertProposal.mutate()}
            >
              Convert to invoice
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="space-y-5">
          {isEditing ? (
            <ProposalEditor blocks={orderedBlocks} onChange={setBlocksDraft} />
          ) : (
            orderedBlocks.map((block) => (
              <BlockForm
                key={block.id}
                block={block}
                readOnly
                signatureData={
                  block.type === "signature" ? proposal.signatureData : null
                }
                signatureMeta={block.type === "signature" ? signatureMeta : null}
                onChange={() => undefined}
              />
            ))
          )}
          {saveProposal.isError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-sm text-red-700">
                Could not save proposal changes. Check the fields and try again.
              </CardContent>
            </Card>
          ) : null}
          {saveProposal.isSuccess && !isEditing ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6 text-sm font-medium text-emerald-800">
                Proposal changes saved. Clients will see the updated version in
                their portal.
              </CardContent>
            </Card>
          ) : null}
          {sendProposal.isSuccess ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6 text-sm font-medium text-emerald-800">
                Proposal sent to the client portal.
              </CardContent>
            </Card>
          ) : null}
          {sendProposal.isError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-sm text-red-700">
                Could not send this proposal. Make sure the proposal has a
                completed signature section before sending.
              </CardContent>
            </Card>
          ) : null}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {hasChangeRequest ? (
            <Card className="border-rose-200 bg-rose-50">
              <CardHeader>
                <CardTitle>Client change request</CardTitle>
                <CardDescription>
                  Review the client note, edit the proposal, then save the
                  revised version.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientChangeRequest.requestedAt ? (
                  <div className="mb-3 inline-flex rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700">
                    Requested on {clientChangeRequest.requestedAt}
                  </div>
                ) : null}
                <p className="whitespace-pre-line rounded-lg border border-rose-100 bg-white/70 p-3 text-sm leading-6 text-rose-900">
                  {clientChangeRequest.message ||
                    "The client requested changes without adding a note."}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Share link</CardTitle>
              <CardDescription>
                Send this secure client portal URL for review and signature.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="break-all rounded-md bg-slate-100 p-3 text-sm text-slate-700">
                {portalUrl}
              </div>
            </CardContent>
          </Card>

          {proposal.signatureData ? (
            <Card>
              <CardHeader>
                <CardTitle>Saved signature</CardTitle>
                <CardDescription>
                  {proposal.signedAt
                    ? `Signed on ${new Date(proposal.signedAt).toLocaleDateString()}`
                    : "Client signature captured"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <img
                    src={proposal.signatureData}
                    alt="Saved client signature"
                    className="max-h-28 w-auto object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Approval evidence</CardTitle>
              <CardDescription>
                Client acceptance status and private attachment state for this
                proposal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <EvidenceRow
                label="Approval status"
                value={formatApprovalStatus(proposal.approvalStatus)}
              />
              <EvidenceRow label="Proposal status" value={proposal.status} />
              <EvidenceRow label="Method" value={proposal.signatureMethod ?? "Not signed"} />
              <EvidenceRow
                label="Approved timestamp"
                value={
                  proposal.approvedAt
                    ? new Date(proposal.approvedAt).toLocaleString()
                    : "Not approved"
                }
              />
              <EvidenceRow label="Signature source" value={proposal.signatureIp ?? "Not captured"} />
              <EvidenceRow
                label="Aadhaar document"
                value={
                  proposal.aadhaarDocumentAttached
                    ? "Aadhaar document attached by client"
                    : "Not attached"
                }
              />
              {proposal.aadhaarDocumentAttached ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                  Aadhaar document attached by client. Preview and download are
                  hidden from company users.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit trail</CardTitle>
              <CardDescription>
                Generated automatically as clients accept, sign, or request
                changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proposal.auditTrail?.length ? (
                <div className="space-y-3">
                  {proposal.auditTrail.slice().reverse().map((entry) => (
                    <div key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="font-semibold">{entry.event.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.actor} · {new Date(entry.at).toLocaleString()}
                        {entry.ip ? ` · ${entry.ip}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No audit events recorded yet.</p>
              )}
            </CardContent>
          </Card>

          {convertProposal.isSuccess ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <CardTitle>Invoice created</CardTitle>
                <CardDescription>
                  The proposal was converted successfully.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  className="text-sm font-semibold text-emerald-800"
                  href={`/invoices/${convertProposal.data.id}`}
                >
                  Open invoice
                </Link>
              </CardContent>
            </Card>
          ) : null}

          {convertProposal.isError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-sm text-red-700">
                Could not convert this proposal. Make sure the proposal has
                pricing rows and a valid client.
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function sortBlocks(blocks: ProposalBlock[]): ProposalBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
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

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function formatApprovalStatus(status?: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending Approval";
}

function getSignatureMeta(proposal: ProposalResponse): string | null {
  if (!proposal.signatureData) {
    return null;
  }

  const action =
    proposal.status === "APPROVED"
      ? "Client approved"
      : proposal.status === "SIGNED" || proposal.status === "CONVERTED"
        ? "Client signed"
        : "Client signature captured";
  const signedAt = proposal.signedAt
    ? ` on ${new Date(proposal.signedAt).toLocaleString()}`
    : "";

  return `${action}${signedAt}`;
}

function getClientChangeRequest(notes?: string | null): {
  message: string;
  requestedAt: string;
} {
  if (!notes) {
    return { message: "", requestedAt: "" };
  }

  const entries = notes
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const latestChangeRequest =
    entries
      .slice()
      .reverse()
      .find((entry) => /Client requested changes:/i.test(entry)) ??
    entries.at(-1) ??
    "";
  const timestamp = latestChangeRequest.match(/^\[([^\]]+)\]/u)?.[1];

  return {
    message: latestChangeRequest
      .replace(/^\[[^\]]+\]\s*/u, "")
      .replace(/^Client requested changes:\s*/iu, "")
      .trim(),
    requestedAt: formatChangeRequestDate(timestamp),
  };
}

function formatChangeRequestDate(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function PageState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      {message}
    </main>
  );
}
