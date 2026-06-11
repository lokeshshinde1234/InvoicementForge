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
    <main className="min-h-screen bg-white text-slate-950">
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
    <section className="brand-grid landing-hero-surface border-b border-amber-200/70">
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_540px] lg:px-8">
        <div>
          <p className="inline-flex rounded-full border border-teal-200 bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-teal-700 shadow-sm backdrop-blur">
            Proposal, quote, sign, invoice
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl">
            Turn proposal chaos into a cleaner close.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            InvoiceForge gives your team the Proposify-style structure buyers
            expect: branded proposals, reusable templates, quoting, e-signatures,
            approvals, client portals, and GST-ready invoices.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-teal-700">
              Start free trial
            </Link>
            <Link href="/demo" className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-lg">
              Book a demo
            </Link>
          </div>
          <div className="mt-8 grid max-w-xl gap-3 text-sm text-slate-700 sm:grid-cols-3">
            {["14-day trial", "No credit card", "Connected to your API"].map((item) => (
              <span key={item} className="rounded-md border border-white/70 bg-white/60 px-3 py-2 font-semibold shadow-sm backdrop-blur">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="hero-accent-card proposal-shadow rounded-lg border border-white/80 p-4 backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="font-semibold">Proposal workspace</p>
              <p className="text-sm text-slate-500">Client-facing deal room</p>
            </div>
            <span className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Viewed 3 times
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              ["Cover page", "Ready"],
              ["Scope of work", "Approved"],
              ["Interactive quote", "INR 4,80,000"],
              ["Terms", "Locked"],
              ["Signature", "Waiting"],
            ].map(([label, value]) => (
              <div key={label} className="hover-lift flex items-center justify-between rounded-md border border-slate-200 p-4">
                <span className="font-medium">{label}</span>
                <span className="text-sm text-slate-500">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-slate-950 p-5 text-white">
            <p className="text-sm text-slate-300">Close-ready value</p>
            <p className="mt-2 text-3xl font-semibold">INR 4.8L</p>
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
        Built for agencies, consultants, software teams, and service businesses.
      </p>
      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 lg:grid-cols-6">
        {["Northstar", "UrbanLedger", "BrightDesk", "CloudPeak", "ApexWorks", "Finovo"].map((name) => (
          <div key={name} className="hover-lift rounded-md border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-600">
            {name}
          </div>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionLabel label="How it works" title="The same sales-document structure buyers already understand." />
      <div className="mt-10 grid gap-4 md:grid-cols-5">
        {["Create", "Quote", "Send", "Sign", "Invoice"].map((step, index) => (
          <Link key={step} href={index === 4 ? "/proposals/new" : "/features"} className="hover-lift rounded-lg border border-slate-200 bg-white p-5">
            <span className="text-sm font-semibold text-teal-700">0{index + 1}</span>
            <h3 className="mt-4 text-lg font-semibold">{step}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {["Build reusable sections.", "Add products and options.", "Share a secure link.", "Capture acceptance.", "Convert work to GST invoices."][index]}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeatureGrid({ features }: { features: MarketingContent["features"] }) {
  return (
    <section className="brand-grid border-y border-slate-200 bg-[#fff9ef] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionLabel label="Features" title="Everything needed to move from draft to signed deal." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((card) => (
            <Link key={card.title} href="/features" className="hover-lift relative rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.copy}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoPreview({ templates }: { templates: MarketingContent["templates"] }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
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
  return (
    <section className="brand-grid border-y border-slate-200 bg-[#fbfaf6] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionLabel label="Pricing" title="Plans shaped like modern proposal software." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.name} className="hover-lift relative rounded-lg border border-slate-200 bg-white p-6">
              {plan.popular ? <span className="rounded-md bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">Most popular</span> : null}
              <h3 className="mt-4 text-xl font-semibold">{plan.name}</h3>
              <p className="mt-4 text-3xl font-semibold">{plan.annualPrice}<span className="text-base text-slate-500">{plan.cadence}</span></p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
              <Link href={plan.href} className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 text-sm font-semibold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-700">
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
    <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
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
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="brand-grid brand-surface border-b border-amber-200/70 px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{label}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{copy}</p>
        </div>
      </section>
      {children}
      <SiteFooter />
    </main>
  );
}
