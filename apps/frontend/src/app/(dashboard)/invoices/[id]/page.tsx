"use client";

import { use, useMemo, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/gst";
import { downloadAuthenticatedPdf } from "@/lib/pdf-download";
import {
  CompanyBrandHeader,
  useCompanyBranding,
} from "@/components/branding/CompanyBranding";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxableAmount?: number;
  totalTax?: number;
  total?: number;
};

type InvoiceResponse = {
  id: string;
  invoiceNumber: string;
  status: string;
  clientId: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  totalTax: number;
  total: number;
  dueDate: string;
  notes?: string | null;
};

type PaymentOrder = {
  razorpayOrderId?: string | null;
  keyId?: string | null;
  amount: number;
  currency: string;
};

type SendInvoiceResult = {
  invoiceId: string;
  status: string;
  sent: boolean;
  delivered: boolean;
  deliveryMode: "smtp" | "log";
  clientEmail: string;
};

const PAYABLE_INVOICE_STATUSES = new Set(["SENT", "VIEWED", "OVERDUE"]);

const queryClient = new QueryClient();

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <QueryClientProvider client={queryClient}>
      <InvoiceDetail id={id} />
    </QueryClientProvider>
  );
}

function InvoiceDetail({ id }: { id: string }) {
  const { branding } = useCompanyBranding();
  const [upiId, setUpiId] = useState("merchant@upi");
  const [payeeName, setPayeeName] = useState("InvoiceForge");
  const workspaceCurrency =
    typeof window !== "undefined"
      ? window.localStorage.getItem("workspaceCurrency") || "INR"
      : "INR";

  const invoiceQuery = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const response = await api.get<InvoiceResponse>(`/invoices/${id}`);
      return response.data;
    },
  });

  const createPaymentOrder = useMutation({
    mutationFn: async () => {
      const invoice = invoiceQuery.data;

      if (!invoice) {
        throw new Error("Invoice not loaded");
      }

      const response = await api.post<PaymentOrder>("/payments/create-order", {
        invoiceId: invoice.id,
        amount: Number(invoice.total),
        currency: workspaceCurrency,
      });
      return response.data;
    },
  });

  const sendInvoice = useMutation({
    mutationFn: async () => {
      const response = await api.post<SendInvoiceResult>(`/invoices/${id}/send`);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.setQueryData<InvoiceResponse>(["invoice", id], (current) =>
        current ? { ...current, status: result.status } : current,
      );
      void invoiceQuery.refetch();
    },
  });

  const downloadPdf = useMutation({
    mutationFn: () =>
      downloadAuthenticatedPdf(
        `/invoices/${id}/pdf`,
        `${invoiceQuery.data?.invoiceNumber ?? "invoice"}.pdf`,
      ),
  });

  const upiLink = useMemo(() => {
    const invoice = invoiceQuery.data;

    if (!invoice) {
      return "";
    }

    const params = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      am: Number(invoice.total).toFixed(2),
      cu: workspaceCurrency,
    });

    return `upi://pay?${params.toString()}`;
  }, [invoiceQuery.data, payeeName, upiId]);

  if (invoiceQuery.isLoading) {
    return <PageState message="Loading invoice..." />;
  }

  if (invoiceQuery.isError || !invoiceQuery.data) {
    return <PageState message="Invoice not found or unavailable." />;
  }

  const invoice = invoiceQuery.data;
  const canCreatePaymentOrder = PAYABLE_INVOICE_STATUSES.has(invoice.status);
  const canSendInvoice = invoice.status === "DRAFT";
  const paymentOrderError = readApiMessage(
    createPaymentOrder.error,
    "Razorpay order could not be created. Use the UPI fallback link above or check payment settings.",
  );
  const sendInvoiceError = readApiMessage(
    sendInvoice.error,
    "Invoice could not be sent right now. Please check the client and subscription status.",
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <CompanyBrandHeader branding={branding} subtitle="Invoice document" />
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Invoice
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Status: {invoice.status} · Due:{" "}
              {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              disabled={downloadPdf.isPending}
              onClick={() => downloadPdf.mutate()}
            >
              {downloadPdf.isPending ? "Downloading..." : "Download PDF"}
            </Button>
            {canSendInvoice ? (
              <Button
                variant="outline"
                disabled={sendInvoice.isPending}
                onClick={() => sendInvoice.mutate()}
              >
                {sendInvoice.isPending ? "Sending..." : "Send invoice"}
              </Button>
            ) : null}
            <Button
              disabled={createPaymentOrder.isPending || !canCreatePaymentOrder}
              onClick={() => createPaymentOrder.mutate()}
            >
              {canCreatePaymentOrder ? "Create payment order" : "Send invoice first"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <section className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
              <CardDescription>GST-ready invoice breakdown.</CardDescription>
            </CardHeader>
            <CardContent className="mobile-table-scroll overflow-x-auto">
              <table className="mobile-card-table w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 font-medium">Description</th>
                    <th className="py-3 font-medium">Qty</th>
                    <th className="py-3 font-medium">Rate</th>
                    <th className="py-3 font-medium">GST</th>
                    <th className="py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.lineItems.map((item, index) => (
                    <tr key={`${item.description}-${index}`}>
                      <td data-label="Description" className="py-4 font-medium">{item.description}</td>
                      <td data-label="Qty" className="py-4">{item.quantity}</td>
                      <td data-label="Rate" className="py-4">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td data-label="GST" className="py-4">{item.gstRate}%</td>
                      <td data-label="Total" className="py-4 text-right font-semibold">
                        {formatCurrency(Number(item.total ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
              <CardDescription>Amount payable by the client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={Number(invoice.subtotal)} />
              <SummaryRow label="GST" value={Number(invoice.totalTax)} />
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Grand total</span>
                <span>{formatCurrency(Number(invoice.total))}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UPI payment link</CardTitle>
              <CardDescription>
                Use this fallback when Razorpay keys are not configured.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={upiId} onChange={(event) => setUpiId(event.target.value)} />
              <Input
                value={payeeName}
                onChange={(event) => setPayeeName(event.target.value)}
              />
              <div className="break-all rounded-md bg-slate-100 p-3 text-xs text-slate-700">
                {upiLink}
              </div>
            </CardContent>
          </Card>

          {!canCreatePaymentOrder ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6 text-sm text-amber-800">
                Payment orders can be created after the invoice is sent,
                viewed, or overdue. Current status: {invoice.status}.
                {canSendInvoice ? " Use the Send invoice button above first." : ""}
              </CardContent>
            </Card>
          ) : null}

          {sendInvoice.isSuccess ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6 text-sm text-emerald-800">
                {sendInvoice.data.delivered
                  ? `Invoice sent to ${sendInvoice.data.clientEmail}.`
                  : `Invoice marked as sent. Email delivery is in ${sendInvoice.data.deliveryMode} mode; check backend logs for the client portal link.`}{" "}
                You can now create a payment order for this client.
              </CardContent>
            </Card>
          ) : null}

          {sendInvoice.isError ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6 text-sm text-amber-800">
                {sendInvoiceError}
              </CardContent>
            </Card>
          ) : null}

          {createPaymentOrder.isSuccess ? (
            createPaymentOrder.data?.keyId ? (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle>Payment order ready</CardTitle>
                  <CardDescription>
                    Order {createPaymentOrder.data?.razorpayOrderId}
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle>UPI fallback created</CardTitle>
                  <CardDescription>
                    Razorpay is not configured for this environment. A manual
                    UPI payment record was created — use the UPI link to collect
                    payment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="break-all rounded-md bg-slate-100 p-3 text-xs text-slate-700">
                    {upiLink}
                  </div>
                </CardContent>
              </Card>
            )
          ) : null}

          {createPaymentOrder.isError ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6 text-sm text-amber-800">
                {paymentOrderError}
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function readApiMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const message = (error as { response?: { data?: { message?: unknown } } })
      .response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const firstMessage = message.find(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      );

      if (firstMessage) {
        return firstMessage;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );
}

function PageState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      {message}
    </main>
  );
}
