"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  tone?: "default" | "success" | "warning";
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">Activity timeline</h2>
        <p className="mt-1 text-sm text-slate-500">
          Recent business activity across your workspace.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No recent activity"
          description="Activity will appear here after you create or update invoices, proposals, and client records."
        />
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                    item.tone === "success"
                      ? "bg-emerald-500"
                      : item.tone === "warning"
                        ? "bg-amber-500"
                        : "bg-teal-500"
                  }`}
                />
                <span className="mt-2 h-full w-px bg-slate-200" />
              </div>
              <div className="pb-4">
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {item.detail}
                </p>
                <p className="mt-2 text-xs text-slate-400">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
