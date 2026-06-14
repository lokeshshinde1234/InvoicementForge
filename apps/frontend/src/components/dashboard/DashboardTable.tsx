"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";

type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
};

export function DashboardTable<T>({
  title,
  description,
  rows,
  columns,
  emptyTitle,
  emptyDescription,
  action,
}: {
  title: string;
  description: string;
  rows: T[];
  columns: Array<Column<T>>;
  emptyTitle: string;
  emptyDescription: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="mobile-stack-actions flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {action}
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="mobile-table-scroll overflow-x-auto">
          <table className="mobile-card-table w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-5 py-3 font-semibold ${
                      column.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="transition hover:bg-slate-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      data-label={column.header}
                      className={`px-5 py-4 ${
                        column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
