"use client";

import { useEffect, useMemo, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentDocuments, StatusBadge } from "@/components/dashboard/RecentDocuments";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-storage";
import {
  currencyFormatter,
  formatRelativeDate,
  normalizeAmount,
  type DashboardBusinessSettings,
  type DashboardClient,
  type DashboardDocument,
  type DashboardIntegration,
  type DashboardInvoice,
  type DashboardOverview,
  type DashboardProposal,
} from "@/lib/dashboard";

const queryClient = new QueryClient();

type SubscriptionOverview = {
  plan: string;
  billingCycle: string;
  subscriptionStatus: string;
  trialDaysLeft: number;
  isTrialActive: boolean;
  requiresPayment: boolean;
  reason: string | null;
  monthlySendLimit: number;
  monthlyTemplateLimit: number;
  sendsUsedThisMonth: number;
  templatesUsed: number;
};

type DashboardOverviewWithSubscription = DashboardOverview & {
  subscriptionStatus: SubscriptionOverview;
};

const defaultBusinessSettings: DashboardBusinessSettings = {
  legalName: null,
  gstin: null,
  sellerState: null,
  baseCurrency: "INR",
  countryCode: "IN",
  supportedCurrencies: ["INR"],
};

const defaultSubscriptionStatus: SubscriptionOverview = {
  plan: "STARTER",
  billingCycle: "MONTHLY",
  subscriptionStatus: "TRIALING",
  trialDaysLeft: 0,
  isTrialActive: false,
  requiresPayment: false,
  reason: null,
  monthlySendLimit: 0,
  monthlyTemplateLimit: 0,
  sendsUsedThisMonth: 0,
  templatesUsed: 0,
};

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardOverviewPage />
    </QueryClientProvider>
  );
}

