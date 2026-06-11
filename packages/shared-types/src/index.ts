export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

export type Invoice = {
  id: string;
  items: InvoiceItem[];
  subtotal: number;
  gst: number;
  total: number;
};
