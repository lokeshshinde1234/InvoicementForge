"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { useMarketingContent } from "@/lib/marketing-content";

const pillars = [
  ["Create", "Reusable proposal sections, branded templates, quote tables, and document blocks."],
  ["Send", "Secure client links, portal-ready delivery, proposal tracking, and document status."],
  ["Collect", "E-signatures, payment links, GST-ready invoices, and accounting-friendly records."],
] as const;

export default function ProductPage() {
  const { content } = useMarketingContent();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(20,184,166,0.30),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.22),transparent_28%)]" />
        <div className="brand-dots absolute inset-0 opacity-15" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Product overview</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              A complete proposal-to-payment operating system.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              InvoiceForge combines proposal authoring, client approval, invoicing, compliance records, and payment flows in one workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md bg-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-950/30 hover:bg-teal-400">
                Start free trial
              </Link>
              <Link href="/features" className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-sm font-semibold text-white hover:bg-white/10">
                View features
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            {pillars.map(([title, copy], index) => (
              <div key={title} className="rounded-md border border-white/10 bg-white/10 p-5 [&+&]:mt-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-200">Step 0{index + 1}</span>
                <h2 className="mt-2 text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-grid bg-[#fff9ef] px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Modules</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Every core module has a job to do.</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.productModules.map(([title, copy]) => (
              <Link key={title} href="/features" className="hover-lift rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
