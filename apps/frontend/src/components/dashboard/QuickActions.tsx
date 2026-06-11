"use client";

import Link from "next/link";

type QuickAction = {
  label: string;
  href: string;
  description: string;
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Common tasks for today&apos;s workflow.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/60"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {action.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {action.description}
                </p>
              </div>
              <span className="text-teal-700">+</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
