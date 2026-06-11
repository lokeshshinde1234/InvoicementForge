"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { useMarketingContent } from "@/lib/marketing-content";

const outcomes = ["Faster proposal sends", "Cleaner client approvals", "GST-ready billing"];

export default function CustomersPage() {
  const { content } = useMarketingContent();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="brand-grid border-b border-amber-200/70 bg-[linear-gradient(135deg,#fff7ed_0%,#ecfdf5_55%,#ffffff_100%)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Customers</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Built for service teams that win work through documents.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Agencies, consultants, software teams, finance teams, and operations businesses can run the same polished proposal-to-invoice flow.
            </p>
            <Link href="/demo" className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-slate-950 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800">
              Book customer walkthrough
            </Link>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/80 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-3">
              {outcomes.map((item) => (
                <div key={item} className="rounded-md bg-slate-950 p-4 text-white">
                  <p className="text-sm font-semibold">{item}</p>
                  <p className="mt-3 text-2xl font-semibold text-amber-200">0{outcomes.indexOf(item) + 1}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">Customer-ready workflow</p>
              <p className="mt-2 text-2xl font-semibold">Proposal, approval, invoice, payment.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Use cases</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Different teams, one close-ready system.</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.industries.map((name, index) => (
            <Link key={name} href="/demo" className="hover-lift rounded-lg border border-slate-200 bg-white p-6">
              <span className="rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">Customer 0{index + 1}</span>
              <h3 className="mt-5 text-xl font-semibold">{name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Create reusable sections, quote clearly, collect approvals, and convert signed work into invoices.
              </p>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
