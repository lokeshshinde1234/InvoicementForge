"use client";

import Link from "next/link";

export function DashboardHeader({
  eyebrow,
  title,
  description,
  workspaceName,
  quickSummary,
}: {
  eyebrow: string;
  title: string;
  description: string;
  workspaceName?: string | null;
  quickSummary: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_32%)]" />
        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                {description}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  Workspace:{" "}
                  <span className="font-semibold text-slate-900">
                    {workspaceName || "InvoiceForge workspace"}
                  </span>
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  Recent activity shortcut ready
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:gap-3">
              <Link
                href="/invoices/new"
                className="inline-flex h-10 items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Create invoice
              </Link>
              <Link
                href="/clients"
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                View clients
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 xl:grid-cols-4">
            {quickSummary.map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-2xl border border-white/80 bg-white/80 px-3 py-3 shadow-sm backdrop-blur sm:px-4 sm:py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
