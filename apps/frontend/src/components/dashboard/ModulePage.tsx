"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";

type ModulePageProps = {
  active: string;
  eyebrow: string;
  title: string;
  description: string;
  endpoint?: string;
  cards: Array<{
    title: string;
    body: string;
    meta?: string;
  }>;
  actions?: Array<{
    label: string;
    href: string;
  }>;
};

export function ModulePage({
  active,
  eyebrow,
  title,
  description,
  endpoint,
  cards,
  actions = [],
}: ModulePageProps) {
  const [status, setStatus] = useState("Ready");
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!endpoint) {
      return;
    }

    api
      .get(endpoint)
      .then((response) => {
        const data = response.data;
        setCount(Array.isArray(data) ? data.length : null);
        setStatus("Connected");
      })
      .catch(() => setStatus("Needs configuration"));
  }, [endpoint]);

  return (
    <DashboardShell active={active}>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Connection
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{status}</p>
            <p className="mt-2 text-sm text-slate-500">
              {endpoint ? "Live module check against the backend API." : "Static module surface."}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Records
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-950">
              {count ?? cards.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Available entries or setup cards for this workspace.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Coverage
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{cards.length}</p>
            <p className="mt-2 text-sm text-slate-500">
              Focus areas surfaced in this dashboard section.
            </p>
          </div>
        </div>
      </div>

      {actions.length ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex h-10 items-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {card.meta ?? active}
            </p>
            <h2 className="mt-3 text-lg font-semibold">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {card.body}
            </p>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
