"use client";

import { useMemo } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-storage";

const queryClient = new QueryClient();

export default function AdminPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminContent />
    </QueryClientProvider>
  );
}

function AdminContent() {
  const adminQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [clients, documents, integrations, gstReports, businessSettings] =
        await Promise.all([
          api.get<Array<{ id: string }>>("/clients"),
          api.get<Array<{ id: string }>>("/documents"),
          api.get<Array<{ provider: string; status: string }>>("/integrations"),
          api.get<Array<{ id: string }>>("/gst/reports"),
          api.get<{ legalName?: string | null }>("/business-settings"),
        ]);

      return {
        clients: clients.data,
        documents: documents.data,
        integrations: integrations.data,
        gstReports: gstReports.data,
        businessSettings: businessSettings.data,
      };
    },
  });

  const role = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const token = getAuthToken();
    if (!token) {
      return "";
    }
    try {
      const payload = token.split(".")[1];
      const parsed = JSON.parse(
        window.atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
      ) as { role?: string };
      return parsed.role ?? "";
    } catch {
      return "";
    }
  }, []);

  const isAdmin = role === "OWNER" || role === "ADMIN";

  if (!isAdmin) {
    return (
      <DashboardShell active="Admin">
        <EmptyState
          title="Admin access required"
          description="Only workspace owners and admins can open this control center."
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell active="Admin">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Workspace control center
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Monitor business readiness, document volume, and integration posture from one professional admin view.
          </p>
        </section>

        {adminQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        ) : adminQuery.isError || !adminQuery.data ? (
          <EmptyState
            title="Admin dashboard unavailable"
            description="We could not load admin data right now."
            actionLabel="Retry"
            onAction={() => adminQuery.refetch()}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Workspace documents"
                value={String(adminQuery.data.documents.length)}
                hint="All tracked documents in this workspace."
              />
              <StatCard
                label="Clients"
                value={String(adminQuery.data.clients.length)}
                hint="Customer records available to your team."
              />
              <StatCard
                label="Configured integrations"
                value={String(adminQuery.data.integrations.filter((item) => item.status !== "NOT_CONFIGURED").length)}
                hint="Providers with setup activity."
                tone="success"
              />
              <StatCard
                label="GST reports"
                value={String(adminQuery.data.gstReports.length)}
                hint="Generated compliance reports."
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Workspace overview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current admin-facing workspace details.
                </p>
                <div className="mt-5 space-y-3">
                  <AdminRow
                    label="Company"
                    value={adminQuery.data.businessSettings.legalName || "Not configured"}
                  />
                  <AdminRow label="Users" value="No platform user API yet" />
                  <AdminRow label="Companies" value="Single-workspace deployment" />
                  <AdminRow label="Subscriptions" value="No subscription API yet" />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Platform metrics status</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Global platform analytics are not exposed by the backend yet.
                </p>
                <EmptyState
                  className="mt-5"
                  title="Waiting for platform analytics"
                  description="Add backend endpoints for total users, subscriptions, companies, and system activity to fully populate the admin dashboard."
                />
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function AdminRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
