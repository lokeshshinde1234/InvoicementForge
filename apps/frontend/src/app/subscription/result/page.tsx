"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SubscriptionResultPage() {
  return (
    <Suspense>
      <SubscriptionResultContent />
    </Suspense>
  );
}

function SubscriptionResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const plan = searchParams.get("plan") ?? "Selected plan";
  const billing = searchParams.get("billing") ?? "";
  const message = searchParams.get("message");
  const isSuccess = status === "success";

  return (
    <DashboardShell active="Dashboard">
      <main className="grid min-h-[70vh] place-items-center">
        <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-950/10">
          <div
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-2xl font-black ${
              isSuccess ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {isSuccess ? "OK" : "!"}
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
            Subscription payment
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {isSuccess ? "Payment successful" : "Payment not completed"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isSuccess
              ? `${plan.replace(/_/g, " ")} ${billing ? `(${billing.toLowerCase()})` : ""} is active for this company.`
              : message ?? "We could not verify the subscription payment. Please retry checkout or contact support."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800"
            >
              Go to dashboard
            </Link>
            {!isSuccess ? (
              <Link
                href="/dashboard/pricing"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Retry payment
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    </DashboardShell>
  );
}
