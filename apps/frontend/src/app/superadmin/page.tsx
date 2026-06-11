"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CompanyLogo } from "@/components/branding/CompanyBranding";
import { api } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth-storage";

type JwtPayload = { email?: string; role?: string };

type PlatformSummary = {
  tenants: number;
  users: number;
  activeUsers: number;
  owners: number;
  clients: number;
  proposals: number;
  approvedProposals: number;
  pendingProposals: number;
  invoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  payments: number;
  paidPayments: number;
  failedPayments: number;
  templates: number;
  revenueCollected: number;
};

type PlatformTenant = {
  id: string;
  name: string;
  subdomain: string;
  gstin: string | null;
  countryCode: string;
  currency: string;
  status: string;
  createdAt: string;
  userCount: number;
  clientCount: number;
  invoiceCount: number;
  proposalCount: number;
  logoUrl: string | null;
  logoAltText: string | null;
  plan: string;
  billingCycle: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionCurrentPeriodEndsAt: string | null;
};

const navItems = [
  ["Dashboard", "/superadmin"],
  ["Companies", "/superadmin/companies"],
  ["Clients", "/superadmin/clients"],
  ["Users", "/superadmin/teams-users"],
  ["Proposals", "/superadmin/proposals"],
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

const metricCards: Array<{
  label: string;
  key: keyof PlatformSummary;
  type: "number" | "money";
  href: string;
}> = [
  { label: "Companies", key: "tenants", type: "number", href: "/superadmin/companies" },
  { label: "Users", key: "users", type: "number", href: "/superadmin/teams-users" },
  { label: "Active users", key: "activeUsers", type: "number", href: "/superadmin/teams-users" },
  { label: "Clients", key: "clients", type: "number", href: "/superadmin/clients" },
  { label: "Proposals", key: "proposals", type: "number", href: "/superadmin/proposals" },
  { label: "Invoices", key: "invoices", type: "number", href: "/superadmin/invoices" },
  { label: "Payments", key: "payments", type: "number", href: "/superadmin/payments" },
  { label: "Revenue collected", key: "revenueCollected", type: "money", href: "/superadmin/payments" },
];

export default function SuperadminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<JwtPayload | null>(null);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [companies, setCompanies] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingCompanyId, setDeletingCompanyId] = useState("");

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

    Promise.all([
      api.get<PlatformSummary>("/superadmin/summary"),
      api.get<PlatformTenant[]>("/superadmin/tenants"),
    ])
      .then(([summaryResponse, companiesResponse]) => {
        setSummary(summaryResponse.data);
        setCompanies(companiesResponse.data);
      })
      .finally(() => setLoading(false));
  }, [profile]);

  const initials = useMemo(
    () => (profile?.email ?? "SA").slice(0, 2).toUpperCase(),
    [profile?.email],
  );

  function signOut() {
    clearAuthToken();
    router.replace("/login");
  }

  async function deleteCompany(company: PlatformTenant) {
    const confirmed = window.confirm(
      `Delete ${company.name}? This action cannot be undone and may remove related company records.`,
    );

    if (!confirmed) return;

    setDeletingCompanyId(company.id);
    setError("");

    try {
      await api.delete(`/superadmin/tenants/${company.id}`);
      setCompanies((current) => current.filter((item) => item.id !== company.id));
      setSummary((current) =>
        current
          ? {
              ...current,
              tenants: Math.max(current.tenants - 1, 0),
              users: Math.max(current.users - company.userCount, 0),
              clients: Math.max(current.clients - company.clientCount, 0),
              invoices: Math.max(current.invoices - company.invoiceCount, 0),
              proposals: Math.max(current.proposals - company.proposalCount, 0),
            }
          : current,
      );
    } catch (deleteError: unknown) {
      const message =
        typeof deleteError === "object" &&
        deleteError !== null &&
        "response" in deleteError
          ? (deleteError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;
      setError(message ?? "Company could not be deleted right now.");
    } finally {
      setDeletingCompanyId("");
    }
  }

  if (!profile) {
    return <main className="min-h-screen bg-slate-950" />;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <SuperadminSidebar active="/superadmin" />
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
                  Live platform control
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Super Admin Dashboard
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
            <section className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                Live company operations
              </p>
              <h2 className="mt-4 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
                Monitor company records, logos, users, billing activity, and platform health without exposing private data.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                This dashboard reads from live backend APIs and shows only operational metadata needed for platform administration.
              </p>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map(({ label, key, type, href }) => (
                <Link
                  key={key}
                  href={href}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight">
                    {summary ? formatMetric(Number(summary[key]), type) : loading ? "..." : "0"}
                  </h3>
                  <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 transition group-hover:bg-cyan-50 group-hover:text-cyan-700">
                    Open {label}
                  </span>
                </Link>
              ))}
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black">Companies</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Logo, company identity, workspace status, and record counts.
                  </p>
                </div>
                <Link
                  href="/superadmin/companies"
                  className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
                >
                  Open all companies
                </Link>
              </div>
              <div className="overflow-x-auto p-5">
                {error ? (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                    {error}
                  </div>
                ) : null}
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    <tr>
                      <th className="border-b border-slate-100 py-3 pr-4">Company</th>
                      <th className="border-b border-slate-100 py-3 pr-4">Workspace</th>
                      <th className="border-b border-slate-100 py-3 pr-4">Plan</th>
                      <th className="border-b border-slate-100 py-3 pr-4">Subscription</th>
                      <th className="border-b border-slate-100 py-3 pr-4">Days left</th>
                      <th className="border-b border-slate-100 py-3 pr-4">Users</th>
                      <th className="border-b border-slate-100 py-3 pr-4">Clients</th>
                      <th className="border-b border-slate-100 py-3 pr-4">Invoices</th>
                      <th className="w-40 border-b border-slate-100 py-3 pl-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {companies.slice(0, 10).map((company) => (
                      <tr key={company.id} className="hover:bg-slate-50">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <CompanyLogo branding={company} size="sm" />
                            <span className="font-black text-slate-900">{company.name}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{company.subdomain}</td>
                        <td className="py-4 pr-4 text-slate-600">{company.plan} / {company.billingCycle}</td>
                        <td className="py-4 pr-4"><StatusBadge label={company.subscriptionStatus} /></td>
                        <td className="py-4 pr-4 text-slate-600">{subscriptionDaysLeft(company)}</td>
                        <td className="py-4 pr-4 text-slate-600">{company.userCount}</td>
                        <td className="py-4 pr-4 text-slate-600">{company.clientCount}</td>
                        <td className="py-4 pr-4 text-slate-600">{company.invoiceCount}</td>
                        <td className="w-40 py-4 pl-4 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => deleteCompany(company)}
                            disabled={Boolean(deletingCompanyId)}
                            className="h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingCompanyId === company.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function SuperadminSidebar({ active }: { active: string }) {
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
          {navItems.map(([label, href]) => (
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

function StatusBadge({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const tone =
    lower.includes("fail") || lower.includes("suspend") || lower.includes("inactive")
      ? "bg-rose-50 text-rose-700"
      : lower.includes("pending") || lower.includes("draft") || lower.includes("review")
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      {label}
    </span>
  );
}

function formatMetric(value: number, type: "number" | "money") {
  if (type === "money") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return value.toLocaleString();
}

function subscriptionDaysLeft(company: PlatformTenant) {
  const raw = company.subscriptionCurrentPeriodEndsAt || company.trialEndsAt;
  if (!raw) return "Not set";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Not set";
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return `${days} days`;
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
