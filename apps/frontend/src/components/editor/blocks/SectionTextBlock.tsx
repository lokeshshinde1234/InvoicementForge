"use client";

import { Input } from "@/components/ui/input";
import type { BlockProps, SectionContent } from "../types";

export function SectionTextBlock({
  content,
  onChange,
  readOnly = false,
}: BlockProps<SectionContent>) {
  const heading = asText(content.heading, "Section");
  const body = asText(content.body);
  const pointText = asText(content.points);
  const points = pointText
    .split("\n")
    .map((point) => point.trim())
    .filter(Boolean);

  if (readOnly) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 transition hover:border-teal-200 hover:shadow-sm">
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
          {body}
        </p>
        {points.length ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {points.map((point, index) => (
              <div
                key={`${point}-${index}`}
                className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-700"
              >
                {point}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <Input
        value={heading}
        placeholder="Section heading"
        onChange={(event) =>
          onChange({ ...content, heading: event.target.value })
        }
      />
      <textarea
        value={body}
        placeholder="Section content"
        className="min-h-28 rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        onChange={(event) => onChange({ ...content, body: event.target.value })}
      />
      <textarea
        value={pointText}
        placeholder="One point per line"
        className="min-h-24 rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        onChange={(event) =>
          onChange({ ...content, points: event.target.value })
        }
      />
    </div>
  );
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
