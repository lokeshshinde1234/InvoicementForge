"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateLineItems,
  formatCurrency,
  type InvoiceLineItemInput,
} from "@/lib/gst";

type LineItemTableProps = {
  items: InvoiceLineItemInput[];
  sellerState?: string;
  buyerState?: string;
  currency?: string;
  onChange: (items: InvoiceLineItemInput[]) => void;
};

const gstRateOptions = [0, 5, 12, 18, 28].map((rate) => ({
  value: String(rate),
  label: `${rate}%`,
}));

export function LineItemTable({
  items,
  sellerState = "MH",
  buyerState = "MH",
  currency = "INR",
  onChange,
}: LineItemTableProps) {
  const calculation = calculateLineItems(items, sellerState, buyerState);

  function updateItem(
    id: string,
    field: keyof InvoiceLineItemInput,
    value: string | number,
  ) {
    onChange(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity" ||
                field === "unitPrice" ||
                field === "gstRate" ||
                field === "tdsRate" ||
                field === "tcsRate"
                  ? Number(value)
                  : value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        hsnCode: "",
        sacCode: "",
        gstRate: 18,
        tdsRate: 0,
        tcsRate: 0,
      },
    ]);
  }

  function removeItem(id: string) {
    if (items.length === 1) {
      return;
    }

    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-60">Description</TableHead>
            <TableHead className="min-w-28">HSN</TableHead>
            <TableHead className="min-w-28">SAC</TableHead>
            <TableHead className="min-w-24 text-right">Qty</TableHead>
            <TableHead className="min-w-32 text-right">Unit price</TableHead>
            <TableHead className="min-w-28">GST</TableHead>
            <TableHead className="min-w-24">TDS</TableHead>
            <TableHead className="min-w-24">TCS</TableHead>
            <TableHead className="min-w-32 text-right">Line total</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {calculation.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Input
                  value={item.description}
                  placeholder="Website design, consulting, retainer..."
                  onChange={(event) =>
                    updateItem(item.id, "description", event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={item.hsnCode}
                  placeholder="9983"
                  onChange={(event) =>
                    updateItem(item.id, "hsnCode", event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={item.sacCode ?? ""}
                  placeholder="0044"
                  onChange={(event) =>
                    updateItem(item.id, "sacCode", event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  min={0}
                  step="0.01"
                  type="number"
                  value={item.quantity}
                  className="text-right"
                  onChange={(event) =>
                    updateItem(item.id, "quantity", event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  min={0}
                  step="0.01"
                  type="number"
                  value={item.unitPrice}
                  className="text-right"
                  onChange={(event) =>
                    updateItem(item.id, "unitPrice", event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Select
                  value={String(item.gstRate)}
                  options={gstRateOptions}
                  onChange={(event) =>
                    updateItem(item.id, "gstRate", event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  min={0}
                  step="0.01"
                  type="number"
                  value={item.tdsRate ?? 0}
                  onChange={(event) =>
                    updateItem(item.id, "tdsRate", event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  min={0}
                  step="0.01"
                  type="number"
                  value={item.tcsRate ?? 0}
                  onChange={(event) =>
                    updateItem(item.id, "tcsRate", event.target.value)
                  }
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.total, currency)}
              </TableCell>
              <TableCell>
                <Button
                  aria-label="Remove line item"
                  variant="ghost"
                  size="icon"
                  disabled={items.length === 1}
                  onClick={() => removeItem(item.id)}
                >
                  X
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={8}>Invoice total</TableCell>
            <TableCell className="text-right">
              {formatCurrency(calculation.totals.grandTotal, currency)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
      <Button variant="outline" onClick={addItem}>
        Add line item
      </Button>
    </div>
  );
}
