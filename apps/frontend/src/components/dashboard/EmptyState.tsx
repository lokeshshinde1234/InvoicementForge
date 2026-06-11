"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
  icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
        {icon ?? <DefaultEmptyIcon />}
      </div>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-5 bg-teal-600 hover:bg-teal-700" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function DefaultEmptyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 4.75h7l4 4V19a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 6 19V6A1.25 1.25 0 0 1 7.25 4.75Z" />
      <path d="M14 4.75V9h4" />
      <path d="M9 12.5h6M9 16h4" />
    </svg>
  );
}
