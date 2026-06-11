"use client";

import { Input } from "@/components/ui/input";
import type { BlockProps, ScopeContent } from "../types";

export function ScopeBlock({
  content,
  onChange,
  readOnly = false,
}: BlockProps<ScopeContent>) {
  const heading = asText(content.heading, "Scope of work");
  const body = asText(content.body);
  const points = asText(content.points);
  const deliverableText = asText(content.deliverables, points);

  if (readOnly) {
    const deliverables = deliverableText
      .split("\n")
      .filter(Boolean);

    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <p className="mt-4 leading-7 text-slate-600">{body}</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-700">
          {deliverables.map((deliverable, index) => (
              <li key={`${deliverable}-${index}`} className="rounded-md bg-slate-50 p-3">
                {deliverable}
              </li>
            ))}
        </ul>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <Input
        value={heading}
        placeholder="Heading"
        onChange={(event) =>
          onChange({ ...content, heading: event.target.value })
        }
      />
      <textarea
        value={body}
        placeholder="Scope narrative"
        className="min-h-28 rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        onChange={(event) => onChange({ ...content, body: event.target.value })}
      />
      <textarea
        value={deliverableText}
        placeholder="One deliverable per line"
        className="min-h-28 rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        onChange={(event) =>
          onChange({
            ...content,
            points: event.target.value,
            deliverables: event.target.value,
          })
        }
      />
    </div>
  );
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
