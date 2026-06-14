"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadPortalPdf } from "@/lib/pdf-download";
import { API_BASE_URL } from "@/lib/config";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate?: number;
  totalTax?: number;
  total?: number;
};

type PortalInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  lineItems: InvoiceLineItem[];
  subtotal: number | string;
  totalTax: number | string;
  total: number | string;
  dueDate: string;
  notes: string | null;
  terms: string | null;
};

type PaymentOrder = {
  paymentId: string;
  invoiceId: string;
  razorpayOrderId: string | null;
  amount: number;
  currency: string;
  keyId: string | null;
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  callback_url?: string;
  redirect?: boolean;
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
};

type RazorpayCheckout = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

type PageParams = {
  params: Promise<{
    id: string;
  }>;
};

export default function ClientInvoicePaymentPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<PortalInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    fetch(`${API_BASE_URL}/portal/invoices/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(body.message || "Invoice unavailable.");
        }

        setInvoice(body as PortalInvoice);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Invoice unavailable.",
        );
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return <PortalLoading label="Loading invoice..." />;
  }

  if (error || !invoice) {
    return <PortalError title="Invoice unavailable" message={error} />;
  }

  const invoicePayable = isInvoicePayable(invoice.status);

  async function downloadPdf() {
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    setDownloadLoading(true);
    setActionMessage("");

    try {
      await downloadPortalPdf({
        path: `/portal/invoices/${id}/pdf`,
        filename: `${invoice?.invoiceNumber ?? "invoice"}.pdf`,
        token,
        baseUrl: API_BASE_URL,
      });
    } catch (requestError) {
      setActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Could not download PDF.",
      );
    } finally {
      setDownloadLoading(false);
    }
  }

  async function startRazorpayPayment() {
    if (!invoice) {
      return;
    }

    const currentInvoice = invoice;
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    setPaymentLoading(true);
    setActionMessage("");

    try {
      const orderResponse = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: currentInvoice.id,
          amount: Number(currentInvoice.total),
          currency: "INR",
        }),
      });
      const orderBody = (await orderResponse.json().catch(() => ({}))) as
        | PaymentOrder
        | { message?: string };

      if (!orderResponse.ok) {
        throw new Error(
          "message" in orderBody
            ? orderBody.message || "Could not create payment order."
            : "Could not create payment order.",
        );
      }

      const order = orderBody as PaymentOrder;

      if (!order.keyId || !order.razorpayOrderId) {
        throw new Error("Razorpay is not configured for this workspace yet.");
      }

      await loadRazorpayCheckout();

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is unavailable. Please try again.");
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: Math.round(Number(order.amount) * 100),
        currency: order.currency,
        name: "InvoiceForge",
        description: `Payment for invoice ${currentInvoice.invoiceNumber}`,
        order_id: order.razorpayOrderId,
        callback_url: `${API_BASE_URL}/payments/razorpay/callback`,
        redirect: true,
        handler: async (response) => {
          try {
            setPaymentLoading(true);
            setActionMessage("Verifying payment...");

            const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyBody = await verifyResponse.json().catch(() => ({}));

            if (!verifyResponse.ok) {
              throw new Error(
                verifyBody.message || "Payment verification failed.",
              );
            }

            setInvoice((currentInvoice) =>
              currentInvoice
                ? { ...currentInvoice, status: "PAID" }
                : currentInvoice,
            );
            setActionMessage("Payment completed successfully.");
          } catch (requestError) {
            setActionMessage(
              requestError instanceof Error
                ? requestError.message
                : "Payment verification failed.",
            );
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            setActionMessage("Payment was cancelled before completion.");
          },
        },
        theme: {
          color: "#0f766e",
        },
      });

      checkout.open();
    } catch (requestError) {
      setActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Could not start Razorpay payment.",
      );
      setPaymentLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f2efe8] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.92),rgba(238,246,255,0.72)_44%,rgba(235,248,244,0.78)),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:auto,42px_42px,42px_42px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <Link href="/portal/dashboard" className="inline-flex rounded-md bg-white/75 px-3 py-2 text-sm font-semibold text-teal-800 shadow-sm ring-1 ring-white/80">
            Back to portal
          </Link>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloadLoading}
            className="inline-flex rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {downloadLoading ? "Downloading..." : "Download PDF"}
          </button>
        </div>

        <header className="mt-4 overflow-hidden rounded-lg border border-white/80 bg-white shadow-2xl shadow-slate-950/10">
          <div className="bg-slate-950 px-4 py-5 text-white sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-wide text-teal-200">
                Invoice review
              </p>
              <span className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1 ring-white/20">
                {invoice.status}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="px-4 pb-5 sm:px-6 sm:pb-6">
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-4xl">
                {invoice.invoiceNumber}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Review invoice line items, tax, terms, and due date before
                choosing a payment method.
              </p>
            </div>
            <div className="mx-4 mb-5 rounded-md bg-blue-50 px-4 py-3 text-blue-950 ring-1 ring-blue-100 sm:mx-6 sm:mb-6 lg:mx-6">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Amount due
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(invoice.total)}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-xl shadow-slate-950/10">
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-teal-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Invoice items</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Status: <span className="font-semibold text-teal-700">{invoice.status}</span>
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Due {formatDate(invoice.dueDate)}
                </p>
              </div>

              <div className="m-3 overflow-hidden rounded-md border border-slate-200 sm:m-5">
                <div className="grid grid-cols-[minmax(0,1fr)_48px_88px] bg-slate-950 px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-white sm:grid-cols-[1fr_80px_120px] sm:px-4 sm:text-xs">
                  <span>Description</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                {invoice.lineItems.map((item, index) => (
                  <div
                    key={`${item.description}-${index}`}
                    className="grid grid-cols-[minmax(0,1fr)_48px_88px] gap-1 border-t border-slate-200 bg-white px-3 py-3 text-xs sm:grid-cols-[1fr_80px_120px] sm:px-4 sm:text-sm"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">{item.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Rate {formatCurrency(item.unitPrice)} | GST {Number(item.gstRate ?? 0)}%
                      </p>
                    </div>
                    <p className="text-right font-medium">{item.quantity}</p>
                    <p className="text-right font-semibold">
                      {formatCurrency(item.total ?? Number(item.quantity) * Number(item.unitPrice))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mx-5 mb-5 grid gap-3 rounded-md bg-slate-50 p-4 sm:ml-auto sm:max-w-sm">
                <TotalRow label="Subtotal" value={invoice.subtotal} />
                <TotalRow label="Tax" value={invoice.totalTax} />
                <TotalRow label="Total" value={invoice.total} strong />
              </div>
            </section>

            {invoice.notes || invoice.terms ? (
              <section className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-xl shadow-slate-950/10">
                <div className="border-b border-slate-200 bg-[#fff8ec] px-5 py-4">
                  <h2 className="text-lg font-semibold">Notes and terms</h2>
                </div>
                <div className="p-5">
                {invoice.notes ? (
                  <p className="mt-3 text-sm leading-7 text-slate-600">{invoice.notes}</p>
                ) : null}
                {invoice.terms ? (
                  <p className="mt-3 text-sm leading-7 text-slate-600">{invoice.terms}</p>
                ) : null}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="h-fit overflow-hidden rounded-lg border border-white/80 bg-white shadow-2xl shadow-slate-950/10">
            <div className="bg-blue-700 px-5 py-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                Payment actions
              </p>
              <p className="mt-2 text-lg font-semibold">
                {formatCurrency(invoice.total)}
              </p>
            </div>
            <div className="p-5">
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={startRazorpayPayment}
                disabled={paymentLoading || !invoicePayable}
                className="h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {paymentLoading
                  ? "Opening Razorpay..."
                  : invoice.status === "PAID"
                    ? "Payment completed"
                    : !invoicePayable
                      ? "Payment unavailable"
                    : "Pay with Razorpay"}
              </button>
              {["UPI", "PayU"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setActionMessage(`${method} selected. Connect the payment provider to complete live collection.`)}
                  className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:bg-teal-50"
                >
                  {method}
                </button>
              ))}
            </div>
            {actionMessage ? (
              <p className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-6 text-teal-800">
                {actionMessage}
              </p>
            ) : null}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number | string;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-lg font-semibold" : "text-sm"}`}>
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-950">{formatCurrency(value)}</span>
    </div>
  );
}

function PortalLoading({ label }: { label: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-4 text-slate-950">
      <div className="rounded-lg border border-white/80 bg-white/85 px-5 py-4 text-sm font-semibold shadow-xl shadow-slate-950/10">
        {label}
      </div>
    </main>
  );
}

function PortalError({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-4 text-slate-950">
      <div className="max-w-md rounded-lg border border-white/80 bg-white p-7 text-center shadow-xl shadow-slate-950/10">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {message || "Please return to the portal dashboard."}
        </p>
        <Link
          href="/portal/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to portal
        </Link>
      </div>
    </main>
  );
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isInvoicePayable(status: string) {
  return ["SENT", "VIEWED", "OVERDUE"].includes(status.toUpperCase());
}

function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Could not load Razorpay checkout.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });
}
