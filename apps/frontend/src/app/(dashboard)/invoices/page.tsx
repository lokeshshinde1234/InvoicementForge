"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  WorkspaceRecordsPage,
  type WorkspaceRecord,
} from "@/components/dashboard/WorkspaceRecordsPage";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  clientId: string;
  total: number | string;
  totalTax?: number | string;
  dueDate?: string | null;
  createdAt: string;
};

const invoiceTabs = [
  {
    id: "all",
    label: "All invoices",
    description: "All invoice messages and billing records for this company.",
    filter: () => true,
  },
  {
    id: "draft",
    label: "Draft invoices",
    filter: (record: WorkspaceRecord) => record.status === "DRAFT",
  },
  {
    id: "pending",
    label: "Pending invoices",
    filter: (record: WorkspaceRecord) =>
      ["SENT", "VIEWED", "DRAFT"].includes(record.status ?? ""),
  },
  {
    id: "paid",
    label: "Paid invoices",
    filter: (record: WorkspaceRecord) => record.status === "PAID",
  },
  {
    id: "overdue",
    label: "Overdue invoices",
    filter: (record: WorkspaceRecord) => record.status === "OVERDUE",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    filter: (record: WorkspaceRecord) => record.status === "CANCELLED",
  },
];

export default function InvoiceListPage() {
  return (
    <Suspense fallback={null}>
      <InvoiceListContent />
    </Suspense>
  );
}

function InvoiceListContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") ?? "all";
  const defaultTab = invoiceTabs.some((tab) => tab.id === requestedTab)
    ? requestedTab
    : "all";

  return (
    <WorkspaceRecordsPage
      active="Invoices"
      eyebrow="Invoice module"
      title="Invoice list"
      description="Company invoices are shown here with status filters and a PDF button for every invoice."
      actions={[
        { label: "Create invoice", href: "/invoices/new" },
        { label: "Payment dashboard", href: "/dashboard/payments" },
      ]}
      sources={[
        {
          label: "Invoices",
          endpoint: "/invoices",
          map: (data) =>
            (data as Invoice[]).map((invoice) => ({
              id: invoice.id,
              title: invoice.invoiceNumber,
              subtitle: `Client ${invoice.clientId.slice(0, 8)}`,
              status: invoice.status,
              amount: invoice.total,
              date: invoice.dueDate ?? invoice.createdAt,
              category: "Invoice module",
              href: `/invoices/${invoice.id}`,
              pdfPath: `/invoices/${invoice.id}/pdf`,
              pdfFilename: `${invoice.invoiceNumber}.pdf`,
              deletePath: `/invoices/${invoice.id}`,
              deleteLabel: `invoice ${invoice.invoiceNumber}`,
              details: [{ label: "GST", value: invoice.totalTax }],
            })),
        },
      ]}
      tabs={invoiceTabs}
      defaultTab={defaultTab}
      emptyTitle="No invoices found"
      emptyDescription="Create an invoice to populate this company invoice module."
    />
  );
}
