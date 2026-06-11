export type GstType = "CGST_SGST" | "IGST";

export type InvoiceLineItemInput = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  hsnCode: string;
  sacCode?: string;
  gstRate: number;
  tdsRate?: number;
  tcsRate?: number;
};

export type CalculatedLineItem = InvoiceLineItemInput & {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  total: number;
};

export type GstTotals = {
  gstType: GstType;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
};

export type GstCalculation = {
  items: CalculatedLineItem[];
  totals: GstTotals;
};

export function detectGstType(
  sellerState: string,
  buyerState: string,
): GstType {
  return normalizeState(sellerState) === normalizeState(buyerState)
    ? "CGST_SGST"
    : "IGST";
}

export function calculateLineItems(
  items: InvoiceLineItemInput[],
  sellerState: string,
  buyerState: string,
): GstCalculation {
  const gstType = detectGstType(sellerState, buyerState);
  const calculatedItems = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const gstRate = Number(item.gstRate) || 0;
    const tdsRate = Number(item.tdsRate) || 0;
    const tcsRate = Number(item.tcsRate) || 0;
    const taxableAmount = roundCurrency(quantity * unitPrice);
    const totalTax = roundCurrency(taxableAmount * normalizeRate(gstRate));
    const tdsAmount = roundCurrency(taxableAmount * normalizeRate(tdsRate));
    const tcsAmount = roundCurrency(taxableAmount * normalizeRate(tcsRate));

    if (gstType === "CGST_SGST") {
      const cgst = roundCurrency(totalTax / 2);
      const sgst = roundCurrency(totalTax - cgst);

      return {
        ...item,
        quantity,
        unitPrice,
        gstRate,
        taxableAmount,
        cgst,
        sgst,
        igst: 0,
        totalTax,
        tdsAmount,
        tcsAmount,
        total: roundCurrency(taxableAmount + totalTax),
      };
    }

    return {
      ...item,
      quantity,
      unitPrice,
      gstRate,
      taxableAmount,
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      totalTax,
      tdsAmount,
      tcsAmount,
      total: roundCurrency(taxableAmount + totalTax),
    };
  });

  const subtotal = roundCurrency(
    calculatedItems.reduce((sum, item) => sum + item.taxableAmount, 0),
  );
  const cgst = roundCurrency(
    calculatedItems.reduce((sum, item) => sum + item.cgst, 0),
  );
  const sgst = roundCurrency(
    calculatedItems.reduce((sum, item) => sum + item.sgst, 0),
  );
  const igst = roundCurrency(
    calculatedItems.reduce((sum, item) => sum + item.igst, 0),
  );
  const totalTax = roundCurrency(cgst + sgst + igst);

  return {
    items: calculatedItems,
    totals: {
      gstType,
      subtotal,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal: roundCurrency(subtotal + totalTax),
    },
  };
}

export function formatCurrency(amount: number, currency = "INR"): string {
  const resolvedCurrency =
    currency === "INR" && typeof window !== "undefined"
      ? window.localStorage.getItem("workspaceCurrency") || currency
      : currency;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeState(state: string): string {
  return state.trim().toUpperCase();
}

function normalizeRate(gstRate: number): number {
  return gstRate > 1 ? gstRate / 100 : gstRate;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
