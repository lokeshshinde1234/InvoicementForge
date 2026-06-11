"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createBlockId } from "@/components/editor/types";
import { formatCurrency } from "@/lib/gst";
import type { BlockProps, PricingContent, PricingItem } from "../types";

const gstOptions = [0, 5, 12, 18, 28].map((rate) => ({
  value: String(rate),
  label: `${rate}%`,
}));

export function PricingTableBlock({
  content,
  onChange,
  readOnly = false,
}: BlockProps<PricingContent>) {
  const heading = asText(content.heading, "Investment");
  const items = normalizeItems(content.items);
  const total = items.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        item.unitPrice *
        (1 + (item.gstRate > 1 ? item.gstRate / 100 : item.gstRate)),
    0,
  );

  function updateItem(id: string, patch: Partial<PricingItem>) {
    onChange({
      ...content,
      items: items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  function addItem() {
    onChange({
      ...content,
      items: [
        ...items,
        {
          id: createBlockId("pricing"),
          description: "New item",
          quantity: 1,
          unitPrice: 0,
          gstRate: 18,
        },
      ],
    });
  }

  function removeItem(id: string) {
    onChange({
      ...content,
      items: items.filter((item) => item.id !== id),
    });
  }

  if (readOnly) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <div className="mt-5 divide-y divide-slate-100">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="grid grid-cols-[1fr_auto] gap-4 py-3">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-slate-500">
                  {item.quantity} x {formatCurrency(item.unitPrice)} + GST{" "}
                  {item.gstRate}%
                </p>
              </div>
              <p className="font-semibold">
                {formatCurrency(
                  item.quantity *
                    item.unitPrice *
                    (1 +
                      (item.gstRate > 1 ? item.gstRate / 100 : item.gstRate)),
                )}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-between rounded-md bg-slate-950 p-4 text-white">
          <span>Total</span>
          <span className="font-semibold">{formatCurrency(total)}</span>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <Input
        value={heading}
        placeholder="Pricing heading"
        onChange={(event) =>
          onChange({ ...content, heading: event.target.value })
        }
      />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="grid gap-3 rounded-md bg-slate-50 p-3 lg:grid-cols-[1fr_90px_120px_100px_44px]"
          >
            <Input
              value={item.description}
              onChange={(event) =>
                updateItem(item.id, { description: event.target.value })
              }
            />
            <Input
              type="number"
              min={0}
              value={item.quantity}
              onChange={(event) =>
                updateItem(item.id, { quantity: Number(event.target.value) })
              }
            />
            <Input
              type="number"
              min={0}
              value={item.unitPrice}
              onChange={(event) =>
                updateItem(item.id, { unitPrice: Number(event.target.value) })
              }
            />
            <Select
              value={String(item.gstRate)}
              options={gstOptions}
              onChange={(event) =>
                updateItem(item.id, { gstRate: Number(event.target.value) })
              }
            />
            <Button
              aria-label="Remove pricing item"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(item.id)}
            >
              X
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={addItem}>
        Add pricing item
      </Button>
    </div>
  );
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeItems(value: unknown): PricingItem[] {
  if (!Array.isArray(value)) {
    return [
      {
        id: "pricing-1",
        description: "Pricing item",
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
      },
    ];
  }

  return value.map((item, index) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Partial<PricingItem>)
        : {};

    return {
      id: asText(record.id, `pricing-${index + 1}`),
      description: asText(record.description, `Pricing item ${index + 1}`),
      quantity: toNumber(record.quantity, 1),
      unitPrice: toNumber(record.unitPrice, 0),
      gstRate: toNumber(record.gstRate, 18),
    };
  });
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
