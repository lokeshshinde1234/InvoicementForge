"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CompanyLogo } from "@/components/branding/CompanyBranding";
import { API_BASE_URL } from "@/lib/config";

type PortalMe = {
  client: {
    id: string;
    name: string;
    companyName: string | null;
    email: string | null;
    phone: string | null;
  };
  company: {
    id: string;
    name: string;
    subdomain: string;
    logoUrl?: string | null;
    logoAltText?: string | null;
  };
  documents: {
    proposals: Array<{
      id: string;
      title: string;
      status: string;
      approvalStatus?: string;
      aadhaarDocumentAttached?: boolean;
      totalAmount: number;
      createdAt: string;
    }>;
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      status: string;
      total: number;
      dueDate: string;
    }>;
  };
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    invoiceId?: string | null;
    proposalId?: string | null;
    amount?: number | null;
    dueDate?: string | null;
    readAt?: string | null;
    createdAt: string;
  }>;
};

type PortalGst = {
  company: {
    gstin: string | null;
    state: string | null;
    taxSystem: string | null;
  };
  client: {
    gstin: string | null;
    state: string | null;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    totalTax: number;
    dueDate: string;
    lineItems: Array<{
      description: string;
      hsnCode?: string;
      sacCode?: string;
      gstRate: number;
      tdsRate?: number;
      tcsRate?: number;
      taxableAmount?: number;
      totalTax?: number;
      total?: number;
    }>;
  }>;
};

