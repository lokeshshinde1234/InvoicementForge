"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardSubscriptionPlans } from "@/lib/subscription-plans";

export default function DashboardPricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <DashboardShell active="Dashboard">
      <div className="mx-auto max-w-6xl space-y-6 rounded-2xl bg-[linear-gradient(135deg,#fff7ed_0%,#ecfdf5_45%,#eef2ff_100%)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-6">
        <section className="relative overflow-hidden rounded-2xl border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(20,184,166,0.34),transparent_28%),radial-gradient(circle_at_84%_8%,rgba(251,191,36,0.24),transparent_28%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                Company subscription
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Choose the plan that keeps your workspace moving.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Premium proposal, invoice, signature, and payment workflows with clear limits for growing teams.
              </p>
            </div>
            <div className="inline-flex w-fit rounded-lg border border-white/15 bg-white/10 p-1 backdrop-blur">
              {(["monthly", "yearly"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBilling(option)}
                  className={`rounded-md px-4 py-2 text-sm font-black capitalize transition ${
                    billing === option
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {dashboardSubscriptionPlans.map((plan) => {
            const details = plan.cycles[billing];

            return (
              <article
                key={plan.key}
                className={`relative overflow-hidden rounded-2xl border bg-white/90 p-6 shadow-xl shadow-slate-950/10 backdrop-blur ${
                  plan.popular ? "border-teal-300 ring-4 ring-teal-100" : "border-white/80"
                }`}
              >
                <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-amber-100/70" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{plan.name}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p>
                  </div>
                  {plan.popular ? (
                    <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-black text-white shadow-lg shadow-teal-900/20">
                      Popular
                    </span>
                  ) : null}
                </div>

                <div className="relative mt-6 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight">{details.priceLabel}</span>
                  <span className="pb-1 text-sm font-semibold text-slate-500">{details.cadence}</span>
                </div>

                <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
                  <Limit label="Document sends" value={details.sends} />
                  <Limit label="Templates" value={details.templates} />
                  <Limit label="Usage policy" value={details.overage} />
                </div>

                <ul className="relative mt-6 space-y-3 text-sm font-semibold text-slate-700">
                  {details.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-teal-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/subscription/checkout?plan=${plan.key}&billing=${billing}`}
                  className="shine relative mt-7 inline-flex h-11 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800"
                >
                  Continue to payment
                </Link>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-xl shadow-slate-950/10 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black">Need Enterprise?</h2>
              <p className="mt-1 text-sm text-slate-500">
                Private onboarding, custom send limits, SSO planning, and assisted migration.
              </p>
            </div>
            <Link
              href="/dashboard/demo"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm hover:border-slate-950 hover:bg-slate-50"
            >
              Book demo
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
