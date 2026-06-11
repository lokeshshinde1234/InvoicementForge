"use client";

import { use } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/RecentDocuments";
import { api } from "@/lib/api";
import { currencyFormatter, normalizeAmount } from "@/lib/dashboard";

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
  isPasswordCreated?: boolean;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number | string;
};

type Proposal = {
  id: string;
  title: string;
  status: string;
  totalAmount: number | string;
  clientId: string;
};

type BusinessSettings = {
  baseCurrency: string;
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <QueryClientProvider client={queryClient}>
      <ClientDetailRoute clientId={id} />
    </QueryClientProvider>
  );
}
function ClientDetailRoute({ clientId }: { clientId: string }) {
  const clientQuery = useQuery({
    queryKey: ["client-detail", clientId],
    queryFn: async () => {
      const [client, invoices, proposals, businessSettings] = await Promise.all([
        api.get<Client>(`/clients/${clientId}`),
        api.get<Invoice[]>(`/invoices?clientId=${clientId}`),
        api.get<Proposal[]>("/proposals"),
        api.get<BusinessSettings>("/business-settings"),
      ]);

      return {
        client: client.data,
        invoices: invoices.data,
        proposals: proposals.data.filter((proposal) => proposal.clientId === clientId),
        businessSettings: businessSettings.data,
      };
    },
  });

  const formatMoney = currencyFormatter(
    clientQuery.data?.businessSettings.baseCurrency ?? "INR",
  );

  return (
    <DashboardShell active="Clients">
      {clientQuery.isLoading ? (
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
      ) : clientQuery.isError || !clientQuery.data ? (
        <EmptyState
          title="Client unavailable"
          description="We could not load this client profile right now."
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Client profile
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  {clientQuery.data.client.companyName ?? clientQuery.data.client.name}
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Contact details, billing identity, and recent commercial activity for this client.
                </p>
              </div>
              <Link
                href={`/clients/${clientQuery.data.client.id}/edit`}
                className="inline-flex h-10 items-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Edit client
              </Link>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Contact name" value={clientQuery.data.client.name} />
            <InfoCard label="Email" value={clientQuery.data.client.email || "Not added"} />
            <InfoCard
              label="Password status"
              value={
                clientQuery.data.client.isPasswordCreated
                  ? "Password Created"
                  : "Password Not Created"
              }
            />
            <InfoCard label="Phone" value={clientQuery.data.client.phone || "Not added"} />
            <InfoCard label="GSTIN" value={clientQuery.data.client.gstin || "Not added"} />
            <InfoCard label="Company currency" value={clientQuery.data.businessSettings.baseCurrency} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Invoices</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    GST-ready invoices connected to this client.
                  </p>
                </div>
                <Link href="/invoices/new" className="text-sm font-semibold text-teal-700">
                  New invoice
                </Link>
              </div>
              {clientQuery.data.invoices.length === 0 ? (
                <EmptyState
                  className="mt-5"
                  title="No invoices created yet"
                  description="Create an invoice for this client to populate this section."
                />
              ) : (
                <div className="mt-5 space-y-3">
                  {clientQuery.data.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatMoney.format(normalizeAmount(invoice.total))}
                        </p>
                      </div>
                      <StatusBadge status={invoice.status} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Proposals</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Recent proposals prepared for this client.
                  </p>
                </div>
                <Link href="/proposals/new" className="text-sm font-semibold text-teal-700">
                  New proposal
                </Link>
              </div>
              {clientQuery.data.proposals.length === 0 ? (
                <EmptyState
                  className="mt-5"
                  title="No proposals created yet"
                  description="Create a proposal for this client to populate this section."
                />
              ) : (
                <div className="mt-5 space-y-3">
                  {clientQuery.data.proposals.map((proposal) => (
                    <Link
                      key={proposal.id}
                      href={`/proposals/${proposal.id}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {proposal.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatMoney.format(normalizeAmount(proposal.totalAmount))}
                        </p>
                      </div>
                      <StatusBadge status={proposal.status} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}
