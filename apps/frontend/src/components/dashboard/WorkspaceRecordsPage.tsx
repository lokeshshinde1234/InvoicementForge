"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/RecentDocuments";
import { api } from "@/lib/api";
import {
  downloadAuthenticatedFile,
  downloadAuthenticatedPdf,
} from "@/lib/pdf-download";

export type WorkspaceRecord = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  amount?: number | string | null;
  currency?: string;
  category?: string;
  date?: string | Date | null;
  href?: string;
  editHref?: string;
  pdfPath?: string;
  pdfFilename?: string;
  deletePath?: string;
  deleteLabel?: string;
  sourceLabel?: string;
  details?: Array<{ label: string; value?: string | number | null }>;
};

export type WorkspaceTab = {
  id: string;
  label: string;
  description?: string;
  filter: (record: WorkspaceRecord) => boolean;
};

type RecordSource<T> = {
  label: string;
  endpoint: string;
  map: (data: T) => WorkspaceRecord[];
};

type WorkspaceRecordsPageProps = {
  active: string;
  eyebrow: string;
  title: string;
  description: string;
  sources: Array<RecordSource<unknown>>;
  tabs: WorkspaceTab[];
  defaultTab?: string;
  actions?: Array<{ label: string; href?: string; downloadPath?: string; filename?: string }>;
  emptyTitle: string;
  emptyDescription: string;
};

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function WorkspaceRecordsPage({
  active,
  eyebrow,
  title,
  description,
  sources,
  tabs,
  defaultTab,
  actions = [],
  emptyTitle,
  emptyDescription,
}: WorkspaceRecordsPageProps) {
  const [selectedTab, setSelectedTab] = useState(defaultTab ?? tabs[0]?.id ?? "all");
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);
  const sourceKey = sources.map((source) => source.endpoint).join("|");
  const pageSize = 10;

  useEffect(() => {
    let activeRequest = true;

    setStatus("loading");
    function loadRecords() {
      setStatus("loading");
      Promise.all(
      sources.map(async (source) => {
        const response = await api.get(source.endpoint);
        return source.map(response.data).map((record) => ({
          ...record,
          sourceLabel: record.sourceLabel ?? source.label,
        }));
      }),
      )
      .then((groups) => {
        if (!activeRequest) {
          return;
        }

        setRecords(groups.flat());
        setStatus("ready");
      })
      .catch(() => {
        if (activeRequest) {
          setStatus("error");
        }
      });
    }

    loadRecords();

    return () => {
      activeRequest = false;
    };
  }, [sourceKey]);

  const currentTab = tabs.find((tab) => tab.id === selectedTab) ?? tabs[0];
  const visibleRecords = useMemo(
    () => records.filter((record) => currentTab?.filter(record) ?? true),
    [currentTab, records],
  );
  const totalPages = Math.max(1, Math.ceil(visibleRecords.length / pageSize));
  const paginatedRecords = visibleRecords.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [selectedTab]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  async function handlePdf(record: WorkspaceRecord) {
    setPdfLoading(record.id);
    try {
      if (record.pdfPath) {
        await downloadAuthenticatedPdf(
          record.pdfPath,
          record.pdfFilename ?? `${record.title}.pdf`,
        );
        return;
      }

      printRecordsPdf(`${record.title}.pdf`, [record]);
    } finally {
      setPdfLoading(null);
    }
  }

  async function handleDelete(record: WorkspaceRecord) {
    if (!record.deletePath) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${record.deleteLabel ?? record.title}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(record.id);
    try {
      await api.delete(record.deletePath);
      setRecords((currentRecords) =>
        currentRecords.filter((item) => item.id !== record.id),
      );
    } finally {
      setDeleteLoading(null);
    }
  }

  async function handleActionDownload(action: {
    label: string;
    downloadPath?: string;
    filename?: string;
  }) {
    if (!action.downloadPath) {
      return;
    }

    setActionLoading(action.label);
    setActionError("");
    try {
      await downloadAuthenticatedFile(
        action.downloadPath,
        action.filename ?? `${action.label}.xml`,
      );
    } catch (error) {
      setActionError(
        error instanceof Error && error.message
          ? error.message
          : `Could not download ${action.label}.`,
      );
    } finally {
      setActionLoading(null);
    }
  }

  function handleSectionPdf() {
    printRecordsPdf(`${title} - ${currentTab?.label ?? "records"}.pdf`, visibleRecords);
  }

  return (
    <DashboardShell active={active}>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) =>
                action.href ? (
                  <Link
                    key={`${action.label}-${action.href}`}
                    href={action.href}
                    className="inline-flex h-10 items-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={`${action.label}-${action.downloadPath}`}
                    type="button"
                    onClick={() => handleActionDownload(action)}
                    disabled={!action.downloadPath || actionLoading === action.label}
                    className="inline-flex h-10 items-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === action.label ? "Downloading..." : action.label}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={handleSectionPdf}
                disabled={visibleRecords.length === 0}
                className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Section PDF
              </button>
            </div>
          </div>
          {actionError ? (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {actionError}
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Connection" value={status === "ready" ? "Connected" : status === "loading" ? "Loading" : "Needs attention"} />
          <Metric label="Total records" value={records.length.toLocaleString()} />
          <Metric label="Showing" value={visibleRecords.length.toLocaleString()} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const count = records.filter(tab.filter).length;
              const selected = tab.id === selectedTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${
                    selected
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label} <span className="opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
          {currentTab?.description ? (
            <p className="mt-3 text-sm text-slate-500">{currentTab.description}</p>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold">{currentTab?.label ?? title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Company-scoped records available in this dashboard section.
            </p>
          </div>

          {status === "loading" ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-md bg-slate-100" />
              ))}
            </div>
          ) : status === "error" ? (
            <div className="p-5">
              <EmptyState
                title="Could not load records"
                description="Check your backend connection and try this dashboard page again."
              />
            </div>
          ) : visibleRecords.length === 0 ? (
            <div className="p-5">
              <EmptyState title={emptyTitle} description={emptyDescription} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Record</th>
                    <th className="px-5 py-3 font-semibold">Section</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-950">{record.title}</p>
                          {record.subtitle ? (
                            <p className="mt-1 text-xs text-slate-500">{record.subtitle}</p>
                          ) : null}
                          {record.details?.length ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {record.details
                                .filter((detail) => detail.value !== undefined && detail.value !== null && detail.value !== "")
                                .map((detail) => `${detail.label}: ${detail.value}`)
                                .join(" | ")}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {record.category ?? record.sourceLabel ?? active}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={record.status ?? "READY"} />
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formatAmount(record.amount, record.currency)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(record.date)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {record.href ? (
                            <Link
                              href={record.href}
                              className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-white"
                            >
                              Open
                            </Link>
                          ) : null}
                          {record.editHref ? (
                            <Link
                              href={record.editHref}
                              className="inline-flex h-9 items-center rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                            >
                              Edit
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handlePdf(record)}
                            className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            {pdfLoading === record.id ? "Preparing..." : "PDF"}
                          </button>
                          {record.deletePath ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(record)}
                              disabled={deleteLoading === record.id}
                              className="inline-flex h-9 items-center rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleteLoading === record.id ? "Deleting..." : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleRecords.length > pageSize ? (
                <PaginationControls
                  page={page}
                  pageSize={pageSize}
                  totalRecords={visibleRecords.length}
                  totalPages={totalPages}
                  onPrevious={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  onNext={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                />
              ) : null}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function PaginationControls({
  page,
  pageSize,
  totalRecords,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRecords);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {start}-{end} of {totalRecords}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page === 1}
          className="h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page === totalPages}
          className="h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatAmount(amount: WorkspaceRecord["amount"], currency = "INR") {
  if (amount === undefined || amount === null || amount === "") {
    return "Not set";
  }

  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return String(amount);
  }

  if (currency === "INR") {
    return moneyFormatter.format(numeric);
  }

  return `${currency} ${numeric.toLocaleString()}`;
}

function formatDate(date: WorkspaceRecord["date"]) {
  if (!date) {
    return "Not set";
  }

  return new Date(date).toLocaleDateString();
}

function printRecordsPdf(filename: string, records: WorkspaceRecord[]) {
  const popup = window.open("", "_blank", "width=920,height=720");

  if (!popup) {
    window.print();
    return;
  }

  popup.document.write(`
    <html>
      <head>
        <title>${escapeHtml(filename)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
          h1 { font-size: 22px; margin: 0 0 18px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(filename.replace(/\.pdf$/i, ""))}</h1>
        <table>
          <thead><tr><th>Record</th><th>Section</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            ${records
              .map(
                (record) => `
                  <tr>
                    <td>${escapeHtml(record.title)}<br>${escapeHtml(record.subtitle ?? "")}</td>
                    <td>${escapeHtml(record.category ?? record.sourceLabel ?? "")}</td>
                    <td>${escapeHtml(record.status ?? "READY")}</td>
                    <td>${escapeHtml(formatAmount(record.amount, record.currency))}</td>
                    <td>${escapeHtml(formatDate(record.date))}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });
}
