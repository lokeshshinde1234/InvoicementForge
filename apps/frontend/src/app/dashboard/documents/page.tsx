"use client";

import {
  WorkspaceRecordsPage,
  type WorkspaceRecord,
} from "@/components/dashboard/WorkspaceRecordsPage";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number | string;
  createdAt: string;
};

type Proposal = {
  id: string;
  title: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
};

type DocumentRecord = {
  id: string;
  type: string;
  title: string;
  status: string;
  amount: number | string;
  currency: string;
  createdAt: string;
};

const documentTabs = [
  {
    id: "default",
    label: "Invoices & proposals",
    description: "Default document view for sales documents.",
    filter: (record: WorkspaceRecord) =>
      ["Invoice", "Proposal"].includes(record.category ?? ""),
  },
  {
    id: "invoices",
    label: "Invoices",
    filter: (record: WorkspaceRecord) => record.category === "Invoice",
  },
  {
    id: "proposals",
    label: "Proposals",
    filter: (record: WorkspaceRecord) => record.category === "Proposal",
  },
  {
    id: "purchasing",
    label: "Purchasing",
    filter: (record: WorkspaceRecord) => ["Purchase order", "Bill / expense"].includes(record.category ?? ""),
  },
  {
    id: "logistics",
    label: "Logistics",
    filter: (record: WorkspaceRecord) => record.category === "Delivery challan",
  },
  {
    id: "accounting",
    label: "Accounting",
    filter: (record: WorkspaceRecord) => ["Credit note", "Debit note"].includes(record.category ?? ""),
  },
  {
    id: "payment",
    label: "Payment",
    filter: (record: WorkspaceRecord) => record.category === "Receipt",
  },
  {
    id: "legal",
    label: "Legal",
    filter: (record: WorkspaceRecord) => record.category === "Contract",
  },
];

export default function DocumentsPage() {
  return (
    <WorkspaceRecordsPage
      active="Documents"
      eyebrow="Document ecosystem"
      title="All business documents"
      description="Invoices, proposals, purchasing, logistics, accounting, payment, and legal records are available from one document ecosystem."
      actions={[
        { label: "Create invoice", href: "/invoices/new" },
        { label: "Create proposal", href: "/proposals/new" },
      ]}
      sources={[
        {
          label: "Invoices",
          endpoint: "/invoices",
          map: (data) =>
            (data as Invoice[]).map((invoice) => ({
              id: `invoice-${invoice.id}`,
              title: invoice.invoiceNumber,
              status: invoice.status,
              amount: invoice.total,
              date: invoice.createdAt,
              category: "Invoice",
              href: `/invoices/${invoice.id}`,
              pdfPath: `/invoices/${invoice.id}/pdf`,
              pdfFilename: `${invoice.invoiceNumber}.pdf`,
            })),
        },
        {
          label: "Proposals",
          endpoint: "/proposals",
          map: (data) =>
            (data as Proposal[]).map((proposal) => ({
              id: `proposal-${proposal.id}`,
              title: proposal.title,
              status: proposal.status,
              amount: proposal.totalAmount,
              date: proposal.createdAt,
              category: "Proposal",
              href: `/proposals/${proposal.id}`,
              pdfPath: `/proposals/${proposal.id}/pdf`,
              pdfFilename: `${proposal.title}.pdf`,
            })),
        },
        {
          label: "Documents",
          endpoint: "/documents",
          map: (data) =>
            (data as DocumentRecord[]).map((document) => ({
              id: `document-${document.id}`,
              title: document.title,
              status: document.status,
              amount: document.amount,
              currency: document.currency,
              date: document.createdAt,
              category: formatDocumentType(document.type),
            })),
        },
      ]}
      tabs={documentTabs}
      defaultTab="default"
      emptyTitle="No documents found"
      emptyDescription="Create invoices, proposals, or supporting business documents to populate this ecosystem."
    />
  );
}

function formatDocumentType(type: string) {
  const labels: Record<string, string> = {
    PURCHASE_ORDER: "Purchase order",
    BILL_EXPENSE: "Bill / expense",
    DELIVERY_CHALLAN: "Delivery challan",
    CREDIT_NOTE: "Credit note",
    DEBIT_NOTE: "Debit note",
    RECEIPT: "Receipt",
    CONTRACT: "Contract",
    QUOTE: "Quote",
    INVOICE: "Invoice",
    PROPOSAL: "Proposal",
  };

  return labels[type] ?? type.replace(/_/g, " ");
}
