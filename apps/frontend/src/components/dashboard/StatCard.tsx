"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "success" | "warning" | "danger";
  href?: string;
}) {
  const toneClasses = {
    default: "from-slate-900 to-slate-700",
    success: "from-emerald-600 to-teal-600",
    warning: "from-amber-500 to-orange-500",
    danger: "from-rose-600 to-red-600",
  }[tone];

  const card = (
    <Card className="overflow-hidden rounded-2xl border-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="p-0">
        <div className={cn("h-1 w-full bg-gradient-to-r", toneClasses)} />
        <div className="p-5">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (!href) {
    return card;
  }

  return (
    <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
      {card}
    </Link>
  );
}
