"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PortalPaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultShell title="Checking payment status..." />}>
      <PortalPaymentResultContent />
    </Suspense>
  );
}

function PortalPaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const invoiceId = searchParams.get("invoiceId");
  const message = searchParams.get("message");
  const success = status === "success";

  return (
    <PaymentResultShell title={success ? "Your invoice payment is complete." : "We could not complete this payment."}>
        <p
          className={`text-sm font-bold uppercase tracking-wide ${
            success ? "text-teal-700" : "text-rose-700"
          }`}
        >
          Payment {success ? "successful" : "not completed"}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {success
            ? "The invoice has been marked as paid. You can return to the portal to review your documents."
            : message || "Please try again or choose another payment method."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {invoiceId ? (
            <Link
              href={`/portal/invoices/${invoiceId}/pay`}
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View invoice
            </Link>
          ) : null}
          <Link
            href="/portal/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to portal
          </Link>
        </div>
    </PaymentResultShell>
  );
}

function PaymentResultShell({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-4 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-white/80 bg-white p-7 text-center shadow-xl shadow-slate-950/10">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </section>
    </main>
  );
}
