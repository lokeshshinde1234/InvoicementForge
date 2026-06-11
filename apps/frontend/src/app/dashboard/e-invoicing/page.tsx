"use client";

import {
  WorkspaceRecordsPage,
  type WorkspaceRecord,
} from "@/components/dashboard/WorkspaceRecordsPage";

type EInvoiceRecord = {
  id: string;
  invoiceId: string;
  status: string;
  irn?: string | null;
  qrCode?: string | null;
  validationResult?: Record<string, unknown>;
  updatedAt: string;
  createdAt: string;
};

const eInvoiceTabs = [
  {
    id: "validation",
    label: "Invoice validation",
    filter: (record: WorkspaceRecord) => record.category === "Invoice validation",
  },
  {
    id: "irn",
    label: "IRN generation",
    filter: (record: WorkspaceRecord) => record.category === "IRN generation",
  },
  {
    id: "qr",
    label: "QR code",
    filter: (record: WorkspaceRecord) => record.category === "QR code",
  },
  {
    id: "audit",
    label: "Audit trail",
    filter: (record: WorkspaceRecord) => record.category === "Audit trail",
  },
];

export default function EInvoicingPage() {
  return (
    <WorkspaceRecordsPage
      active="E-Invoicing"
      eyebrow="NIC e-invoicing"
      title="IRN, QR code, and validation"
      description="Invoice validation, IRN generation, QR code, and audit trail records are grouped inside the NIC E-Invoicing section."
      sources={[
        {
          label: "E-Invoices",
          endpoint: "/gst/e-invoices",
          map: (data) =>
            (data as EInvoiceRecord[]).flatMap((record) => [
              {
                id: `validation-${record.id}`,
                title: `Invoice ${record.invoiceId.slice(0, 8)}`,
                subtitle: validationNote(record),
                status: record.status,
                date: record.updatedAt ?? record.createdAt,
                category: "Invoice validation",
                href: `/invoices/${record.invoiceId}`,
                pdfPath: `/invoices/${record.invoiceId}/pdf`,
                pdfFilename: `invoice-${record.invoiceId.slice(0, 8)}.pdf`,
              },
              {
                id: `irn-${record.id}`,
                title: record.irn ?? `Invoice ${record.invoiceId.slice(0, 8)}`,
                subtitle: "IRN generation",
                status: record.irn ? "IRN_GENERATED" : record.status,
                date: record.updatedAt ?? record.createdAt,
                category: "IRN generation",
                href: `/invoices/${record.invoiceId}`,
                pdfPath: `/invoices/${record.invoiceId}/pdf`,
                pdfFilename: `invoice-${record.invoiceId.slice(0, 8)}.pdf`,
              },
              {
                id: `qr-${record.id}`,
                title: record.qrCode ? "QR code available" : "QR code pending",
                subtitle: record.qrCode ?? `Invoice ${record.invoiceId.slice(0, 8)}`,
                status: record.qrCode ? "READY" : "PENDING",
                date: record.updatedAt ?? record.createdAt,
                category: "QR code",
                href: `/invoices/${record.invoiceId}`,
                pdfPath: `/invoices/${record.invoiceId}/pdf`,
                pdfFilename: `invoice-${record.invoiceId.slice(0, 8)}.pdf`,
              },
              {
                id: `audit-${record.id}`,
                title: `Audit for invoice ${record.invoiceId.slice(0, 8)}`,
                subtitle: `Created ${new Date(record.createdAt).toLocaleString()}`,
                status: record.status,
                date: record.updatedAt ?? record.createdAt,
                category: "Audit trail",
                href: `/invoices/${record.invoiceId}`,
                pdfPath: `/invoices/${record.invoiceId}/pdf`,
                pdfFilename: `invoice-${record.invoiceId.slice(0, 8)}.pdf`,
              },
            ]),
        },
      ]}
      tabs={eInvoiceTabs}
      emptyTitle="No e-invoicing records found"
      emptyDescription="Validate invoices or generate IRNs to populate NIC e-invoicing records."
    />
  );
}

function validationNote(record: EInvoiceRecord) {
  const note = record.validationResult?.note;

  return typeof note === "string" ? note : "Local NIC validation record";
}
