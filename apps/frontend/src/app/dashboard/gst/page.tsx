"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/RecentDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/gst";
import { downloadAuthenticatedPdf } from "@/lib/pdf-download";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  hsnCode?: string;
  sacCode?: string;
  gstRate: number;
  tdsRate?: number;
  tcsRate?: number;
  taxableAmount?: number;
  totalTax?: number;
  total?: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  clientId: string;
  lineItems: InvoiceLineItem[];
  subtotal: number | string;
  totalTax: number | string;
  total: number | string;
  dueDate: string;
  notes?: string | null;
  terms?: string | null;
  createdAt: string;
};

type GstCorrectionRequest = {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  requestedAt: string;
  message: string;
};

type GstReport = {
  id: string;
  type: string;
  period: string;
  status: string;
  summary?: Record<string, unknown>;
  rows?: Array<Record<string, unknown>>;
  createdAt: string;
};

type GstTab = "tax" | "gstr1" | "gstr3b" | "gstr2a" | "tds" | "hsn";

const queryClient = new QueryClient();

const tabs: Array<{ id: GstTab; label: string; description: string }> = [
  {
    id: "tax",
    label: "Tax detection",
    description: "Review invoice tax type, GST rate, taxable value, and detected tax amount.",
  },
  {
    id: "gstr1",
    label: "GSTR-1",
    description: "Generate and manage outward supply report shells for company invoices.",
  },
  {
    id: "gstr3b",
    label: "GSTR-3B",
    description: "Generate monthly GST summary records from company billing data.",
  },
  {
    id: "gstr2a",
    label: "GSTR-2A reconciliation",
    description: "Track purchase-side reconciliation shells and client/vendor mismatch notes.",
  },
  {
    id: "tds",
    label: "TDS/TCS",
    description: "Manage TDS and TCS rates stored on invoice line items.",
  },
  {
    id: "hsn",
    label: "HSN/SAC",
    description: "Manage HSN and SAC codes stored on invoice line items.",
  },
];

const reportTypes = [
  { value: "GSTR_1", label: "GSTR-1" },
  { value: "GSTR_3B", label: "GSTR-3B" },
  { value: "GSTR_2A_RECONCILIATION", label: "GSTR-2A reconciliation" },
];

export default function GstDashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <GstWorkspace />
    </QueryClientProvider>
  );
}

