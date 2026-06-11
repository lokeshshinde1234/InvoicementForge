export const INDIAN_STATES = [
  'AN',
  'AP',
  'AR',
  'AS',
  'BR',
  'CH',
  'CT',
  'DN',
  'DD',
  'DL',
  'GA',
  'GJ',
  'HR',
  'HP',
  'JK',
  'JH',
  'KA',
  'KL',
  'LA',
  'LD',
  'MP',
  'MH',
  'MN',
  'ML',
  'MZ',
  'NL',
  'OD',
  'PY',
  'PB',
  'RJ',
  'SK',
  'TN',
  'TG',
  'TR',
  'UP',
  'UT',
  'WB',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];
export type GstType = 'CGST_SGST' | 'IGST';

export type GstBreakdown = {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

export type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  discount?: number;
};

export type TaxedLineItem = LineItem & {
  taxableAmount: number;
  gstType: GstType;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  total: number;
};

export function detectGstType(
  sellerState: string,
  buyerState: string,
): GstType {
  return normalizeState(sellerState) === normalizeState(buyerState)
    ? 'CGST_SGST'
    : 'IGST';
}

export function calculateGst(
  amount: number,
  gstRate: number,
  type: GstType,
): GstBreakdown {
  const taxableAmount = roundCurrency(amount);
  const totalTax = roundCurrency(taxableAmount * normalizeRate(gstRate));

  if (type === 'CGST_SGST') {
    const halfTax = roundCurrency(totalTax / 2);
    return {
      cgst: halfTax,
      sgst: roundCurrency(totalTax - halfTax),
      igst: 0,
      total: roundCurrency(taxableAmount + totalTax),
    };
  }

  return {
    cgst: 0,
    sgst: 0,
    igst: totalTax,
    total: roundCurrency(taxableAmount + totalTax),
  };
}

export function calculateLineItemTax(
  lineItem: LineItem,
  sellerState: string,
  buyerState: string,
): TaxedLineItem {
  const quantity = Number(lineItem.quantity);
  const unitPrice = Number(lineItem.unitPrice);
  const discount = Number(lineItem.discount ?? 0);
  const taxableAmount = roundCurrency(quantity * unitPrice - discount);
  const gstType = detectGstType(sellerState, buyerState);
  const tax = calculateGst(taxableAmount, lineItem.gstRate, gstType);

  return {
    ...lineItem,
    discount,
    taxableAmount,
    gstType,
    cgst: tax.cgst,
    sgst: tax.sgst,
    igst: tax.igst,
    totalTax: roundCurrency(tax.cgst + tax.sgst + tax.igst),
    total: tax.total,
  };
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