export default function ClientPortalDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<PortalMe | null>(null);
  const [gstData, setGstData] = useState<PortalGst | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [correctionInvoiceId, setCorrectionInvoiceId] = useState("");
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [correctionStatus, setCorrectionStatus] = useState("");
  const [proposalSearch, setProposalSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    async function loadPortalData(options: { initial?: boolean } = {}) {
      if (options.initial) setLoading(true);

      try {
        const [portalResponse, gstResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/portal/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/portal/gst`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const body = await portalResponse.json().catch(() => ({}));
        const gstBody = await gstResponse.json().catch(() => ({}));

        if (!portalResponse.ok) {
          throw new Error(body.message || "Please enter valid credentials.");
        }

        setData(body as PortalMe);
        if (gstResponse.ok) {
          setGstData(gstBody as PortalGst);
        }
        setError("");
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong. Please try again.",
        );
        window.localStorage.removeItem("portalClientToken");
      } finally {
        if (options.initial) setLoading(false);
      }
    }

    void loadPortalData({ initial: true });
    const interval = window.setInterval(() => {
      void loadPortalData();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [router]);

  const documentCount = useMemo(() => {
    if (!data) return 0;
    return data.documents.proposals.length + data.documents.invoices.length;
  }, [data]);
  const unreadNotifications = useMemo(
    () => data?.notifications.filter((notification) => !notification.readAt).length ?? 0,
    [data],
  );
  const paymentRecords = useMemo(
    () =>
      data?.notifications.filter(
        (notification) => notification.type === "PAYMENT_RECEIVED",
      ) ?? [],
    [data],
  );
  const openInvoiceTotal = useMemo(() => {
    const invoices = data?.documents.invoices ?? [];
    return invoices
      .filter((invoice) => invoice.status.toLowerCase() !== "paid")
      .reduce((total, invoice) => total + Number(invoice.total || 0), 0);
  }, [data]);
  const overdueInvoiceCount = useMemo(() => {
    const now = new Date();
    return (data?.documents.invoices ?? []).filter((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      return (
        invoice.status.toLowerCase() !== "paid" &&
        !Number.isNaN(dueDate.getTime()) &&
        dueDate.getTime() < now.getTime()
      );
    }).length;
  }, [data]);
  const filteredProposals = useMemo(() => {
    const query = proposalSearch.trim().toLowerCase();
    const proposals = data?.documents.proposals ?? [];
    if (!query) return proposals;

    return proposals.filter((proposal) =>
      [
        proposal.title,
        proposal.status,
        proposal.approvalStatus,
        String(proposal.totalAmount),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [data, proposalSearch]);
  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();
    const invoices = data?.documents.invoices ?? [];
    if (!query) return invoices;

    return invoices.filter((invoice) =>
      [
        invoice.invoiceNumber,
        invoice.status,
        String(invoice.total),
        formatDate(invoice.dueDate),
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [data, invoiceSearch]);

  function logout() {
    window.localStorage.removeItem("portalClientToken");
    router.replace("/portal/login");
  }

  async function markNotificationsRead(notificationIds: string[]) {
    const unreadIds = notificationIds.filter((notificationId) =>
      data?.notifications.some(
        (notification) => notification.id === notificationId && !notification.readAt,
      ),
    );

    if (unreadIds.length === 0) return;

    const token = window.localStorage.getItem("portalClientToken");
    if (!token) return;

    const readAt = new Date().toISOString();
    setData((current) =>
      current
        ? {
            ...current,
            notifications: current.notifications.map((notification) =>
              unreadIds.includes(notification.id)
                ? { ...notification, readAt }
                : notification,
            ),
          }
        : current,
    );

    await Promise.allSettled(
      unreadIds.map((notificationId) =>
        fetch(`${API_BASE_URL}/portal/notifications/${notificationId}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ),
    );
  }

  function markDropdownNotificationsRead() {
    if (!data) return;
    void markNotificationsRead(
      data.notifications.slice(0, 8).map((notification) => notification.id),
    );
  }

  async function requestGstCorrection(invoiceId: string) {
    const token = window.localStorage.getItem("portalClientToken");

    if (!token || !correctionMessage.trim()) {
      setCorrectionStatus("Enter a correction message first.");
      return;
    }

    setCorrectionInvoiceId(invoiceId);
    setCorrectionStatus("Sending correction request...");

    const response = await fetch(
      `${API_BASE_URL}/portal/gst/invoices/${invoiceId}/request-correction`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: correctionMessage }),
      },
    );
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setCorrectionStatus(body.message || "Could not send correction request.");
      return;
    }

    setCorrectionMessage("");
    setCorrectionStatus(body.message || "GST correction request sent.");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-4 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-xl shadow-slate-950/10">
          Loading client portal...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-4 text-slate-950">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-950/10">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">
            IF
          </span>
          <h1 className="mt-5 text-xl font-semibold">Client portal access</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error || "Please enter valid credentials."}
          </p>
          <Link
            href="/portal/login"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.13),transparent_30%),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:auto,auto,56px_56px,56px_56px]" />
      <div className="relative mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <header className="sticky top-2 z-20 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur-xl sm:top-4 sm:flex sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <CompanyLogo branding={data.company} size="md" />
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.2em] text-teal-700">
                {data.company.name}
              </p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight sm:text-3xl">
                Client workspace
              </h1>
              <p className="mt-1 truncate text-xs text-slate-600 sm:text-sm">
                Welcome, {data.client.name} · {data.client.companyName ?? data.client.email ?? "Verified client"}
              </p>
            </div>
          </div>
          <div className="mt-3 grid w-full grid-cols-[40px_minmax(0,1fr)_40px] gap-2 sm:ml-auto sm:mt-0 sm:flex sm:w-auto sm:items-center sm:justify-end">
            <details
              className="relative"
              onToggle={(event) => {
                if (event.currentTarget.open) markDropdownNotificationsRead();
              }}
            >
              <summary
                aria-label="Open notifications"
                title="Notifications"
                className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-400 hover:text-teal-800 hover:shadow-md"
              >
                <BellIcon />
                <span className="absolute -right-2 -top-2 rounded-full bg-teal-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-[min(92vw,420px)] rounded-lg border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/20">
                <div className="max-h-96 overflow-y-auto">
                  {data.notifications.length > 0 ? (
                    data.notifications.slice(0, 8).map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={() => markNotificationsRead([notification.id])}
                      />
                    ))
                  ) : (
                    <p className="rounded-md bg-slate-50 p-4 text-sm font-medium text-slate-600">
                      No notifications yet.
                    </p>
                  )}
                </div>
              </div>
            </details>
            <Link
              href="/portal/change-password"
              className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Security settings</span>
              <span className="hidden sm:inline">Password settings</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-md sm:flex sm:w-auto sm:px-4 sm:text-sm sm:font-bold"
            >
              <span className="text-lg sm:hidden" aria-hidden="true">↗</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 md:grid-cols-4 md:gap-4">
          <InfoCard label="Client email" value={data.client.email ?? "Not added"} />
          <InfoCard label="Documents" value={String(documentCount)} />
          <InfoCard label="Open balance" value={formatMoney(openInvoiceTotal)} />
          <InfoCard label="Overdue invoices" value={String(overdueInvoiceCount)} />
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-950/20 sm:mt-6 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">
                Secure finance desk
              </p>
              <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                Proposals, invoices, reminders, and payments in one organized place.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                This workspace is scoped to your verified client account with {data.company.name}. It refreshes automatically so new notifications and payment records stay current.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:w-80 sm:gap-3">
              <MiniStat label="Proposals" value={String(data.documents.proposals.length)} />
              <MiniStat label="Invoices" value={String(data.documents.invoices.length)} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-6">
            <DocumentPanel
              title="Proposals"
              description="Review commercial proposals and signed agreements."
              searchValue={proposalSearch}
              searchPlaceholder="Search proposals"
              onSearchChange={setProposalSearch}
            >
              {filteredProposals.length > 0 ? (
                filteredProposals.map((proposal) => (
                  <DocumentRow
                    key={proposal.id}
                    title={proposal.title}
                    meta={formatApprovalStatus(proposal.approvalStatus)}
                    amount={proposal.totalAmount}
                    href={`/portal/proposals/${proposal.id}`}
                    actionLabel="Review proposal"
                  />
                ))
              ) : (
                <EmptyState title="No matching proposals found." />
              )}
            </DocumentPanel>

            <DocumentPanel
              title="Invoices"
              description="Track outstanding and completed billing documents."
              searchValue={invoiceSearch}
              searchPlaceholder="Search invoices"
              onSearchChange={setInvoiceSearch}
            >
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <DocumentRow
                    key={invoice.id}
                    title={invoice.invoiceNumber}
                    meta={invoice.status}
                    amount={invoice.total}
                    href={`/portal/invoices/${invoice.id}/pay`}
                    actionLabel="View invoice"
                  />
                ))
              ) : (
                <EmptyState title="No matching invoices found." />
              )}
            </DocumentPanel>
          </div>

          <aside className="grid content-start gap-6">
            <NotificationPanel
              notifications={data.notifications}
              onRead={(notification) => markNotificationsRead([notification.id])}
            />
            <PaymentRecordsPanel
              records={paymentRecords}
              onRead={(notification) => markNotificationsRead([notification.id])}
            />
          </aside>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-950/10 backdrop-blur sm:rounded-3xl sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                GST workspace
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                GST, HSN/SAC, TDS/TCS shared with you
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                These records come from invoices scoped to your verified client identity.
              </p>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <InfoPill label="Company GSTIN" value={gstData?.company.gstin ?? "Not added"} />
              <InfoPill label="Client GSTIN" value={gstData?.client.gstin ?? "Not added"} />
              <InfoPill label="Tax system" value={gstData?.company.taxSystem ?? "GST"} />
            </div>
          </div>

          {!gstData || gstData.invoices.length === 0 ? (
            <EmptyState title="No GST records available yet." />
          ) : (
            <div className="mt-5 grid gap-4">
              {gstData.invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-teal-700">
                        {invoice.status} | GST {formatMoney(invoice.totalTax)}
                      </p>
                    </div>
                    <Link
                      href={`/portal/invoices/${invoice.id}/pay`}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white"
                    >
                      View invoice
                    </Link>
                  </div>
                  <div className="mobile-table-scroll mt-4 overflow-x-auto">
                    <table className="mobile-card-table w-full min-w-[720px] text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="py-2 font-semibold">Item</th>
                          <th className="py-2 font-semibold">HSN/SAC</th>
                          <th className="py-2 font-semibold">GST</th>
                          <th className="py-2 font-semibold">TDS/TCS</th>
                          <th className="py-2 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoice.lineItems.map((item, index) => (
                          <tr key={`${invoice.id}-${index}`}>
                            <td data-label="Item" className="py-3 font-medium">{item.description}</td>
                            <td data-label="HSN/SAC" className="py-3">HSN {item.hsnCode || "-"} / SAC {item.sacCode || "-"}</td>
                            <td data-label="GST" className="py-3">{item.gstRate ?? 0}%</td>
                            <td data-label="TDS/TCS" className="py-3">TDS {item.tdsRate ?? 0}% / TCS {item.tcsRate ?? 0}%</td>
                            <td data-label="Amount" className="py-3 text-right font-semibold">{formatMoney(Number(item.total ?? invoice.total))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      value={correctionInvoiceId === invoice.id ? correctionMessage : ""}
                      onChange={(event) => {
                        setCorrectionInvoiceId(invoice.id);
                        setCorrectionMessage(event.target.value);
                      }}
                      placeholder="Request GST correction or reconciliation clarification"
                      className="h-10 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-teal-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => requestGstCorrection(invoice.id)}
                      className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-teal-600"
                    >
                      Request correction
                    </button>
                  </div>
                  {correctionInvoiceId === invoice.id && correctionStatus ? (
                    <p className="mt-2 text-sm font-medium text-teal-700">{correctionStatus}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-950/5 backdrop-blur sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-950 sm:mt-3 sm:text-lg">{value}</p>
    </article>
  );
}

function NotificationPanel({
  notifications,
  onRead,
}: {
  notifications: PortalMe["notifications"];
  onRead: (notification: PortalMe["notifications"][number]) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-950/10 backdrop-blur sm:rounded-3xl sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight">Notifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            Proposal, invoice, payment, and reminder updates.
          </p>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
          {notifications.length}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {notifications.length > 0 ? (
          notifications.slice(0, 6).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => onRead(notification)}
            />
          ))
        ) : (
          <EmptyState title="No notifications yet." />
        )}
      </div>
    </section>
  );
}

function PaymentRecordsPanel({
  records,
  onRead,
}: {
  records: PortalMe["notifications"];
  onRead: (notification: PortalMe["notifications"][number]) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-950/10 backdrop-blur">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-black tracking-tight">Payment received</h2>
        <p className="mt-1 text-sm text-slate-500">
          Confirmed payments recorded against your invoices.
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        {records.length > 0 ? (
          records.map((record) => (
            <NotificationItem
              key={record.id}
              notification={record}
              compact
              onRead={() => onRead(record)}
            />
          ))
        ) : (
          <EmptyState title="No payment records yet." />
        )}
      </div>
    </section>
  );
}

function NotificationItem({
  notification,
  compact = false,
  onRead,
}: {
  notification: PortalMe["notifications"][number];
  compact?: boolean;
  onRead: () => void;
}) {
  const href = getNotificationHref(notification);
  const isDeleted =
    notification.type === "INVOICE_DELETED" ||
    notification.type === "PROPOSAL_DELETED";
  const tone =
    notification.type === "PAYMENT_RECEIVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : notification.type === "PAYMENT_OVERDUE"
        ? "border-rose-200 bg-rose-50 text-rose-800"
      : isDeleted
        ? "border-slate-300 bg-slate-100 text-slate-700"
      : notification.type === "PAYMENT_REMINDER"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-teal-200 bg-teal-50 text-teal-800";
  const unreadClass = notification.readAt
    ? "border-slate-200 bg-white"
    : "border-teal-300 bg-teal-50/60";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!notification.readAt ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-teal-600" />
            ) : null}
            <p className="truncate text-sm font-semibold text-slate-950">
              {notification.title}
            </p>
          </div>
          {!compact ? (
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {notification.message}
            </p>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${tone}`}>
          {formatNotificationType(notification.type)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {notification.amount ? (
          <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">
            {formatMoney(notification.amount)}
          </span>
        ) : null}
        {notification.dueDate ? (
          <span>Due {formatDate(notification.dueDate)}</span>
        ) : null}
        {href ? <span className="font-bold text-teal-700">Open details</span> : null}
        {isDeleted ? (
          <span className="font-bold text-slate-600">Deleted by company</span>
        ) : null}
        <span>{formatDate(notification.createdAt)}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onRead}
        className={`block rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md ${unreadClass}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onRead}
      className={`w-full rounded-2xl border p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md ${unreadClass}`}
    >
      {content}
    </button>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 break-words font-bold text-slate-800">{value}</p>
    </div>
  );
}

