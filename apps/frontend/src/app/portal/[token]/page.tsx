"use client";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { BlockForm } from "@/components/editor/SortableBlock";
import type { ProposalBlock } from "@/components/editor/types";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { API_BASE_URL } from "@/lib/config";

type PortalProposal = {
  id: string;
  title: string;
  status: string;
  blocks: ProposalBlock[];
  signatureData?: string | null;
  signedAt?: string | null;
  signatureIp?: string | null;
  signatureMethod?: string | null;
  auditTrail?: Array<{
    id: string;
    event: string;
    actor: string;
    at: string;
    ip?: string | null;
  }>;
};

const queryClient = new QueryClient();

export default function PortalProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  return (
    <QueryClientProvider client={queryClient}>
      <PortalProposal token={token} />
    </QueryClientProvider>
  );
}

function PortalProposal({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const isCompanyPreview = searchParams.get("preview") === "company";
  const proposalQuery = useQuery({
    queryKey: ["portal-proposal", token],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/portal/${token}`);
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Proposal not found.");
      }

      return body as PortalProposal;
    },
  });

  const signProposal = useMutation({
    mutationFn: async ({
      signatureData,
    }: {
      signatureData: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/portal/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData, signatureMethod: "DRAWN" }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Could not submit signature.");
      }
    },
    onSuccess: () => {
      void proposalQuery.refetch();
    },
  });

  if (proposalQuery.isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        Loading proposal...
      </main>
    );
  }

  if (!proposalQuery.data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        Proposal not found.
      </main>
    );
  }

  const proposal = proposalQuery.data;
  const isSigned =
    proposal.status === "SIGNED" || proposal.status === "CONVERTED";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium uppercase text-cyan-700">
            InvoiceForge proposal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {proposal.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Status: {proposal.status}
          </p>
        </div>

        <div className="space-y-5">
          {proposal.blocks
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((block) => (
              <BlockForm
                key={block.id}
                block={block}
                readOnly
                signatureData={
                  block.type === "signature" ? proposal.signatureData : null
                }
                onChange={() => undefined}
              />
            ))}
        </div>

        {!isCompanyPreview ? (
          <section className="mt-6">
            {isSigned ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                <p className="font-semibold">This proposal has been signed.</p>
                {proposal.signatureData ? (
                  <div className="mt-4 rounded-md border border-emerald-200 bg-white p-4">
                    <img
                      src={proposal.signatureData}
                      alt="Saved client signature"
                      className="max-h-28 w-auto object-contain"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <SignaturePad
                  disabled={signProposal.isPending}
                  onSign={(signatureData) =>
                    signProposal.mutateAsync({ signatureData })
                  }
                />
              </>
            )}
          </section>
        ) : isSigned ? (
          <section className="mt-6">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <p className="font-semibold">This proposal has been signed.</p>
              {proposal.signatureData ? (
                <div className="mt-4 rounded-md border border-emerald-200 bg-white p-4">
                  <img
                    src={proposal.signatureData}
                    alt="Saved client signature"
                    className="max-h-28 w-auto object-contain"
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold">E-signature audit</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Evidence label="Method" value={proposal.signatureMethod ?? "Not signed"} />
            <Evidence
              label="Timestamp"
              value={proposal.signedAt ? new Date(proposal.signedAt).toLocaleString() : "Not signed"}
            />
            <Evidence label="Source" value={proposal.signatureIp ?? "Not captured"} />
          </div>
          {proposal.auditTrail?.length ? (
            <div className="mt-4 space-y-2">
              {proposal.auditTrail.slice().reverse().map((entry) => (
                <div key={entry.id} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">{entry.event.replace(/_/g, " ")}</p>
                  <p className="mt-1">{entry.actor} · {new Date(entry.at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Evidence({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
