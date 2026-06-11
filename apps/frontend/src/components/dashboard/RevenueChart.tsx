"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";

export type RevenuePoint = {
  label: string;
  value: number;
};

export function RevenueChart({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: RevenuePoint[];
}) {
  const max = Math.max(...points.map((point) => point.value), 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {points.length === 0 || max === 0 ? (
        <EmptyState
          className="mt-4"
          title="No chart data yet"
          description="Revenue trends will appear here after real invoices and proposals start moving through your workspace."
        />
      ) : (
        <div className="mt-6 grid grid-cols-6 gap-3">
          {points.map((point) => {
            const height = `${Math.max((point.value / max) * 100, 8)}%`;

            return (
              <div key={point.label} className="flex flex-col items-center">
                <div className="flex h-44 w-full items-end rounded-xl bg-slate-50 px-2 py-2">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-teal-600 to-cyan-400 transition-all duration-500"
                    style={{ height }}
                    title={`${point.label}: ${point.value}`}
                  />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {point.label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