function DocumentPanel({
  title,
  description,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  children,
}: {
  title: string;
  description: string;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-950/10 backdrop-blur sm:rounded-3xl sm:p-5">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <div className="relative w-full sm:w-56">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-full border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function DocumentRow({
  title,
  meta,
  amount,
  href,
  actionLabel,
}: {
  title: string;
  meta: string;
  amount: number;
  href: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:flex sm:justify-between sm:gap-4 sm:px-4"
    >
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-teal-700">
          {meta}
        </p>
      </div>
      <p className="shrink-0 text-sm font-black">
        {new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(amount))}
      </p>
      <span className="hidden shrink-0 rounded-full bg-slate-950 px-3 py-2 text-xs font-bold text-white sm:inline-flex">
        {actionLabel}
      </span>
    </Link>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Shared documents from this company will appear here.
      </p>
    </div>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatNotificationType(type: string) {
  const labels: Record<string, string> = {
    PROPOSAL_SENT: "Proposal",
    INVOICE_SENT: "Invoice",
    PAYMENT_REMINDER: "Reminder",
    PAYMENT_OVERDUE: "Overdue",
    PAYMENT_RECEIVED: "Paid",
    INVOICE_DELETED: "Deleted",
    PROPOSAL_DELETED: "Deleted",
  };

  return labels[type] ?? type.replace(/_/g, " ");
}

function getNotificationHref(notification: PortalMe["notifications"][number]) {
  if (notification.type === "INVOICE_DELETED") return null;
  if (notification.type === "PROPOSAL_DELETED") return null;

  if (notification.invoiceId) {
    return `/portal/invoices/${notification.invoiceId}/pay`;
  }

  if (notification.proposalId) {
    return `/portal/proposals/${notification.proposalId}`;
  }

  return null;
}

function formatApprovalStatus(status?: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending Approval";
}
