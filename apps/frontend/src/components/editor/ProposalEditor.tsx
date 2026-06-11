"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { SortableBlock } from "./SortableBlock";
import {
  createBlockId,
  createDefaultBlock,
  type ProposalBlock,
  type ProposalBlockType,
} from "./types";

type ProposalEditorProps = {
  blocks: ProposalBlock[];
  onChange: (blocks: ProposalBlock[]) => void;
};

export function ProposalEditor({ blocks, onChange }: ProposalEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function normalize(nextBlocks: ProposalBlock[]) {
    return nextBlocks.map((block, index) => ({ ...block, order: index }));
  }

  function addBlock(type: ProposalBlockType) {
    onChange(normalize([...blocks, createDefaultBlock(type)]));
  }

  function updateBlock(nextBlock: ProposalBlock) {
    onChange(
      blocks.map((block) => (block.id === nextBlock.id ? nextBlock : block)),
    );
  }

  function deleteBlock(id: string) {
    onChange(normalize(blocks.filter((block) => block.id !== id)));
  }

  function duplicateBlock(id: string) {
    const index = blocks.findIndex((block) => block.id === id);

    if (index === -1) {
      return;
    }

    const duplicate = {
      ...blocks[index],
      id: createBlockId(blocks[index].type),
      content: cloneContent(blocks[index].content),
    };
    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, duplicate);
    onChange(normalize(nextBlocks));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);
    onChange(normalize(arrayMove(blocks, oldIndex, newIndex)));
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onChange={updateBlock}
                onDelete={deleteBlock}
                onDuplicate={duplicateBlock}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Add a block to begin.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(
              [
                "cover",
                "clientInfo",
                "companyInfo",
                "summary",
                "problem",
                "solution",
                "scope",
                "pricing",
                "timeline",
                "terms",
                "signature",
              ] as const
            ).map((type) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => addBlock(type)}
              >
                Add {type}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function cloneContent<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}
