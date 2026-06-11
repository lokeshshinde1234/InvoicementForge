"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { useMarketingContent } from "@/lib/marketing-content";

const lanes = [
  ["Payments", "Razorpay-ready checkout, payment records, invoice payment links, and manual UPI fallback paths."],
  ["Accounting", "GST reports, invoice records, khata entries, and export-friendly document history."],
  ["Sales workflow", "Proposal templates, client records, approvals, and portal delivery connected in one flow."],
] as const;

export default function IntegrationsPage() {
  const { content } = useMarketingContent();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="brand-grid border-b border-slate-200 bg-[linear-gradient(135deg,#eef2ff_0%,#ecfdf5_52%,#fff7ed_100%)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Integrations</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Connect the systems around every signed deal.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Bring payments, accounting, compliance, and sales handoff closer to the proposal workspace your team already uses.
            </p>
            <Link href="/demo" className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-700">
              Plan integration setup
            </Link>
          </div>
          <div className="grid gap-4">
            {lanes.map(([title, copy]) => (
              <article key={title} className="rounded-lg border border-white/80 bg-white/85 p-5 shadow-xl shadow-slate-950/10 backdrop-blur">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Integration catalog</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Gateway, finance, and workflow connections.</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.integrations.map((name) => (
            <Link key={name} href="/demo" className="hover-lift rounded-lg border border-slate-200 bg-white p-6">
              <span className="rounded-md bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Setup</span>
              <h3 className="mt-5 text-lg font-semibold">{name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Request guided setup for this connection and align it with your document workflow.
              </p>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
