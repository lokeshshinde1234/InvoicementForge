"use client";

import { BlockForm } from "@/components/editor/SortableBlock";
import type { ProposalBlock } from "./types";

type PreviewPanelProps = {
  blocks: ProposalBlock[];
  accent: string;
  soft: string;
};

export function PreviewPanel({ blocks, accent, soft }: PreviewPanelProps) {
  return (
    <div
      className="max-h-[calc(100vh-9rem)] space-y-4 overflow-auto p-4"
      style={{ backgroundColor: soft }}
    >
      <div className="flex items-center justify-between rounded-md bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Live preview
          </p>
          <p className="text-sm font-semibold text-slate-900">
            Client-facing proposal
          </p>
        </div>
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>
      {blocks.map((block) => (
        <BlockForm
          key={block.id}
          block={block}
          readOnly
          onChange={() => undefined}
        />
      ))}
    </div>
  );
}
