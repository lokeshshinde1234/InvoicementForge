"use client";

import Link from "next/link";
import AuthLink from "@/components/AuthLink";
import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { useMarketingContent, type MarketingContent } from "@/lib/marketing-content";

export function MarketingPage() {
  const { content } = useMarketingContent();

  return (
    <main className="marketing-mobile min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <Hero />
      <LogoStrip />
      <section data-aos="if-fade-up">
        <Workflow />
      </section>
      <section data-aos="if-fade-up">
        <FeatureGrid features={content.features} />
      </section>
      <section data-aos="if-fade-up">
        <DemoPreview templates={content.templates} />
      </section>
      <section data-aos="if-fade-up">
        <PricingTeaser plans={content.plans} />
      </section>
      <section data-aos="if-fade-up">
        <FinalCta />
      </section>
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="brand-grid landing-hero-surface border-b border-slate-200">
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:py-14 lg:grid-cols-[1fr_560px] lg:gap-12 lg:px-8">
        <div>
          <p className="inline-flex rounded-lg border border-teal-200 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-teal-700 shadow-sm backdrop-blur sm:text-sm">
            Proposal to invoice operations
          </p>
          <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl">
            Close client work from one disciplined revenue desk.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
            InvoiceForge helps service teams prepare branded proposals, collect
            approvals, issue GST-ready invoices, and keep clients moving through
            a secure portal without stitching together four different tools.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-teal-700">
              Start free trial
            </Link>
            <Link href="/demo" className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-lg">
              Book a demo
            </Link>
          </div>
          <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2 text-sm text-slate-700 sm:mt-8 sm:gap-3">
            {[
              ["GST-ready", "CGST, SGST, IGST"],
              ["Client portal", "Docs, payments, status"],
              ["Secure reset", "Email-based access"],
            ].map(([label, copy]) => (
              <span key={label} className="rounded-xl border border-white/80 bg-white/70 px-2 py-3 shadow-sm backdrop-blur sm:px-3">
                <span className="block font-semibold text-slate-950">{label}</span>
                <span className="mt-1 hidden text-xs text-slate-500 sm:block">{copy}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="hero-accent-card proposal-shadow rounded-2xl border border-white/80 bg-white/80 p-3 backdrop-blur sm:p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="font-semibold">Client workspace</p>
              <p className="text-sm text-slate-500">Proposal, invoice, payment status</p>
            </div>
            <span className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Live portal
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              ["Proposal", "Awaiting signature"],
              ["GST invoice", "Ready to send"],
              ["Payment link", "Razorpay enabled"],
              ["Client message", "Unread"],
              ["Password reset", "Email protected"],
            ].map(([label, value]) => (
              <div key={label} className="hover-lift flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 sm:p-4">
                <span className="font-medium">{label}</span>
                <span className="text-right text-xs text-slate-500 sm:text-sm">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950 p-4 text-white sm:p-5">
              <p className="text-sm text-slate-300">Open value</p>
              <p className="mt-2 text-xl font-semibold sm:text-3xl">INR 4.8L</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-sm text-slate-500">Next action</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Send reminder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  return (
    <section className="border-b border-slate-200 bg-white py-8">
      <p className="text-center text-sm font-medium text-slate-500">
        Built for service businesses that need documents, tax, and client communication in one place.
      </p>
      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 lg:grid-cols-6">
        {["Agencies", "Consultants", "MSMEs", "Studios", "IT services", "Finance teams"].map((name) => (
          <div key={name} className="hover-lift rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700">
            {name}
          </div>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { title: "Create", copy: "Build reusable sections.", detail: "Brand-ready editor" },
    { title: "Quote", copy: "Add products and options.", detail: "Interactive pricing" },
    { title: "Send", copy: "Share a secure link.", detail: "Live delivery status" },
    { title: "Sign", copy: "Capture acceptance.", detail: "Digital approvals" },
    { title: "Invoice", copy: "Convert work to GST invoices.", detail: "One-click handoff" },
  ];

  return (
    <section className="mobile-section relative overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(20,184,166,0.22),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(59,130,246,0.18),transparent_30%)]" />
      <div className="brand-dots absolute inset-0 opacity-15" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              One connected flow from first draft to paid work.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            Replace scattered documents and follow-ups with a clear, buyer-friendly process your whole team can track.
          </p>
        </div>

        <div className="relative mt-10 grid gap-3 md:grid-cols-5 lg:mt-14">
          <div className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-gradient-to-r from-transparent via-teal-300/60 to-transparent md:block" />
          {steps.map((step, index) => (
            <Link
              key={step.title}
              href={index === 4 ? "/proposals/new" : "/features"}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-teal-300/50 hover:bg-white/[0.1] sm:p-5"
            >
              <div className="flex items-center gap-4 md:block">
                <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-teal-300/30 bg-slate-900 text-sm font-bold text-teal-300 shadow-[0_0_24px_rgba(45,212,191,0.12)] md:h-16 md:w-16 md:rounded-2xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="md:mt-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300">{step.detail}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white md:mt-3">{step.title}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{step.copy}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white/70 transition group-hover:text-teal-200">
                Explore step <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid({ features }: { features: MarketingContent["features"] }) {
  const labels = ["Reusable", "Buyer-led", "Secure", "Real-time", "GST-ready", "Self-service"];
  const accents = [
    "from-teal-500/20 via-cyan-400/5 to-transparent",
    "from-blue-500/20 via-indigo-400/5 to-transparent",
    "from-violet-500/20 via-fuchsia-400/5 to-transparent",
    "from-amber-500/20 via-orange-400/5 to-transparent",
    "from-emerald-500/20 via-teal-400/5 to-transparent",
    "from-sky-500/20 via-blue-400/5 to-transparent",
  ];

  return (
    <section className="mobile-section brand-grid relative overflow-hidden border-y border-slate-200 bg-[#f4f8f7] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionLabel label="Modern feature stack" title="Everything your team needs to close work without the busywork." />
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {["Live deal visibility", "Secure client experience", "Finance-ready handoff"].map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {features.map((card, index) => (
            <Link
              key={card.title}
              href="/features"
              className={`group relative min-h-64 overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:p-6 ${
                index === 0 || index === 3 ? "lg:col-span-7" : "lg:col-span-5"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${accents[index % accents.length]}`} />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {labels[index % labels.length]}
                  </span>
                </div>
                <h3 className="mt-7 max-w-xl text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{card.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{card.copy}</p>
                <div className="mt-auto pt-8">
                  <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="h-2 w-16 rounded-full bg-slate-200" />
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-slate-400">Live</span>
                    </div>
                    <div className="mt-3 grid grid-cols-[1fr_72px] gap-2">
                      <span className="h-2 rounded-full bg-slate-200" />
                      <span className="h-2 rounded-full bg-teal-200" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoPreview({ templates }: { templates: MarketingContent["templates"] }) {
  return (
    <section className="mobile-section mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-8">
      <div>
        <SectionLabel label="Product demo" title="A website structure with clear product pages and working CTAs." />
        <p className="mt-5 text-base leading-7 text-slate-600">
          Product, features, templates, integrations, customers, pricing, demo,
          signup, and login are now separate pages. Buttons route to real pages
          or to existing app builders.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/demo" className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
            Get demo
          </Link>
          {/* Create-proposal CTA: require auth */}
          <AuthLink href="/proposals/new" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-md">
            Create proposal
          </AuthLink>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.slice(0, 4).map((template) => (
          <Link key={template.title} href="/templates" className="hover-lift group rounded-lg border border-slate-200 bg-white p-4">
            <span className="block overflow-hidden rounded-md bg-[#eef8f4]">
              <img
                src={template.image}
                alt={`${template.title} template preview`}
                className="aspect-[3/2] w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </span>
            <p className="mt-4 font-semibold">{template.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PricingTeaser({ plans }: { plans: MarketingContent["plans"] }) {
  const audiences = ["For getting started", "For small teams", "For growing teams", "For complex organizations"];

  return (
    <section className="mobile-section relative overflow-hidden border-y border-slate-800 bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.18),transparent_35%)]" />
      <div className="brand-dots absolute inset-0 opacity-10" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Simple pricing</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Start lean. Add power as your deal flow grows.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Every plan is designed around real document volume, with a clear path from first proposal to enterprise operations.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["Annual pricing shown", "No setup fee", "Upgrade anytime"].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-300">
                <span className="mr-2 text-teal-300">✓</span>{item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 sm:p-6 ${
                plan.popular
                  ? "border-teal-300 bg-white text-slate-950 shadow-[0_24px_70px_rgba(20,184,166,0.2)]"
                  : "border-white/10 bg-white/[0.05] text-white backdrop-blur"
              }`}
            >
              {plan.popular ? (
                <span className="absolute right-4 top-4 rounded-full bg-teal-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-800">
                  Most popular
                </span>
              ) : null}
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${plan.popular ? "text-teal-700" : "text-teal-300"}`}>
                {audiences[index % audiences.length]}
              </p>
              <h3 className="mt-4 text-xl font-semibold">{plan.name}</h3>
              <div className="mt-5 flex flex-wrap items-end gap-1">
                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{plan.annualPrice}</p>
                <span className={`pb-1 text-sm ${plan.popular ? "text-slate-500" : "text-slate-400"}`}>{plan.cadence}</span>
              </div>
              <p className={`mt-4 text-sm leading-6 ${plan.popular ? "text-slate-600" : "text-slate-300"}`}>{plan.description}</p>
              <div className={`my-6 h-px ${plan.popular ? "bg-slate-200" : "bg-white/10"}`} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${plan.popular ? "text-slate-500" : "text-slate-400"}`}>
                What&apos;s included
              </p>
              <ul className="mt-4 space-y-3">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className={`flex gap-3 text-sm ${plan.popular ? "text-slate-700" : "text-slate-300"}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      plan.popular ? "bg-teal-100 text-teal-700" : "bg-teal-300/10 text-teal-300"
                    }`}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <p className={`mt-5 text-xs ${plan.popular ? "text-slate-500" : "text-slate-400"}`}>
                {plan.sendLimit} · {plan.overage}
              </p>
              <Link
                href={plan.href}
                className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                  plan.popular
                    ? "bg-slate-950 text-white shadow-lg hover:bg-slate-800"
                    : "border border-white/15 bg-white/10 text-white hover:border-teal-300/40 hover:bg-white/15"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mobile-section relative overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.28),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.20),transparent_30%)]" />
      <div className="brand-dots absolute inset-0 opacity-20" />
      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Ready to send better proposals?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
          Start with signup, or book a demo for a guided walkthrough of the full
          proposal-to-invoice workflow.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5">
            Start free trial
          </Link>
          <Link href="/demo" className="inline-flex h-12 items-center justify-center rounded-md border border-white/30 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
            Book demo
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SectionLabel({ label, title }: { label: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{label}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

export function SimpleMarketingPage({
  label,
  title,
  copy,
  children,
}: {
  label: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <main className="marketing-mobile min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="mobile-section brand-grid brand-surface border-b border-amber-200/70 px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{label}</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">{copy}</p>
        </div>
      </section>
      {children}
      <SiteFooter />
    </main>
  );
}
