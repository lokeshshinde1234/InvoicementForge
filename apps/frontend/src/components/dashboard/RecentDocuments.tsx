"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { downloadAuthenticatedPdf } from "@/lib/pdf-download";

export type RecentDocumentRow = {
  id: string;
  title: string;
  client: string;
  type: string;
  status: string;
  amount: string;
  href: string;
  pdfHref?: string;
};

export function RecentDocuments({
  rows,
}: {
  rows: RecentDocumentRow[];
}) {
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState("");

  async function downloadPdf(row: RecentDocumentRow) {
    if (!row.pdfHref) {
      return;
    }

    setDownloadingId(row.id);

    try {
      await downloadAuthenticatedPdf(row.pdfHref, `${row.title}.pdf`);
    } finally {
      setDownloadingId("");
    }
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold">Recent documents</h2>
          <p className="mt-1 text-sm text-slate-500">
            Invoices, proposals, and shared documents will show up here.
          </p>
        </div>
        <EmptyState
          className="mt-5"
          title="No recent documents yet"
          description="Create your first invoice or proposal to start building a recent activity trail."
          actionLabel="Create your first invoice"
          onAction={() => router.push("/invoices/new")}
        />
      </section>
    );
  }

  return (
    <DashboardTable
      title="Recent documents"
      description="Your latest customer-facing work, automatically updated from live data."
      rows={rows}
      emptyTitle="No recent documents yet"
      emptyDescription="Create your first invoice or proposal to start here."
      action={
        <Link
          href="/dashboard/documents"
          className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          View all
        </Link>
      }
      columns={[
        {
          key: "title",
          header: "Document",
          render: (row) => (
            <Link href={row.href} className="font-semibold text-slate-900">
              {row.title}
            </Link>
          ),
        },
        {
          key: "client",
          header: "Client",
          render: (row) => <span className="text-slate-600">{row.client}</span>,
        },
        {
          key: "type",
          header: "Type",
          render: (row) => <span className="text-slate-600">{row.type}</span>,
        },
        {
          key: "status",
          header: "Status",
          render: (row) => <StatusBadge status={row.status} />,
        },
        {
          key: "action",
          header: "Action",
          render: (row) => {
            const isProposal = row.type.toLowerCase() === "proposal";
            const isChangeRequest =
              row.status.toUpperCase() === "CHANGES_REQUESTED";

            return (
              <div className="flex items-center gap-3">
                <Link
                  href={isProposal ? `${row.href}?edit=1` : row.href}
                  className={`text-sm font-semibold ${
                    isChangeRequest
                      ? "text-rose-700 hover:text-rose-800"
                      : "text-teal-700 hover:text-teal-800"
                  }`}
                >
                  {isProposal ? "Edit" : "Open"}
                </Link>
                {row.pdfHref ? (
                  <button
                    type="button"
                    onClick={() => downloadPdf(row)}
                    disabled={downloadingId === row.id}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingId === row.id ? "..." : "PDF"}
                  </button>
                ) : null}
              </div>
            );
          },
        },
        {
          key: "amount",
          header: "Value",
          align: "right",
          render: (row) => <span className="font-semibold">{row.amount}</span>,
        },
      ]}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone =
    normalized === "PAID" ||
    normalized === "SIGNED" ||
    normalized === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "OVERDUE" ||
          normalized === "CANCELLED" ||
          normalized === "CHANGES_REQUESTED"
        ? "bg-rose-50 text-rose-700"
        : normalized === "DRAFT"
          ? "bg-slate-100 text-slate-700"
          : "bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}
