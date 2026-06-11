"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoverBlock } from "./blocks/CoverBlock";
import { PricingTableBlock } from "./blocks/PricingTableBlock";
import { SectionTextBlock } from "./blocks/SectionTextBlock";
import { SignatureBlock } from "./blocks/SignatureBlock";
import { ScopeBlock } from "./blocks/ScopeBlock";
import { TermsBlock } from "./blocks/TermsBlock";
import { TimelineBlock } from "./blocks/TimelineBlock";
import {
  blockLabels,
  type CoverContent,
  type PricingContent,
  type ProposalBlock,
  type ScopeContent,
  type SectionContent,
  type SignatureContent,
  type TermsContent,
  type TimelineContent,
} from "./types";

type SortableBlockProps = {
  block: ProposalBlock;
  onChange: (block: ProposalBlock) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
};

export function SortableBlock({
  block,
  onChange,
  onDelete,
  onDuplicate,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-60" : undefined}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Drag block"
              className="grid h-9 w-9 cursor-grab place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              ::
            </button>
            <CardTitle className="truncate text-sm">
              {blockLabels[block.type]}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDuplicate(block.id)}
            >
              Duplicate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(block.id)}
            >
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <BlockForm block={block} onChange={onChange} />
        </CardContent>
      </Card>
    </div>
  );
}

export function BlockForm({
  block,
  onChange,
  readOnly = false,
  signatureData = null,
  signatureMeta = null,
}: {
  block: ProposalBlock;
  onChange: (block: ProposalBlock) => void;
  readOnly?: boolean;
  signatureData?: string | null;
  signatureMeta?: string | null;
}) {
  if (block.type === "cover") {
    return (
      <CoverBlock
        content={block.content as CoverContent}
        readOnly={readOnly}
        onChange={(content) => onChange({ ...block, content })}
      />
    );
  }

  if (block.type === "scope") {
    return (
      <ScopeBlock
        content={block.content as ScopeContent}
        readOnly={readOnly}
        onChange={(content) => onChange({ ...block, content })}
      />
    );
  }

  if (
    block.type === "clientInfo" ||
    block.type === "companyInfo" ||
    block.type === "summary" ||
    block.type === "problem" ||
    block.type === "solution"
  ) {
    return (
      <SectionTextBlock
        content={block.content as SectionContent}
        readOnly={readOnly}
        onChange={(content) => onChange({ ...block, content })}
      />
    );
  }

  if (block.type === "pricing") {
    return (
      <PricingTableBlock
        content={block.content as PricingContent}
        readOnly={readOnly}
        onChange={(content) => onChange({ ...block, content })}
      />
    );
  }

  if (block.type === "timeline") {
    return (
      <TimelineBlock
        content={block.content as TimelineContent}
        readOnly={readOnly}
        onChange={(content) => onChange({ ...block, content })}
      />
    );
  }

  if (block.type === "signature") {
    return (
      <SignatureBlock
        content={block.content as SignatureContent}
        readOnly={readOnly}
        signatureData={signatureData}
        signatureMeta={signatureMeta}
        onChange={(content) => onChange({ ...block, content })}
      />
    );
  }

  return (
    <TermsBlock
      content={block.content as TermsContent}
      readOnly={readOnly}
      onChange={(content) => onChange({ ...block, content })}
    />
  );
}
