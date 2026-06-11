"use client";

import { Input } from "@/components/ui/input";
import type { BlockProps, TimelineContent } from "../types";

export function TimelineBlock({
  content,
  onChange,
  readOnly = false,
}: BlockProps<TimelineContent>) {
  const heading = asText(content.heading, "Timeline");
  const milestones = asText(content.milestones);

  if (readOnly) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <div className="mt-5 space-y-3">
          {milestones
            .split("\n")
            .filter(Boolean)
            .map((milestone, index) => (
              <div
                key={`${milestone}-${index}`}
                className="flex gap-3 rounded-md bg-slate-50 p-3"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />
                <p className="text-sm text-slate-700">{milestone}</p>
              </div>
            ))}
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <Input
        value={heading}
        placeholder="Timeline heading"
        onChange={(event) =>
          onChange({ ...content, heading: event.target.value })
        }
      />
      <textarea
        value={milestones}
        placeholder="One milestone per line"
        className="min-h-32 rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        onChange={(event) =>
          onChange({ ...content, milestones: event.target.value })
        }
      />
    </div>
  );
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
