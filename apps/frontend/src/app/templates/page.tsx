"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { useMarketingContent, type MarketingContent } from "@/lib/marketing-content";

const categories = ["All", "Sales", "Agency", "Consulting", "Finance"];

export default function TemplatesPage() {
  const { content } = useMarketingContent();
  const templateCards = content.templates;

  return (
    <main className="min-h-screen bg-[#fff9ef] text-slate-950">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-amber-200/70 bg-[#fff9ef] px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_12%_15%,rgba(250,204,21,0.22),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(20,184,166,0.22),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Template gallery
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Proposal templates that look ready before you edit.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Inspired by Proposify-style template galleries, this page now uses
              visual template previews, category chips, and strong hover states
              that lead users into your existing proposal builder.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={category === "All" ? "/templates" : `/templates#${category.toLowerCase()}`}
                  className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-600 hover:text-teal-700"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {templateCards.slice(0, 2).map((template) => (
              <TemplateCard key={template.title} template={template} featured />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Browse templates
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Start with a structure, then customize inside InvoiceForge.
            </h2>
          </div>
          <Link
            href="/proposals/new"
            className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Open proposal builder
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {templateCards.map((template, index) => (
            <TemplateCard
              id={index === 1 ? "agency" : index === 3 ? "consulting" : index === 6 ? "finance" : undefined}
              key={template.title}
              template={template}
            />
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function TemplateCard({
  template,
  featured = false,
  id,
}: {
  template: MarketingContent["templates"][number];
  featured?: boolean;
  id?: string;
}) {
  return (
    <Link
      id={id}
      href={`/templates/${template.slug}`}
      className={`group scroll-mt-24 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-900/10 ${
        featured ? "min-h-full" : ""
      }`}
    >
      <div className="relative overflow-hidden bg-[#eef8f4]">
        <img
          src={template.image}
          alt={`${template.title} template preview`}
          className="aspect-[3/2] w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {template.category}
        </span>
      </div>
      <div className={featured ? "p-6" : "p-5"}>
        <h3 className="text-lg font-semibold">{template.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {template.description}
        </p>
        <span className="mt-5 inline-flex text-sm font-semibold text-teal-700 transition group-hover:translate-x-1">
          Use template
        </span>
      </div>
    </Link>
  );
}
