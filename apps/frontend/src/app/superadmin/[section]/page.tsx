"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CompanyLogo } from "@/components/branding/CompanyBranding";
import { api } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth-storage";

type JwtPayload = {
  email?: string;
  role?: string;
};

type PlatformRecord = Record<string, unknown>;
type DemoRequestStatus = "CONTACTED" | "QUALIFIED" | "WON" | "CLOSED";

type Row = {
  id: string;
  cells: ReactNode[];
  search: string;
};

type SectionConfig = {
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  columns: string[];
  deleteConfig?: {
    endpoint: (id: string) => string;
    label: (record: PlatformRecord) => string;
    blocked?: (record: PlatformRecord) => string | null;
  };
  map: (record: PlatformRecord, index: number) => Row;
};

type SectionKey =
  | "companies"
  | "clients"
  | "proposals"
  | "templates"
  | "invoices"
  | "payments"
  | "demo-requests"
  | "subscriptions"
  | "gst-compliance"
  | "e-invoicing"
  | "khata-ledger"
  | "accounting"
  | "documents"
  | "teams-users"
  | "reports-analytics"
  | "global-settings"
  | "audit-logs"
  | "system-health";

const sidebarItems = [
  ["Dashboard", "/superadmin"],
  ["Companies", "/superadmin/companies"],
  ["Clients", "/superadmin/clients"],
  ["Users", "/superadmin/teams-users"],
  ["Proposals", "/superadmin/proposals"],
  ["Templates", "/superadmin/templates"],
  ["Invoices", "/superadmin/invoices"],
  ["Payments", "/superadmin/payments"],
  ["Demo Requests", "/superadmin/demo-requests"],
  ["Subscriptions", "/superadmin/subscriptions"],
  ["GST", "/superadmin/gst-compliance"],
  ["E-Invoices", "/superadmin/e-invoicing"],
  ["Khata", "/superadmin/khata-ledger"],
  ["Documents", "/superadmin/documents"],
  ["Integrations", "/superadmin/accounting"],
  ["Audit Logs", "/superadmin/audit-logs"],
  ["Analytics", "/superadmin/reports-analytics"],
  ["Settings", "/superadmin/global-settings"],
  ["Health", "/superadmin/system-health"],
] as const;