function GstWorkspace() {
  const [activeTab, setActiveTab] = useState<GstTab>("tax");
  const [reportType, setReportType] = useState("GSTR_1");
  const [period, setPeriod] = useState(currentPeriod());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  const invoicesQuery = useQuery({
    queryKey: ["gst-invoices"],
    queryFn: async () => (await api.get<Invoice[]>("/invoices")).data,
  });
  const reportsQuery = useQuery({
    queryKey: ["gst-reports"],
    queryFn: async () => (await api.get<GstReport[]>("/gst/reports")).data,
  });

  const selectedInvoice = useMemo(
    () => invoicesQuery.data?.find((invoice) => invoice.id === selectedInvoiceId),
    [invoicesQuery.data, selectedInvoiceId],
  );

  const generateReport = useMutation({
    mutationFn: async () =>
      api.post<GstReport>("/gst/reports", {
        type: reportType,
        period,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData<GstReport[]>(["gst-reports"], (current = []) => [
        response.data,
        ...current.filter((report) => report.id !== response.data.id),
      ]);
      void reportsQuery.refetch();
    },
  });

  const updateInvoiceTax = useMutation({
    mutationFn: async () => {
      if (!selectedInvoice) {
        throw new Error("Select an invoice first.");
      }

      return api.patch(`/invoices/${selectedInvoice.id}`, {
        clientId: selectedInvoice.clientId,
        status: selectedInvoice.status,
        dueDate: selectedInvoice.dueDate,
        notes: selectedInvoice.notes,
        terms: selectedInvoice.terms,
        lineItems,
      });
    },
    onSuccess: () => invoicesQuery.refetch(),
  });
  const deleteInvoice = useMutation({
    mutationFn: async (invoice: Invoice) => api.delete(`/invoices/${invoice.id}`),
    onSuccess: () => {
      setSelectedInvoiceId("");
      setLineItems([]);
      void invoicesQuery.refetch();
      void reportsQuery.refetch();
    },
  });

  function loadInvoiceForEditing(invoiceId: string) {
    setSelectedInvoiceId(invoiceId);
    const invoice = invoicesQuery.data?.find((item) => item.id === invoiceId);
    setLineItems(invoice?.lineItems ?? []);
  }

  const invoices = invoicesQuery.data ?? [];
  const correctionRequests = useMemo(
    () => extractGstCorrectionRequests(invoices),
    [invoices],
  );
  const reports = reportsQuery.data ?? [];
  const activeReports = reports.filter((report) => report.type === reportTypeForTab(activeTab));
  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <DashboardShell active="GST">
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Indian GST
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            GST forms and tax workspace
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Company users can generate GSTR forms, manage HSN/SAC, update TDS/TCS,
            and review GST tax detection from invoice records.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Invoices" value={String(invoices.length)} />
          <Metric label="GST reports" value={String(reports.length)} />
          <Metric label="HSN/SAC lines" value={String(countCodeLines(invoices))} />
          <Metric label="Correction requests" value={String(correctionRequests.length)} />
        </section>

        <GstCorrectionRequests
          requests={correctionRequests}
          onOpenInvoice={loadInvoiceForEditing}
        />

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (["gstr1", "gstr3b", "gstr2a"].includes(tab.id)) {
                    setReportType(reportTypeForTab(tab.id));
                  }
                }}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${
                  tab.id === activeTab
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">{activeTabConfig.description}</p>
        </section>

        {["gstr1", "gstr3b", "gstr2a"].includes(activeTab) ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
            <form
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                generateReport.mutate();
              }}
            >
              <h2 className="text-base font-semibold">Generate GST form</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a company GST report shell for the selected period.
              </p>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  GST form
                  <Select
                    value={reportType}
                    options={reportTypes}
                    onChange={(event) => {
                      setReportType(event.target.value);
                      setActiveTab(tabForReportType(event.target.value));
                    }}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Period
                  <Input value={period} onChange={(event) => setPeriod(event.target.value)} />
                </label>
                <Button type="submit" disabled={generateReport.isPending}>
                  {generateReport.isPending ? "Generating..." : "Generate form"}
                </Button>
              </div>
            </form>
            <ReportList reports={activeReports} onRefresh={() => reportsQuery.refetch()} />
          </section>
        ) : null}

        {["tax", "tds", "hsn"].includes(activeTab) ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">Manage invoice GST fields</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select an invoice, update HSN/SAC/TDS/TCS/GST fields, then save.
              </p>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Invoice
                  <Select
                    value={selectedInvoiceId}
                    options={[
                      { value: "", label: "Select invoice" },
                      ...invoices.map((invoice) => ({
                        value: invoice.id,
                        label: invoice.invoiceNumber,
                      })),
                    ]}
                    onChange={(event) => loadInvoiceForEditing(event.target.value)}
                  />
                </label>
                {lineItems.length ? (
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <TaxLineEditor
                        key={`${item.description}-${index}`}
                        item={item}
                        index={index}
                        onChange={(nextItem) =>
                          setLineItems((current) =>
                            current.map((existing, itemIndex) =>
                              itemIndex === index ? nextItem : existing,
                            ),
                          )
                        }
                      />
                    ))}
                    <Button
                      type="button"
                      disabled={updateInvoiceTax.isPending}
                      onClick={() => updateInvoiceTax.mutate()}
                    >
                      {updateInvoiceTax.isPending ? "Saving..." : "Save GST fields"}
                    </Button>
                    {updateInvoiceTax.isSuccess ? (
                      <p className="text-sm font-medium text-teal-700">
                        GST fields updated.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <EmptyState
                    title="Select an invoice"
                    description="Invoice line items will appear here for GST field editing."
                  />
                )}
              </div>
            </section>
            <TaxRecords
              activeTab={activeTab}
              invoices={invoices}
              deletingInvoiceId={deleteInvoice.variables?.id ?? null}
              onDeleteInvoice={(invoice) => {
                const confirmed = window.confirm(
                  `Delete invoice ${invoice.invoiceNumber}? This removes its GST records too.`,
                );

                if (confirmed) {
                  deleteInvoice.mutate(invoice);
                }
              }}
            />
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function GstCorrectionRequests({
  requests,
  onOpenInvoice,
}: {
  requests: GstCorrectionRequest[];
  onOpenInvoice: (invoiceId: string) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Client GST correction requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Requests sent from the client portal appear here for company review.
          </p>
        </div>
        <span className="rounded-md bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-teal-700">
          {requests.length} open
        </span>
      </div>
      {requests.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No correction requests"
            description="Client GST correction requests will appear here after they are sent from the client portal."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {requests.map((request) => (
            <div
              key={`${request.invoiceId}-${request.requestedAt}-${request.message}`}
              className="grid gap-3 px-5 py-4 lg:grid-cols-[180px_1fr_auto] lg:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {request.invoiceNumber}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatCorrectionDate(request.requestedAt)}
                </p>
              </div>
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                {request.message}
              </p>
              <button
                type="button"
                onClick={() => onOpenInvoice(request.invoiceId)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-teal-600"
              >
                Open invoice GST
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TaxLineEditor({
  item,
  index,
  onChange,
}: {
  item: InvoiceLineItem;
  index: number;
  onChange: (item: InvoiceLineItem) => void;
}) {
  function update(field: keyof InvoiceLineItem, value: string) {
    onChange({
      ...item,
      [field]: ["gstRate", "tdsRate", "tcsRate"].includes(field)
        ? Number(value)
        : value,
    });
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold">
        Line {index + 1}: {item.description || "Untitled item"}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="HSN" value={item.hsnCode ?? ""} onChange={(value) => update("hsnCode", value)} />
        <Field label="SAC" value={item.sacCode ?? ""} onChange={(value) => update("sacCode", value)} />
        <Field label="GST %" value={String(item.gstRate ?? 0)} type="number" onChange={(value) => update("gstRate", value)} />
        <Field label="TDS %" value={String(item.tdsRate ?? 0)} type="number" onChange={(value) => update("tdsRate", value)} />
        <Field label="TCS %" value={String(item.tcsRate ?? 0)} type="number" onChange={(value) => update("tcsRate", value)} />
      </div>
    </div>
  );
}

function TaxRecords({
  activeTab,
  invoices,
  deletingInvoiceId,
  onDeleteInvoice,
}: {
  activeTab: GstTab;
  invoices: Invoice[];
  deletingInvoiceId: string | null;
  onDeleteInvoice: (invoice: Invoice) => void;
}) {
  const rows = invoices.flatMap((invoice) =>
    invoice.lineItems
      .filter((item) => {
        if (activeTab === "hsn") return item.hsnCode || item.sacCode;
        if (activeTab === "tds") return item.tdsRate || item.tcsRate;
        return true;
      })
      .map((item, index) => ({ invoice, item, index })),
  );

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold">GST records</h2>
        <p className="mt-1 text-sm text-slate-500">
          Records are read directly from company invoice line items.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No GST records found"
            description="Create invoices or fill GST fields to populate this table."
          />
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">HSN/SAC</th>
                <th className="px-5 py-3">GST</th>
                <th className="px-5 py-3">TDS/TCS</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ invoice, item, index }) => (
                <tr key={`${invoice.id}-${index}`} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-semibold text-slate-950 hover:text-teal-700"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{invoice.status}</p>
                  </td>
                  <td className="px-5 py-4">{item.description || "Untitled item"}</td>
                  <td className="px-5 py-4">
                    HSN {item.hsnCode || "-"} / SAC {item.sacCode || "-"}
                  </td>
                  <td className="px-5 py-4">{item.gstRate ?? 0}%</td>
                  <td className="px-5 py-4">
                    TDS {item.tdsRate ?? 0}% / TCS {item.tcsRate ?? 0}%
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">
                    {formatCurrency(Number(item.total ?? invoice.total))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          downloadAuthenticatedPdf(
                            `/invoices/${invoice.id}/pdf`,
                            `${invoice.invoiceNumber}.pdf`,
                          )
                        }
                        className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteInvoice(invoice)}
                        disabled={deletingInvoiceId === invoice.id}
                        className="h-9 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingInvoiceId === invoice.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ReportList({
  reports,
  onRefresh,
}: {
  reports: GstReport[];
  onRefresh: () => void;
}) {
  const [openReport, setOpenReport] = useState<GstReport | null>(null);
  const updateReport = useMutation({
    mutationFn: async ({
      report,
      status,
    }: {
      report: GstReport;
      status: "READY" | "FILED";
    }) => api.patch(`/gst/reports/${report.id}`, { status }),
    onSuccess: () => onRefresh(),
  });
  const deleteReport = useMutation({
    mutationFn: async (report: GstReport) => api.delete(`/gst/reports/${report.id}`),
    onSuccess: () => onRefresh(),
  });

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold">Generated forms</h2>
        <p className="mt-1 text-sm text-slate-500">
          Company-generated GST form shells and filing records.
        </p>
      </div>
      {reports.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No generated forms"
            description="Use the form on the left to generate this GST report."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {reports.map((report) => (
            <div key={report.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{formatReportType(report.type)}</p>
                <p className="mt-1 text-sm text-slate-500">Period {report.period}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={report.status} />
                <button
                  type="button"
                  onClick={() => setOpenReport(report)}
                  className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => printGstReport(report)}
                  className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateReport.mutate({
                      report,
                      status: report.status === "FILED" ? "READY" : "FILED",
                    })
                  }
                  disabled={updateReport.isPending || deleteReport.isPending}
                  className="h-9 rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                >
                  {report.status === "FILED" ? "Mark ready" : "Mark filed"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteReport.mutate(report)}
                  disabled={updateReport.isPending || deleteReport.isPending}
                  className="h-9 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {openReport ? (
        <div className="border-t border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                {formatReportType(openReport.type)} form details
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Period {openReport.period} · {openReport.status}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenReport(null)}
              className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-white"
            >
              Close
            </button>
          </div>
          <GstReportDetail report={openReport} />
        </div>
      ) : null}
    </section>
  );
}

function GstReportDetail({ report }: { report: GstReport }) {
  const summary = report.summary ?? {};
  const company = recordValue(summary.company);
  const totals = recordValue(summary.totals);
  const counts = recordValue(summary.counts);
  const rows = report.rows ?? [];
  const taxBreakup = arrayValue(summary.taxBreakup);
  const hsnSummary = arrayValue(summary.hsnSummary);
  const reconciliation = recordValue(summary.reconciliation);

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DetailBox label="Company" value={String(company.legalName ?? company.name ?? "Company")} />
          <DetailBox label="Company GSTIN" value={String(company.gstin ?? "Not added")} />
          <DetailBox label="State" value={String(company.state ?? "Not added")} />
          <DetailBox label="Currency" value={String(company.currency ?? "INR")} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricBox label="Invoices" value={String(counts.invoices ?? rows.length)} />
        <MetricBox label="Taxable value" value={moneyValue(totals.taxableValue, company.currency)} />
        <MetricBox label="Total GST" value={moneyValue(totals.totalTax, company.currency)} />
        <MetricBox label="Invoice value" value={moneyValue(totals.invoiceValue, company.currency)} />
      </div>

      <ReportTable
        title="Tax breakup"
        columns={["GST %", "Taxable value", "CGST", "SGST", "IGST", "Total tax"]}
        rows={taxBreakup.map((item) => [
          `${numberValue(item.gstRate)}%`,
          moneyValue(item.taxableValue, company.currency),
          moneyValue(item.cgst, company.currency),
          moneyValue(item.sgst, company.currency),
          moneyValue(item.igst, company.currency),
          moneyValue(item.totalTax, company.currency),
        ])}
        empty="No tax breakup available for this period."
      />

      {report.type === "GSTR_2A_RECONCILIATION" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricBox label="Matched rows" value={String(reconciliation.matchedRows ?? 0)} />
          <MetricBox label="Mismatch rows" value={String(reconciliation.mismatchRows ?? 0)} />
          <MetricBox label="Review required" value={String(reconciliation.reviewRequired ?? 0)} />
          <MetricBox label="Difference" value={moneyValue(reconciliation.totalDifference, company.currency)} />
        </div>
      ) : null}

      <ReportTable
        title="HSN/SAC summary"
        columns={["Code", "Description", "Taxable value", "Total tax", "Invoice value"]}
        rows={hsnSummary.map((item) => [
          String(item.code ?? "-"),
          String(item.description ?? "-"),
          moneyValue(item.taxableValue, company.currency),
          moneyValue(item.totalTax, company.currency),
          moneyValue(item.invoiceValue, company.currency),
        ])}
        empty="No HSN/SAC records available for this period."
      />

      <ReportTable
        title="Invoice register"
        columns={[
          "Invoice",
          "Date",
          "Client",
          "GSTIN",
          "Supply",
          "Taxable",
          "GST",
          "Value",
          "Status",
        ]}
        rows={rows.map((row) => [
          String(row.invoiceNumber ?? "-"),
          String(row.invoiceDate ?? "-"),
          String(row.clientName ?? "-"),
          String(row.gstin ?? "URP"),
          String(row.placeOfSupply ?? "-"),
          moneyValue(row.taxableValue, company.currency),
          moneyValue(row.totalTax, company.currency),
          moneyValue(row.invoiceValue, company.currency),
          String(row.reconciliationStatus ?? row.status ?? "-"),
        ])}
        empty="No invoice rows were found for this period."
      />
    </div>
  );
}

function ReportTable({
  title,
  columns,
  rows,
  empty,
}: {
  title: string;
  columns: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`} className="hover:bg-slate-50">
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${rowIndex}-${cellIndex}`} className="px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{label}</p>
      <p className="mt-2 text-lg font-semibold text-teal-950">{value}</p>
    </div>
  );
}

