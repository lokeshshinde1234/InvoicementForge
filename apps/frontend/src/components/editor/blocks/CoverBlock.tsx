"use client";

import { Input } from "@/components/ui/input";
import type { BlockProps, CoverContent } from "../types";

export function CoverBlock({
  content,
  onChange,
  readOnly = false,
}: BlockProps<CoverContent>) {
  const eyebrow = asText(content.eyebrow, asText(content.clientName));
  const clientName = asText(content.clientName, "Prepared for Client company");
  const title = asText(content.title, "Imported proposal");
  const subtitle = asText(content.subtitle);
  const backgroundColor = asText(content.backgroundColor, "#0f172a");
  const textColor = asText(content.textColor, "#ffffff");
  const accentColor = asText(content.accentColor, "#67e8f9");

  if (readOnly) {
    return (
      <section
        className="rounded-lg p-8 text-white"
        style={{
          backgroundColor,
          color: textColor,
        }}
      >
        <p
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: accentColor }}
        >
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">{subtitle}</p>
        <p className="mt-8 text-sm opacity-80">{clientName}</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <Input
        value={eyebrow}
        placeholder="Eyebrow"
        onChange={(event) =>
          onChange({ ...content, eyebrow: event.target.value })
        }
      />
      <Input
        value={clientName}
        placeholder="Client name"
        onChange={(event) =>
          onChange({ ...content, clientName: event.target.value })
        }
      />
      <Input
        value={title}
        placeholder="Proposal title"
        onChange={(event) =>
          onChange({ ...content, title: event.target.value })
        }
      />
      <Input
        value={subtitle}
        placeholder="Subtitle"
        onChange={(event) =>
          onChange({ ...content, subtitle: event.target.value })
        }
      />
    </div>
  );
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