const sections: Record<SectionKey, SectionConfig> = {
  companies: {
    title: "Companies",
    eyebrow: "Live company records",
    description: "Company identity, workspace status, logo, GST profile, and record counts.",
    endpoint: "/superadmin/tenants",
    columns: ["Company", "Workspace", "Plan", "Billing", "Subscription", "Days left", "Users", "Clients", "Invoices", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/tenants/${id}`,
      label: (record) => text(record.name) || "this company",
    },
    map: (record, index) => ({
      id: text(record.id) || `company-${index}`,
      search: searchable(record),
      cells: [
        <CompanyCell key="company" record={record} />,
        text(record.subdomain),
        text(record.plan),
        text(record.billingCycle),
        <StatusBadge key="subscription" label={text(record.subscriptionStatus)} />,
        subscriptionDaysLeft(record),
        numberText(record.userCount),
        numberText(record.clientCount),
        numberText(record.invoiceCount),
      ],
    }),
  },
  clients: {
    title: "Clients",
    eyebrow: "Cross-company CRM",
    description: "Client names, GST details, state, owning company, and created date without email or phone exposure.",
    endpoint: "/superadmin/clients",
    columns: ["Client", "Client company", "Company", "GSTIN", "State", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/clients/${id}`,
      label: (record) => text(record.name) || "this client",
    },
    map: (record, index) => ({
      id: text(record.id) || `client-${index}`,
      search: searchable(record, ["email", "phone"]),
      cells: [
        text(record.name),
        emptyText(record.companyName),
        <CompanyCell key="company" record={record} nameKey="tenantName" subdomainKey="tenantSubdomain" />,
        emptyText(record.gstin),
        emptyText(record.state),
        formatDate(record.createdAt),
      ],
    }),
  },
  proposals: {
    title: "Proposals",
    eyebrow: "Sales documents",
    description: "Proposal title, company, client, status, value, and lifecycle dates.",
    endpoint: "/superadmin/proposals",
    columns: ["Proposal", "Company", "Client", "Status", "Amount", "Signed", "Updated", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/proposals/${id}`,
      label: (record) => text(record.title) || "this proposal",
    },
    map: (record, index) => ({
      id: text(record.id) || `proposal-${index}`,
      search: searchable(record, ["portalToken"]),
      cells: [
        text(record.title),
        <CompanyCell key="company" record={record} nameKey="tenantName" subdomainKey="tenantSubdomain" />,
        emptyText(record.clientName),
        <StatusBadge key="status" label={text(record.status)} />,
        formatMoney(record.totalAmount),
        formatDate(record.signedAt),
        formatDate(record.updatedAt),
      ],
    }),
  },
  templates: {
    title: "Templates",
    eyebrow: "Global proposal templates",
    description: "Template catalog visibility with category, usage count, popularity, and tags.",
    endpoint: "/superadmin/templates",
    columns: ["Template", "Category", "Description", "Usage", "Popularity", "Tags"],
    map: (record, index) => ({
      id: text(record.slug) || `template-${index}`,
      search: searchable(record),
      cells: [
        text(record.title),
        text(record.category),
        text(record.description),
        numberText(record.usageCount),
        numberText(record.popularity),
        Array.isArray(record.tags) ? record.tags.join(", ") : "None",
      ],
    }),
  },
  invoices: {
    title: "Invoices",
    eyebrow: "Billing records",
    description: "Invoice number, company, client, status, value, tax, due date, and IRN presence.",
    endpoint: "/superadmin/invoices",
    columns: ["Invoice", "Company", "Client", "Status", "Amount", "Tax", "Due", "IRN", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/invoices/${id}`,
      label: (record) => text(record.invoiceNumber) || "this invoice",
    },
    map: (record, index) => ({
      id: text(record.id) || `invoice-${index}`,
      search: searchable(record),
      cells: [
        text(record.invoiceNumber),
        <CompanyCell key="company" record={record} nameKey="tenantName" subdomainKey="tenantSubdomain" />,
        emptyText(record.clientName),
        <StatusBadge key="status" label={text(record.status)} />,
        formatMoney(record.total),
        formatMoney(record.totalTax),
        formatDate(record.dueDate),
        text(record.irn) ? "Generated" : "Not generated",
      ],
    }),
  },
  payments: {
    title: "Payments",
    eyebrow: "Payment operations",
    description: "Payment status, amount, currency, invoice number, company, and date without gateway identifiers.",
    endpoint: "/superadmin/payments",
    columns: ["Invoice", "Company", "Status", "Amount", "Currency", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/payments/${id}`,
      label: (record) =>
        text(record.invoiceNumber)
          ? `payment for invoice ${text(record.invoiceNumber)}`
          : "this payment",
    },
    map: (record, index) => ({
      id: text(record.id) || `payment-${index}`,
      search: searchable(record, ["razorpayOrderId", "razorpayPaymentId"]),
      cells: [
        emptyText(record.invoiceNumber),
        <CompanyCell key="company" record={record} nameKey="tenantName" subdomainKey="tenantSubdomain" />,
        <StatusBadge key="status" label={text(record.status)} />,
        formatMoney(record.amount, text(record.currency) || "INR"),
        text(record.currency),
        formatDate(record.createdAt),
      ],
    }),
  },
  "demo-requests": {
    title: "Demo Requests",
    eyebrow: "Sales leads",
    description: "Book-demo submissions from the marketing page. Superadmin owns these platform leads.",
    endpoint: "/superadmin/demo-requests",
    columns: ["Name", "Company", "Email", "Phone", "Team size", "Status", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/demo-requests/${id}`,
      label: (record) => text(record.name) || "this demo request",
    },
    map: (record, index) => ({
      id: text(record.id) || `demo-${index}`,
      search: searchable(record),
      cells: [
        text(record.name),
        text(record.company),
        maskEmail(text(record.email)),
        emptyText(record.phone),
        emptyText(record.teamSize),
        <StatusBadge key="status" label={text(record.status)} />,
        formatDate(record.createdAt),
      ],
    }),
  },
  subscriptions: {
    title: "Subscriptions",
    eyebrow: "Plan payments",
    description: "Subscription checkout records by company, plan, billing cycle, amount, and status.",
    endpoint: "/superadmin/subscriptions",
    columns: ["Company", "Plan", "Billing", "Amount", "Currency", "Payment", "Subscription", "Days left", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/subscriptions/${id}`,
      label: (record) => `${text(record.plan) || "subscription"} record`,
    },
    map: (record, index) => liveCompanyRow(record, index, [
      text(record.plan),
      text(record.billingCycle),
      formatMoney(record.amount, text(record.currency) || "INR"),
      text(record.currency),
      <StatusBadge key="status" label={text(record.status)} />,
      <StatusBadge key="subscription" label={text(record.subscriptionStatus)} />,
      subscriptionDaysLeft(record),
      formatDate(record.createdAt),
    ]),
  },
  "gst-compliance": {
    title: "GST",
    eyebrow: "Compliance reports",
    description: "GST report type, period, status, company, row count, and generation date.",
    endpoint: "/superadmin/gst-reports",
    columns: ["Company", "Type", "Period", "Status", "Rows", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/gst-reports/${id}`,
      label: (record) => `${text(record.type) || "GST"} report`,
    },
    map: (record, index) => liveCompanyRow(record, index, [
      text(record.type),
      text(record.period),
      <StatusBadge key="status" label={text(record.status)} />,
      numberText(record.rowCount),
      formatDate(record.createdAt),
    ]),
  },
  "e-invoicing": {
    title: "E-Invoices",
    eyebrow: "IRN records",
    description: "E-invoice status by company, invoice number, IRN presence, and created date.",
    endpoint: "/superadmin/e-invoices",
    columns: ["Company", "Invoice", "Status", "IRN", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/e-invoices/${id}`,
      label: (record) => text(record.invoiceNumber) || "this e-invoice record",
    },
    map: (record, index) => liveCompanyRow(record, index, [
      emptyText(record.invoiceNumber),
      <StatusBadge key="status" label={text(record.status)} />,
      text(record.irn) ? "Generated" : "Not generated",
      formatDate(record.createdAt),
    ]),
  },
  "khata-ledger": {
    title: "Khata",
    eyebrow: "Credit ledger",
    description: "Company-wise ledger entries, client display name, amount, outstanding balance, and due date.",
    endpoint: "/superadmin/khata",
    columns: ["Company", "Type", "Client", "Amount", "Outstanding", "Due", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/khata/${id}`,
      label: (record) => `${text(record.type) || "khata"} entry`,
    },
    map: (record, index) => liveCompanyRow(record, index, [
      text(record.type),
      text(record.clientCompanyName) || text(record.clientName) || "Unknown client",
      formatMoney(record.amount),
      formatMoney(record.outstandingAmount),
      formatDate(record.dueDate),
      formatDate(record.createdAt),
    ]),
  },
  accounting: {
    title: "Integrations",
    eyebrow: "Accounting connections",
    description: "Company integration provider, status, last error summary, and last update.",
    endpoint: "/superadmin/integrations",
    columns: ["Company", "Provider", "Status", "Last error", "Updated", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/integrations/${id}`,
      label: (record) => `${text(record.provider) || "integration"} record`,
    },
    map: (record, index) => liveCompanyRow(record, index, [
      text(record.provider),
      <StatusBadge key="status" label={text(record.status)} />,
      emptyText(record.lastError),
      formatDate(record.updatedAt),
    ]),
  },
  documents: {
    title: "Documents",
    eyebrow: "Document workflow",
    description: "Document title, type, status, company, amount, currency, and created date.",
    endpoint: "/superadmin/documents",
    columns: ["Company", "Title", "Type", "Status", "Amount", "Currency", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/documents/${id}`,
      label: (record) => text(record.title) || "this document",
    },
    map: (record, index) => liveCompanyRow(record, index, [
      text(record.title),
      text(record.type),
      <StatusBadge key="status" label={text(record.status)} />,
      formatMoney(record.amount, text(record.currency) || "INR"),
      text(record.currency),
      formatDate(record.createdAt),
    ]),
  },
  "teams-users": {
    title: "Users",
    eyebrow: "Access overview",
    description: "User role, masked login, company, workspace, and active status.",
    endpoint: "/superadmin/users",
    columns: ["User", "Role", "Company", "Workspace", "Status", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/users/${id}`,
      label: (record) => maskEmail(text(record.email)),
      blocked: (record) => {
        const role = text(record.role);
        if (role === "OWNER") return "Owner users cannot be deleted from this page.";
        if (role === "SUPERADMIN") return "Superadmin users cannot be deleted from this page.";
        return null;
      },
    },
    map: (record, index) => ({
      id: text(record.id) || `user-${index}`,
      search: searchable(record, ["email"]),
      cells: [
        maskEmail(text(record.email)),
        text(record.role),
        <CompanyCell key="company" record={record} nameKey="tenantName" subdomainKey="tenantSubdomain" />,
        emptyText(record.tenantSubdomain),
        <StatusBadge key="status" label={record.isActive ? "ACTIVE" : "INACTIVE"} />,
      ],
    }),
  },
  "reports-analytics": {
    title: "Analytics",
    eyebrow: "Platform metrics",
    description: "Live platform totals grouped by operational category.",
    endpoint: "/superadmin/analytics",
    columns: ["Metric", "Category", "Current"],
    map: (record, index) => ({
      id: text(record.metric) || `analytics-${index}`,
      search: searchable(record),
      cells: [text(record.metric), text(record.category), formatMetricValue(record.current)],
    }),
  },
  "global-settings": {
    title: "Settings",
    eyebrow: "Platform configuration",
    description: "Non-secret readiness checks for platform level configuration.",
    endpoint: "/superadmin/global-settings",
    columns: ["Setting", "Scope", "Value", "Status"],
    map: (record, index) => ({
      id: text(record.setting) || `setting-${index}`,
      search: searchable(record),
      cells: [
        text(record.setting),
        text(record.scope),
        formatMetricValue(record.value),
        <StatusBadge key="status" label={text(record.status)} />,
      ],
    }),
  },
  "audit-logs": {
    title: "Audit Logs",
    eyebrow: "Security trail",
    description: "Recent platform actions by company, entity type, actor role, and time without private payload details.",
    endpoint: "/superadmin/audit-logs",
    columns: ["Company", "Entity", "Action", "Actor role", "Created", "Actions"],
    deleteConfig: {
      endpoint: (id) => `/superadmin/audit-logs/${id}`,
      label: (record) => `${text(record.action) || "audit"} log`,
    },
    map: (record, index) => liveCompanyRow(record, index, [
      text(record.entityType),
      text(record.action),
      emptyText(record.actorRole),
      formatDate(record.createdAt),
    ]),
  },
  "system-health": {
    title: "Health",
    eyebrow: "Operations center",
    description: "Live backend readiness checks with counts and configuration status.",
    endpoint: "/superadmin/system-health",
    columns: ["Service", "Status", "Detail", "Checked"],
    map: (record, index) => ({
      id: text(record.service) || `health-${index}`,
      search: searchable(record),
      cells: [
        text(record.service),
        <StatusBadge key="status" label={text(record.status)} />,
        text(record.detail),
        formatDate(record.checkedAt),
      ],
    }),
  },
};

export default function SuperadminSectionPage() {
  const router = useRouter();
  const params = useParams<{ section: string }>();
  const section = normalizeSection(params.section);
  const config = sections[section];
  const [profile, setProfile] = useState<JwtPayload | null>(null);
  const [records, setRecords] = useState<PlatformRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    const payload = decodeToken(getAuthToken());

    if (payload.role !== "SUPERADMIN") {
      router.replace("/login");
      return;
    }

    setProfile(payload);
  }, [router]);

  useEffect(() => {
    if (!profile) return;

    setLoading(true);
    setError("");
    api
      .get<PlatformRecord[]>(config.endpoint)
      .then((response) => setRecords(Array.isArray(response.data) ? response.data : []))
      .catch(() => {
        setRecords([]);
        setError("Live records could not be loaded right now.");
      })
      .finally(() => setLoading(false));
  }, [config.endpoint, profile]);

  async function updateDemoRequestStatus(id: string, status: DemoRequestStatus) {
    setPendingAction(`${id}-${status}`);
    setError("");

    try {
      const response = await api.patch<PlatformRecord>(`/superadmin/demo-requests/${id}`, {
        status,
      });
      setRecords((current) =>
        current.map((record) => (text(record.id) === id ? response.data : record)),
      );
    } catch {
      setError("Demo request action could not be saved right now.");
    } finally {
      setPendingAction("");
    }
  }

  async function deleteRecord(record: PlatformRecord) {
    if (!config.deleteConfig) return;

    const id = text(record.id);
    if (!id) return;

    const blockedReason = config.deleteConfig.blocked?.(record);
    if (blockedReason) {
      setError(blockedReason);
      return;
    }

    const label = config.deleteConfig.label(record);
    const confirmed = window.confirm(
      `Delete ${label}? This action cannot be undone and may remove related records.`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");

    try {
      await api.delete(config.deleteConfig.endpoint(id));
      setRecords((current) => current.filter((item) => text(item.id) !== id));
    } catch (deleteError: unknown) {
      const message =
        typeof deleteError === "object" &&
        deleteError !== null &&
        "response" in deleteError
          ? (deleteError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;
      setError(message ?? "Record could not be deleted right now.");
    } finally {
      setDeletingId("");
    }
  }

  const rows = useMemo(
    () =>
      records.map((record, index) => {
        const row = config.map(record, index);

        if (section === "demo-requests") {
          return {
            ...row,
            cells: [
              ...row.cells,
              <DemoRequestActions
                key="actions"
                id={row.id}
                record={record}
                email={text(record.email)}
                phone={text(record.phone)}
                status={text(record.status)}
                deletingId={deletingId}
                pendingAction={pendingAction}
                onDelete={deleteRecord}
                onStatusChange={updateDemoRequestStatus}
              />,
            ],
          };
        }

        if (config.deleteConfig) {
          return {
            ...row,
            cells: [
              ...row.cells,
              <DeleteRecordAction
                key="actions"
                record={record}
                deletingId={deletingId}
                deleteConfig={config.deleteConfig}
                onDelete={deleteRecord}
              />,
            ],
          };
        }

        return row;
      }),
    [config, deletingId, pendingAction, records, section],
  );
  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => row.search.includes(needle));
  }, [query, rows]);

  const initials = useMemo(
    () => (profile?.email ?? "SA").slice(0, 2).toUpperCase(),
    [profile?.email],
  );

  function signOut() {
    clearAuthToken();
    router.replace("/login");
  }

  function exportCsv() {
    const csv = [
      config.columns.join(","),
      ...visibleRows.map((row) =>
        row.cells.map((cell) => csvValue(cellToText(cell))).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `superadmin-${section}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!profile) {
    return <main className="min-h-screen bg-slate-950" />;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar active={`/superadmin/${section}`} />
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
                  {config.eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  {config.title}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-xs font-black text-white">
                  {initials}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Live endpoint: {config.endpoint}
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight">
                    {visibleRows.length.toLocaleString()} records
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {config.description}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search live records"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:w-72"
                  />
                  <button
                    type="button"
                    onClick={exportCsv}
                    disabled={!visibleRows.length}
                    className="h-11 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-lg font-black">Records</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Only operational fields selected for super admin visibility are shown.
                </p>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
                ) : (
                  <>
                    {error ? (
                      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                        {error}
                      </div>
                    ) : null}
                    <DataTable columns={config.columns} rows={visibleRows} />
                  </>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({ active }: { active: string }) {
  return (
    <aside className="hidden h-screen w-72 shrink-0 self-start border-r border-slate-200 bg-[#07111f] text-white xl:sticky xl:top-0 xl:flex xl:flex-col">
      <div className="flex h-screen flex-col">
        <div className="border-b border-white/10 px-6 py-5">
          <Link href="/superadmin" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-sm font-black text-slate-950">
              IF
            </span>
            <span>
              <span className="block text-sm font-semibold text-cyan-100">InvoiceForge</span>
              <span className="block text-lg font-bold tracking-tight">Super Admin</span>
            </span>
          </Link>
        </div>
        <nav className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sidebarItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                href === active
                  ? "bg-cyan-300 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: Row[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
        <h2 className="text-lg font-black">No live records available</h2>
        <p className="mt-2 text-sm text-slate-500">
          This section will populate as companies create matching records.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.16em] text-slate-400">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                className={`border-b border-slate-100 py-3 ${
                  index === columns.length - 1 ? "w-44 pl-4 pr-6 text-right" : "pr-4"
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.id}-${index}`}
                  className={`py-4 align-middle ${
                    index === row.cells.length - 1
                      ? "w-44 pl-4 pr-6 text-right text-slate-600"
                      : `pr-4 ${index === 0 ? "font-black text-slate-900" : "text-slate-600"}`
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 pt-4 text-sm font-medium text-slate-500">
        Showing {rows.length.toLocaleString()} live records
      </p>
    </div>
  );
}

function DemoRequestActions({
  id,
  record,
  email,
  phone,
  status,
  deletingId,
  pendingAction,
  onDelete,
  onStatusChange,
}: {
  id: string;
  record: PlatformRecord;
  email: string;
  phone: string;
  status: string;
  deletingId: string;
  pendingAction: string;
  onDelete: (record: PlatformRecord) => void;
  onStatusChange: (id: string, status: DemoRequestStatus) => void;
}) {
  const actions: Array<[DemoRequestStatus, string]> = [
    ["CONTACTED", "Contacted"],
    ["QUALIFIED", "Qualified"],
    ["WON", "Won"],
    ["CLOSED", "Close"],
  ];

  return (
    <div className="min-w-[360px] space-y-2">
      <div className="flex flex-wrap gap-2">
        <a
          href={`mailto:${email}?subject=${encodeURIComponent("InvoiceForge demo request")}`}
          className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
        >
          Email
        </a>
        {phone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
          >
            Call
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => onDelete(record)}
          disabled={Boolean(deletingId)}
          className="inline-flex h-9 items-center rounded-lg bg-rose-600 px-3 text-xs font-black text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deletingId === id ? "Deleting..." : "Delete"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(([nextStatus, label]) => {
          const active = status === nextStatus;
          const loading = pendingAction === `${id}-${nextStatus}`;

          return (
            <button
              key={nextStatus}
              type="button"
              onClick={() => onStatusChange(id, nextStatus)}
              disabled={active || Boolean(pendingAction)}
              className={`h-9 rounded-lg px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "bg-emerald-100 text-emerald-800"
                  : nextStatus === "CLOSED"
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "bg-slate-950 text-white hover:bg-slate-800"
              }`}
            >
              {loading ? "Saving..." : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeleteRecordAction({
  record,
  deletingId,
  deleteConfig,
  onDelete,
}: {
  record: PlatformRecord;
  deletingId: string;
  deleteConfig: NonNullable<SectionConfig["deleteConfig"]>;
  onDelete: (record: PlatformRecord) => void;
}) {
  const id = text(record.id);
  const blockedReason = deleteConfig.blocked?.(record) ?? null;
  const disabled = !id || Boolean(deletingId) || Boolean(blockedReason);

  return (
    <div className="flex min-w-[112px] justify-end">
      <button
        type="button"
        onClick={() => onDelete(record)}
        disabled={disabled}
        title={blockedReason ?? `Delete ${deleteConfig.label(record)}`}
        className="h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deletingId === id ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

function CompanyCell({
  record,
  nameKey = "companyName",
  subdomainKey = "companySubdomain",
}: {
  record: PlatformRecord;
  nameKey?: string;
  subdomainKey?: string;
}) {
  const name =
    text(record[nameKey]) ||
    text(record.name) ||
    text(record.tenantName) ||
    "Unknown company";
  const subdomain =
    text(record[subdomainKey]) || text(record.subdomain) || text(record.tenantSubdomain);
  const logoUrl = text(record.companyLogoUrl) || text(record.logoUrl);
  const logoAltText = text(record.companyLogoAltText) || text(record.logoAltText);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <CompanyLogo branding={{ name, logoUrl, logoAltText }} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-black text-slate-900">{name}</p>
        {subdomain ? <p className="truncate text-xs font-semibold text-slate-500">{subdomain}</p> : null}
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const tone =
    lower.includes("fail") ||
    lower.includes("overdue") ||
    lower.includes("suspend") ||
    lower.includes("inactive") ||
    lower.includes("review")
      ? "bg-rose-50 text-rose-700"
      : lower.includes("pending") || lower.includes("draft")
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      {label || "UNKNOWN"}
    </span>
  );
}

function liveCompanyRow(record: PlatformRecord, index: number, cells: ReactNode[]): Row {
  return {
    id: text(record.id) || `record-${index}`,
    search: searchable(record),
    cells: [<CompanyCell key="company" record={record} />, ...cells],
  };
}

function normalizeSection(value: string | string[] | undefined): SectionKey {
  const section = Array.isArray(value) ? value[0] : value;
  return section && section in sections ? (section as SectionKey) : "companies";
}

function decodeToken(token: string | null): JwtPayload {
  if (!token) return {};

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized)) as JwtPayload;
  } catch {
    return {};
  }
}

function searchable(record: PlatformRecord, hiddenKeys: string[] = []): string {
  const hidden = new Set(hiddenKeys);
  return Object.entries(record)
    .filter(([key]) => !hidden.has(key))
    .map(([, value]) => String(value ?? ""))
    .join(" ")
    .toLowerCase();
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function emptyText(value: unknown): string {
  return text(value) || "Not added";
}

function numberText(value: unknown): string {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-IN") : "0";
}

function formatMetricValue(value: unknown): string {
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return text(value);
}

function formatDate(value: unknown): string {
  const raw = text(value);
  if (!raw) return "Not added";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function subscriptionDaysLeft(record: PlatformRecord): string {
  const subscriptionEnd = text(record.subscriptionCurrentPeriodEndsAt);
  const trialEnd = text(record.trialEndsAt);
  const raw = subscriptionEnd || trialEnd;
  if (!raw) return "Not set";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Not set";
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return `${days} days`;
}

function formatMoney(value: unknown, currency = "INR"): string {
  const amount = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "Not added";
  return `${name.slice(0, 2)}***@${domain}`;
}

function cellToText(cell: ReactNode): string {
  if (typeof cell === "string" || typeof cell === "number") return String(cell);
  return "";
}

function csvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