function printGstReport(report: GstReport) {
  const popup = window.open("", "_blank", "width=880,height=680");

  if (!popup) {
    window.print();
    return;
  }

  const summary = report.summary ?? {};
  const company = recordValue(summary.company);
  const totals = recordValue(summary.totals);
  const counts = recordValue(summary.counts);
  const reportRows = report.rows ?? [];
  const taxBreakup = arrayValue(summary.taxBreakup);
  const hsnSummary = arrayValue(summary.hsnSummary);
  const sections = arrayValue(summary.sections).map((section) => String(section.value ?? section));
  const currency = company.currency;

  popup.document.write(`
    <html>
      <head>
        <title>${escapeHtml(formatReportType(report.type))} ${escapeHtml(report.period)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; background: #f8fafc; }
          .page { background: #fff; border: 1px solid #cbd5e1; padding: 28px; }
          .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #0f766e; padding-bottom: 18px; }
          .brand { font-size: 12px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: .12em; }
          h1 { font-size: 24px; margin: 8px 0 4px; }
          h2 { font-size: 15px; margin: 24px 0 10px; color: #0f172a; }
          p { margin: 0; }
          .muted { color: #64748b; font-size: 12px; line-height: 1.5; }
          .stamp { border: 1px solid #99f6e4; background: #f0fdfa; color: #134e4a; padding: 10px 12px; min-width: 190px; font-size: 12px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
          .box { border: 1px solid #e2e8f0; background: #f8fafc; padding: 10px; min-height: 62px; }
          .label { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
          .value { margin-top: 6px; font-size: 13px; font-weight: 700; }
          .section-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }
          .section-list div { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; background: #f8fafc; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; background: #fff; }
          th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; }
          th { background: #ecfdf5; color: #134e4a; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
          .right { text-align: right; }
          .footer { margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 11px; color: #64748b; line-height: 1.5; }
          @media print {
            body { background: #fff; padding: 0; }
            .page { border: 0; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <div class="header">
            <div>
              <p class="brand">InvoiceForge GST return</p>
              <h1>${escapeHtml(formatReportType(report.type))}</h1>
              <p class="muted">Period ${escapeHtml(String(summary.periodLabel ?? report.period))} | Status ${escapeHtml(report.status)}</p>
            </div>
            <div class="stamp">
              <strong>${escapeHtml(String(company.legalName ?? company.name ?? "Company"))}</strong><br />
              GSTIN: ${escapeHtml(String(company.gstin ?? "Not added"))}<br />
              State: ${escapeHtml(String(company.state ?? "Not added"))}<br />
              Generated: ${escapeHtml(new Date(report.createdAt).toLocaleString())}
            </div>
          </div>

          <div class="grid">
            ${pdfBox("Invoices", String(counts.invoices ?? reportRows.length))}
            ${pdfBox("Taxable value", moneyValue(totals.taxableValue, currency))}
            ${pdfBox("Total GST", moneyValue(totals.totalTax, currency))}
            ${pdfBox("Invoice value", moneyValue(totals.invoiceValue, currency))}
          </div>

          <h2>Return sections covered</h2>
          <div class="section-list">
            ${(sections.length ? sections : ["No return sections available"])
              .map((section) => `<div>${escapeHtml(section)}</div>`)
              .join("")}
          </div>

          <h2>Tax breakup</h2>
          ${pdfTable(
            ["GST %", "Taxable value", "CGST", "SGST", "IGST", "Total tax"],
            taxBreakup.map((item) => [
              `${numberValue(item.gstRate)}%`,
              moneyValue(item.taxableValue, currency),
              moneyValue(item.cgst, currency),
              moneyValue(item.sgst, currency),
              moneyValue(item.igst, currency),
              moneyValue(item.totalTax, currency),
            ]),
          )}

          <h2>HSN/SAC summary</h2>
          ${pdfTable(
            ["Code", "Description", "Taxable value", "Total tax", "Invoice value"],
            hsnSummary.map((item) => [
              String(item.code ?? "-"),
              String(item.description ?? "-"),
              moneyValue(item.taxableValue, currency),
              moneyValue(item.totalTax, currency),
              moneyValue(item.invoiceValue, currency),
            ]),
          )}

          <h2>Invoice register</h2>
          ${pdfTable(
            ["Invoice", "Date", "Client", "GSTIN", "Supply", "Taxable", "GST", "Value", "Status"],
            reportRows.map((row) => [
              String(row.invoiceNumber ?? "-"),
              String(row.invoiceDate ?? "-"),
              String(row.clientName ?? "-"),
              String(row.gstin ?? "URP"),
              String(row.placeOfSupply ?? "-"),
              moneyValue(row.taxableValue, currency),
              moneyValue(row.totalTax, currency),
              moneyValue(row.invoiceValue, currency),
              String(row.reconciliationStatus ?? row.status ?? "-"),
            ]),
          )}

          <p class="footer">
            ${escapeHtml(String(summary.note ?? "Generated from company GST records."))}
            This report is prepared from InvoiceForge company invoice records for internal review and filing preparation.
          </p>
        </main>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function reportTypeForTab(tab: GstTab) {
  if (tab === "gstr1") return "GSTR_1";
  if (tab === "gstr3b") return "GSTR_3B";
  if (tab === "gstr2a") return "GSTR_2A_RECONCILIATION";
  return "GSTR_1";
}

function tabForReportType(type: string): GstTab {
  if (type === "GSTR_3B") return "gstr3b";
  if (type === "GSTR_2A_RECONCILIATION") return "gstr2a";
  return "gstr1";
}

function formatReportType(type: string) {
  return reportTypes.find((reportType) => reportType.value === type)?.label ?? type;
}

function countCodeLines(invoices: Invoice[]) {
  return invoices.reduce(
    (count, invoice) =>
      count + invoice.lineItems.filter((item) => item.hsnCode || item.sacCode).length,
    0,
  );
}

function countDeductionLines(invoices: Invoice[]) {
  return invoices.reduce(
    (count, invoice) =>
      count + invoice.lineItems.filter((item) => item.tdsRate || item.tcsRate).length,
    0,
  );
}

function extractGstCorrectionRequests(invoices: Invoice[]): GstCorrectionRequest[] {
  return invoices.flatMap((invoice) => {
    const notes = invoice.notes ?? "";
    const entries = notes
      .split(/\n{2,}/)
      .map((entry) => entry.trim())
      .filter((entry) => /Client GST correction request:/i.test(entry));

    return entries.map((entry) => {
      const requestedAt = entry.match(/^\[([^\]]+)\]/u)?.[1] ?? invoice.createdAt;
      const message = entry
        .replace(/^\[[^\]]+\]\s*/u, "")
        .replace(/^Client GST correction request:\s*/iu, "")
        .trim();

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        requestedAt,
        message,
      };
    });
  }).sort(
    (a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  );
}

function formatCorrectionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function reportValue(
  summary: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
) {
  const value = summary?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function arrayValue(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) =>
    typeof item === "object" && item !== null
      ? (item as Record<string, unknown>)
      : { value: item },
  );
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyValue(value: unknown, currency: unknown = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: typeof currency === "string" && currency.length === 3 ? currency : "INR",
    maximumFractionDigits: 2,
  }).format(numberValue(value));
}

function pdfBox(label: string, value: string) {
  return `
    <div class="box">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>
  `;
}

function pdfTable(columns: string[], rows: string[][]) {
  if (rows.length === 0) {
    return '<p class="muted">No records available for this section.</p>';
  }

  return `
    <table>
      <thead>
        <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
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