function DashboardOverviewPage() {
  const router = useRouter();
  const tokenPayload = useMemo(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const token = getAuthToken();
    if (!token) {
      return {};
    }

    try {
      const payload = token.split(".")[1];
      return JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
        email?: string;
        role?: string;
      };
    } catch {
      return {};
    }
  }, []);
  const isMember = tokenPayload.role === "MEMBER";

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-overview"],
    enabled: !isMember,
    queryFn: async (): Promise<DashboardOverviewWithSubscription> => {
      const [
        clients,
        invoices,
        proposals,
        documents,
        gstReports,
        integrations,
        businessSettings,
        subscriptionStatus,
      ] = await Promise.all([
        safeApiData("/clients", [] as DashboardClient[]),
        safeApiData("/invoices", [] as DashboardInvoice[]),
        safeApiData("/proposals", [] as DashboardProposal[]),
        safeApiData("/documents", [] as DashboardDocument[]),
        safeApiData("/gst/reports", [] as Array<{ id: string; type: string; period: string; createdAt: string }>),
        safeApiData("/integrations", [] as DashboardIntegration[]),
        safeApiData("/business-settings", defaultBusinessSettings),
        safeApiData("/subscription/status", defaultSubscriptionStatus),
      ]);

      return {
        clients,
        invoices,
        proposals,
        documents,
        gstReports,
        integrations,
        businessSettings,
        subscriptionStatus,
      };
    },
  });

  useEffect(() => {
    if (isMember) {
      router.replace("/dashboard/team/my-tasks");
    }
  }, [isMember, router]);

  if (isMember) {
    return (
      <DashboardShell active="My Tasks">
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
      </DashboardShell>
    );
  }

  if (dashboardQuery.isLoading) {
    return (
      <DashboardShell active="Dashboard">
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-[24px] bg-white shadow-sm" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-36 rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
            <div className="h-[420px] rounded-2xl bg-white shadow-sm" />
            <div className="h-[420px] rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <DashboardShell active="Dashboard">
        <EmptyState
          title="Dashboard unavailable"
          description="We could not load your workspace overview right now. Please retry the request."
          actionLabel="Retry"
          onAction={() => dashboardQuery.refetch()}
        />
      </DashboardShell>
    );
  }

  const {
    clients,
    invoices,
    proposals,
    documents,
    gstReports,
    integrations,
    businessSettings,
    subscriptionStatus,
  } = dashboardQuery.data;

  const clientMap = new Map(
    clients.map((client) => [
      client.id,
      client.companyName ?? client.name ?? client.email ?? "Unnamed client",
    ]),
  );
  const currency = businessSettings.baseCurrency || "INR";
  const formatMoney = currencyFormatter(currency);

  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID");
  const pendingInvoices = invoices.filter((invoice) =>
    ["SENT", "VIEWED", "DRAFT"].includes(invoice.status),
  );
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE");
  const totalInvoiceValue = invoices.reduce(
    (sum, invoice) => sum + normalizeAmount(invoice.total),
    0,
  );
  const totalPaidValue = paidInvoices.reduce(
    (sum, invoice) => sum + normalizeAmount(invoice.total),
    0,
  );

  const recentDocuments = [
    ...invoices.map((invoice) => ({
      id: invoice.id,
      title: invoice.invoiceNumber,
      client: clientMap.get(invoice.clientId) ?? "Unknown client",
      type: "Invoice",
      status: invoice.status,
      amount: formatMoney.format(normalizeAmount(invoice.total)),
      href: `/invoices/${invoice.id}`,
      pdfHref: `/invoices/${invoice.id}/pdf`,
      createdAt: invoice.createdAt,
    })),
    ...proposals.map((proposal) => ({
      id: proposal.id,
      title: proposal.title,
      client: clientMap.get(proposal.clientId) ?? "Unknown client",
      type: "Proposal",
      status: proposal.status,
      amount: formatMoney.format(normalizeAmount(proposal.totalAmount)),
      href: `/proposals/${proposal.id}`,
      pdfHref: `/proposals/${proposal.id}/pdf`,
      createdAt: proposal.createdAt,
    })),
    ...documents.map((document) => ({
      id: document.id,
      title: document.title,
      client: document.clientId ? clientMap.get(document.clientId) ?? "Unknown client" : "Internal",
      type: document.type.replace(/_/g, " "),
      status: document.status,
      amount: formatMoney.format(normalizeAmount(document.amount)),
      href: "/dashboard/documents",
      createdAt: document.createdAt,
    })),
  ]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6);

  const recentClients = [...clients]
    .sort(
      (a, b) =>
        +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0),
    )
    .slice(0, 5);

  const activityItems = [
    ...invoices.slice(0, 4).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      title: `Invoice ${invoice.invoiceNumber}`,
      detail: `${invoice.status} invoice for ${
        clientMap.get(invoice.clientId) ?? "a client"
      }.`,
      timestamp: formatRelativeDate(invoice.createdAt),
      tone:
        invoice.status === "PAID"
          ? ("success" as const)
          : invoice.status === "OVERDUE"
            ? ("warning" as const)
            : ("default" as const),
    })),
    ...proposals.slice(0, 4).map((proposal) => ({
      id: `proposal-${proposal.id}`,
      title: proposal.title,
      detail: `${proposal.status} proposal prepared for ${
        clientMap.get(proposal.clientId) ?? "a client"
      }.`,
      timestamp: formatRelativeDate(proposal.createdAt),
      tone:
        proposal.status === "SIGNED"
          ? ("success" as const)
          : proposal.status === "VIEWED"
            ? ("warning" as const)
            : ("default" as const),
    })),
  ]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(0, 6);

  const monthlyPoints = buildMonthlyPoints(invoices, proposals);
  const integrationCount = integrations.filter(
    (integration) => integration.status !== "NOT_CONFIGURED",
  ).length;
  const isAdmin =
    tokenPayload.role === "OWNER" || tokenPayload.role === "ADMIN";

  return (
    <DashboardShell active="Dashboard">
      <div className="space-y-6">
        <SubscriptionNoticePopup status={subscriptionStatus} />

        <DashboardHeader
          eyebrow={isAdmin ? "Admin dashboard" : "User dashboard"}
          title={
            isAdmin
              ? "Run your workspace with confidence."
              : "Keep invoices, proposals, and clients moving."
          }
          description={
            isAdmin
              ? "Track document flow, compliance readiness, integrations, and business activity from one high-signal dashboard."
              : "See recent business activity, stay on top of pending work, and launch key actions without digging through menus."
          }
          workspaceName={businessSettings.legalName}
          quickSummary={[
            { label: "Invoices", value: String(invoices.length) },
            { label: "Proposals", value: String(proposals.length) },
            { label: "Clients", value: String(clients.length) },
            { label: "Integrations", value: String(integrationCount) },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total invoices"
            value={String(invoices.length)}
            hint={`${formatMoney.format(totalInvoiceValue)} tracked across all invoices.`}
            href="/invoices?tab=all"
          />
          <StatCard
            label="Paid invoices"
            value={String(paidInvoices.length)}
            hint={`${formatMoney.format(totalPaidValue)} collected so far.`}
            tone="success"
            href="/invoices?tab=paid"
          />
          <StatCard
            label="Pending invoices"
            value={String(pendingInvoices.length)}
            hint="Waiting for review, send, or payment."
            tone="warning"
            href="/invoices?tab=pending"
          />
          <StatCard
            label="Overdue invoices"
            value={String(overdueInvoices.length)}
            hint="Needs follow-up with your customer."
            tone={overdueInvoices.length ? "danger" : "default"}
            href="/invoices?tab=overdue"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <RecentDocuments rows={recentDocuments} />
          <RevenueChart
            title="Revenue overview"
            description="Recent invoice and proposal values by month."
            points={monthlyPoints}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <QuickActions
            actions={[
              {
                label: "Create invoice",
                href: "/invoices/new",
                description: "Start a GST-ready invoice for a client.",
              },
              {
                label: "Open clients",
                href: "/clients",
                description: "Review company clients without leaving the dashboard workspace.",
              },
              {
                label: "Upload document",
                href: "/dashboard/documents",
                description: "Manage invoices, quotes, and shared business documents.",
              },
              {
                label: "View reports",
                href: "/dashboard/reports",
                description: "Review GST reports, compliance modules, and summary health.",
              },
            ]}
          />
          <ActivityTimeline items={activityItems} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DashboardTable
            title="Recent clients"
            description="The latest customer records in your workspace."
            rows={recentClients}
            emptyTitle="No clients added yet"
            emptyDescription="Add your first client to make invoices and proposals reusable."
            action={
              <Link
                href="/clients"
                className="text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Open clients
              </Link>
            }
            columns={[
              {
                key: "company",
                header: "Company",
                render: (client) => (
                  <div>
                    <p className="font-semibold text-slate-900">
                      {client.companyName ?? client.name}
                    </p>
                    <p className="text-xs text-slate-500">{client.name}</p>
                  </div>
                ),
              },
              {
                key: "email",
                header: "Email",
                render: (client) => (
                  <span className="text-slate-600">
                    {client.email ?? "No email added"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                align: "right",
                render: (client) => (
                  <Link
                    href={`/clients/${client.id}/edit`}
                    className="inline-flex h-9 items-center rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                  >
                    Edit
                  </Link>
                ),
              },
            ]}
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Payment summary</h2>
                <p className="mt-1 text-sm text-slate-500">
                  High-level billing and compliance posture.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <SummaryRow
                label="Collected"
                value={formatMoney.format(totalPaidValue)}
              />
              <SummaryRow
                label="Awaiting payment"
                value={formatMoney.format(totalInvoiceValue - totalPaidValue)}
              />
              <SummaryRow
                label="GST reports generated"
                value={String(gstReports.length)}
              />
              <SummaryRow
                label="Configured integrations"
                value={String(integrationCount)}
              />
            </div>
          </section>
        </div>

        {isAdmin ? (
          <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <DashboardTable
              title="Admin control center"
              description="Workspace administration and platform readiness details for owner/admin roles."
              rows={[
                {
                  label: "Workspace company",
                  value: businessSettings.legalName || "Not configured",
                },
                {
                  label: "GSTIN",
                  value: businessSettings.gstin || "Not configured",
                },
                {
                  label: "Seller state",
                  value: businessSettings.sellerState || "Not configured",
                },
                {
                  label: "Supported currencies",
                  value:
                    businessSettings.supportedCurrencies?.join(", ") ||
                    "Not configured",
                },
              ]}
              emptyTitle="No admin details available"
              emptyDescription="Configure your workspace settings to populate this area."
              columns={[
                {
                  key: "label",
                  header: "Setting",
                  render: (row) => (
                    <span className="font-medium text-slate-900">
                      {row.label}
                    </span>
                  ),
                },
                {
                  key: "value",
                  header: "Value",
                  render: (row) => <span className="text-slate-600">{row.value}</span>,
                },
              ]}
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">Platform-level metrics</h2>
              <p className="mt-1 text-sm text-slate-500">
                This deployment does not yet expose global users, companies, or subscription APIs.
              </p>
              <EmptyState
                className="mt-5"
                title="No platform metrics available yet"
                description="When backend platform analytics endpoints are added, this admin section can show total users, total companies, subscriptions, and system-wide revenue."
                actionLabel="Open settings"
                onAction={() => router.push("/dashboard/settings")}
              />
            </section>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

async function safeApiData<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await api.get<T>(path);
    return response.data;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }

    return fallback;
  }
}

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  );
}

function SubscriptionNoticePopup({ status }: { status: SubscriptionOverview }) {
  const notice = useMemo(() => buildSubscriptionNotice(status), [status]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!notice) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const timeout = window.setTimeout(() => {
      setIsVisible(false);
    }, 10000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!notice || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-live="polite"
      role="status"
      className={`fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-md rounded-lg border p-4 shadow-xl ${
        notice.tone === "danger"
          ? "border-rose-200 bg-rose-50"
          : notice.tone === "warning"
            ? "border-amber-200 bg-amber-50"
            : "border-teal-200 bg-teal-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`text-sm font-black ${
              notice.tone === "danger"
                ? "text-rose-900"
                : notice.tone === "warning"
                  ? "text-amber-900"
                  : "text-teal-900"
            }`}
          >
            {notice.title}
          </p>
          <p
            className={`mt-1 text-sm ${
              notice.tone === "danger"
                ? "text-rose-800"
                : notice.tone === "warning"
                  ? "text-amber-800"
                  : "text-teal-800"
            }`}
          >
            {notice.description}
          </p>
          <Link
            href="/dashboard/pricing"
            className={`mt-3 inline-flex rounded-lg px-4 py-2 text-sm font-black text-white ${
              notice.tone === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : notice.tone === "warning"
                  ? "bg-slate-950 hover:bg-slate-800"
                  : "bg-teal-700 hover:bg-teal-800"
            }`}
          >
            {notice.actionLabel}
          </Link>
        </div>
        <button
          type="button"
          aria-label="Dismiss subscription notice"
          onClick={() => setIsVisible(false)}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-lg font-black leading-none ${
            notice.tone === "danger"
              ? "text-rose-700 hover:bg-rose-100"
              : notice.tone === "warning"
                ? "text-amber-700 hover:bg-amber-100"
                : "text-teal-700 hover:bg-teal-100"
          }`}
        >
          x
        </button>
      </div>
    </aside>
  );
}

function buildSubscriptionNotice(status: SubscriptionOverview):
  | {
      title: string;
      description: string;
      actionLabel: string;
      tone: "danger" | "warning" | "success";
    }
  | null {
  const isBlocked = status.requiresPayment;
  const isTrialing = status.isTrialActive && status.subscriptionStatus === "TRIALING";
  const planLabel = status.plan.replace(/_/g, " ");

  if (!isBlocked && !isTrialing) {
    return null;
  }

  if (isBlocked) {
    return {
      title:
        status.subscriptionStatus === "ACTIVE"
          ? "Plan limit reached"
          : "Subscription required to continue",
      description:
        status.reason ??
        `${status.sendsUsedThisMonth}/${status.monthlySendLimit} sends used and ${status.templatesUsed}/${status.monthlyTemplateLimit} templates used.`,
      actionLabel: "Choose plan",
      tone: "danger",
    };
  }

  return {
    title:
      status.trialDaysLeft > 0
        ? `${status.trialDaysLeft} days left in your ${planLabel.toLowerCase()} trial`
        : "Your trial ends today",
    description:
      status.reason ??
      `${status.sendsUsedThisMonth}/${status.monthlySendLimit} sends used this month.`,
    actionLabel: status.trialDaysLeft > 7 ? "View plans" : "Upgrade now",
    tone: status.trialDaysLeft > 7 ? "success" : "warning",
  };
}

function buildMonthlyPoints(
  invoices: DashboardInvoice[],
  proposals: DashboardProposal[],
) {
  const monthMap = new Map<string, number>();
  const items = [
    ...invoices.map((invoice) => ({
      date: invoice.createdAt,
      amount: normalizeAmount(invoice.total),
    })),
    ...proposals.map((proposal) => ({
      date: proposal.createdAt,
      amount: normalizeAmount(proposal.totalAmount),
    })),
  ];

  for (const item of items) {
    const date = new Date(item.date);
    const key = `${date.toLocaleString("en-US", { month: "short" })}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + item.amount);
  }

  return Array.from(monthMap.entries())
    .slice(-6)
    .map(([label, value]) => ({ label, value }));
}
