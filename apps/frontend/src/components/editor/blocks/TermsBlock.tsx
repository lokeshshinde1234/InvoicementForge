"use client";

import { Input } from "@/components/ui/input";
import type { BlockProps, TermsContent } from "../types";

export function TermsBlock({
  content,
  onChange,
  readOnly = false,
}: BlockProps<TermsContent>) {
  const heading = asText(content.heading, "Terms and conditions");
  const body = asText(content.body);

  if (readOnly) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
          {body}
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <Input
        value={heading}
        placeholder="Terms heading"
        onChange={(event) =>
          onChange({ ...content, heading: event.target.value })
        }
      />
      <textarea
        value={body}
        placeholder="Terms"
        className="min-h-36 rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        onChange={(event) => onChange({ ...content, body: event.target.value })}
      />
    </div>
  );
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
