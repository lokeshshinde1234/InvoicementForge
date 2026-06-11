"use client";

import Link from "next/link";
import AuthLink from "@/components/AuthLink";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { useMarketingContent } from "@/lib/marketing-content";

const anchors = [
  "proposal-builder",
  "pricing-tables",
  "signatures",
  "analytics",
  "gst",
  "client-portal",
];

const accents = [
  "bg-teal-600",
  "bg-slate-950",
  "bg-amber-500",
  "bg-cyan-600",
  "bg-emerald-600",
  "bg-indigo-600",
];

export default function FeaturesPage() {
  const { content } = useMarketingContent();
  const featured = content.features.slice(0, 6);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />

      <section className="brand-grid landing-hero-surface border-b border-amber-200/70 px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="marketing-reveal">
            <p className="inline-flex rounded-full border border-teal-200 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-teal-700 shadow-sm backdrop-blur">
              Feature system
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              A cleaner way to create, send, sign, track, and invoice.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              InvoiceForge connects the full document lifecycle: proposal builder,
              interactive pricing, e-signatures, client portal, GST invoices,
              payment links, and workspace visibility.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AuthLink
                href="/proposals/new"
                className="inline-flex h-12 items-center justify-center rounded-md bg-teal-600 px-6 text-sm font-black text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-teal-700"
              >
                Build proposal
              </AuthLink>
              <Link
                href="/demo"
                className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-lg"
              >
                Book demo
              </Link>
            </div>
          </div>

          <div className="marketing-reveal proposal-shadow overflow-hidden rounded-lg border border-white/80 bg-white/90 backdrop-blur">
            <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
              <p className="text-sm font-black">Live document workspace</p>
              <p className="mt-1 text-xs text-slate-300">Proposal to invoice pipeline</p>
            </div>
            <div className="grid gap-3 p-5">
              {[
                ["Proposal", "Draft ready", "68%"],
                ["Pricing", "Client options added", "82%"],
                ["Signature", "Waiting for buyer", "45%"],
                ["Invoice", "GST route detected", "91%"],
              ].map(([label, detail, width], index) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black">{label}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
                    </div>
                    <span className={`h-9 w-9 rounded-md ${accents[index]} shadow-sm`} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className={`block h-full rounded-full ${accents[index]}`} style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {featured.map((feature, index) => (
            <a
              key={feature.title}
              href={`#${anchors[index]}`}
              className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800"
            >
              {feature.title}
            </a>
          ))}
        </nav>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {featured.slice(0, 3).map((feature, index) => (
            <FeatureStat key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </section>

      <section className="bg-[#f6fbf9] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {featured.map((feature, index) => (
            <FeatureDetail key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="brand-dots absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              One connected path from first draft to paid invoice.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-5">
            {["Create", "Price", "Send", "Sign", "Invoice"].map((step, index) => (
              <div key={step} className="marketing-reveal rounded-lg border border-white/10 bg-white/5 p-5">
                <span className="text-sm font-black text-teal-300">0{index + 1}</span>
                <h3 className="mt-4 text-lg font-black">{step}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {[
                    "Start from templates or reusable blocks.",
                    "Add clear packages, taxes, and totals.",
                    "Share a branded client-facing link.",
                    "Capture approval with audit context.",
                    "Convert approved work into GST billing.",
                  ][index]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">
              Ready when you are
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Try the actual builder, not a fake feature tour.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <AuthLink href="/proposals/new" className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800">
              Open proposal builder
            </AuthLink>
            <Link href="/pricing" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-black text-slate-900 hover:border-slate-950">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function FeatureStat({
  feature,
  index,
}: {
  feature: { title: string; copy: string };
  index: number;
}) {
  return (
    <article className="marketing-reveal rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
      <span className={`grid h-11 w-11 place-items-center rounded-md ${accents[index]} text-sm font-black text-white`}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <h2 className="mt-5 text-xl font-black tracking-tight">{feature.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{feature.copy}</p>
    </article>
  );
}

function FeatureDetail({
  feature,
  index,
}: {
  feature: { title: string; copy: string };
  index: number;
}) {
  const reversed = index % 2 === 1;

  return (
    <article
      id={anchors[index]}
      className={`marketing-reveal scroll-mt-28 grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[0.85fr_1.15fr] lg:items-center ${
        reversed ? "lg:[&>div:first-child]:order-2" : ""
      }`}
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">
          Feature {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">{feature.title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">{feature.copy}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["Live backend", "Client-ready", "Workspace aware"].map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black">{feature.title}</span>
            <span className={`h-8 w-8 rounded-md ${accents[index % accents.length]}`} />
          </div>
          <div className="mt-5 space-y-3">
            {[86, 64, 42].map((width, rowIndex) => (
              <div key={width} className="h-3 overflow-hidden rounded-full bg-slate-100">
                <span
                  className={`block h-full rounded-full ${accents[(index + rowIndex) % accents.length]}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Draft", "Review", "Send"].map((label) => (
              <div key={label} className="rounded-md border border-slate-200 bg-white p-3 text-center text-xs font-black text-slate-600">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
