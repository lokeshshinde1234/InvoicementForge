"use client";

import {
  WorkspaceRecordsPage,
  type WorkspaceRecord,
} from "@/components/dashboard/WorkspaceRecordsPage";

type Integration = {
  id: string;
  provider: string;
  status: string;
  lastError?: string | null;
  updatedAt: string;
  createdAt: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number | string;
  totalTax?: number | string;
  createdAt: string;
};

type Payment = {
  id: string;
  invoiceId: string;
  status: string;
  amount: number | string;
  currency: string;
  createdAt: string;
};

const accountingTabs = [
  {
    id: "all",
    label: "All accounting records",
    description: "Accounting integrations, exports, invoices, payments, and tax records for this company.",
    filter: () => true,
  },
  {
    id: "tally",
    label: "Tally Prime",
    filter: (record: WorkspaceRecord) => record.category === "Tally Prime",
  },
  {
    id: "xero",
    label: "Xero",
    filter: (record: WorkspaceRecord) => record.category === "Xero",
  },
  {
    id: "quickbooks",
    label: "QuickBooks",
    filter: (record: WorkspaceRecord) => record.category === "QuickBooks",
  },
  {
    id: "invoice-export",
    label: "Invoice export",
    filter: (record: WorkspaceRecord) => record.category === "Invoice export",
  },
  {
    id: "payment-sync",
    label: "Payment sync",
    filter: (record: WorkspaceRecord) => record.category === "Payment sync",
  },
];

export default function AccountingPage() {
  return (
    <WorkspaceRecordsPage
      active="Accounting"
      eyebrow="Accounting exports"
      title="Tally Prime, Xero, and QuickBooks"
      description="Accounting integration records, invoice export records, payment sync data, and Tally export readiness are shown from company data."
      actions={[{ label: "Download Tally XML", downloadPath: "/accounting/tally-export", filename: "tally-export.xml" }]}
      sources={[
        {
          label: "Integrations",
          endpoint: "/integrations",
          map: (data) =>
            (data as Integration[])
              .filter((integration) => ["TALLY_PRIME", "XERO", "QUICKBOOKS"].includes(integration.provider))
              .map((integration) => ({
                id: `integration-${integration.id}`,
                title: formatProvider(integration.provider),
                subtitle: integration.lastError ?? "Accounting connection",
                status: integration.status,
                date: integration.updatedAt ?? integration.createdAt,
                category: formatProvider(integration.provider),
                href: "/dashboard/settings",
                editHref: "/dashboard/settings",
              })),
        },
        {
          label: "Invoices",
          endpoint: "/invoices",
          map: (data) =>
            (data as Invoice[]).map((invoice) => ({
              id: `invoice-${invoice.id}`,
              title: invoice.invoiceNumber,
              subtitle: "Invoice ready for accounting export",
              status: invoice.status,
              amount: invoice.total,
              date: invoice.createdAt,
              category: "Invoice export",
              href: `/invoices/${invoice.id}`,
              editHref: `/invoices/${invoice.id}`,
              pdfPath: `/invoices/${invoice.id}/pdf`,
              pdfFilename: `${invoice.invoiceNumber}.pdf`,
              deletePath: `/invoices/${invoice.id}`,
              deleteLabel: invoice.invoiceNumber,
              details: [{ label: "Tax", value: invoice.totalTax }],
            })),
        },
        {
          label: "Payments",
          endpoint: "/payments",
          map: (data) =>
            (data as Payment[]).map((payment) => ({
              id: `payment-${payment.id}`,
              title: `Payment ${payment.id.slice(0, 8)}`,
              subtitle: `Invoice ${payment.invoiceId.slice(0, 8)}`,
              status: payment.status,
              amount: payment.amount,
              currency: payment.currency,
              date: payment.createdAt,
              category: "Payment sync",
              href: `/invoices/${payment.invoiceId}`,
              editHref: `/invoices/${payment.invoiceId}`,
              pdfFilename: `payment-${payment.id.slice(0, 8)}.pdf`,
              deletePath: `/payments/${payment.id}`,
              deleteLabel: `Payment ${payment.id.slice(0, 8)}`,
            })),
        },
      ]}
      tabs={accountingTabs}
      emptyTitle="No accounting records found"
      emptyDescription="Connect accounting integrations or create invoices and payments to populate this section."
    />
  );
}

function formatProvider(provider: string) {
  const labels: Record<string, string> = {
    TALLY_PRIME: "Tally Prime",
    XERO: "Xero",
    QUICKBOOKS: "QuickBooks",
  };

  return labels[provider] ?? provider.replace(/_/g, " ");
}
