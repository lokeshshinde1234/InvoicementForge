export type DashboardInvoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: string;
  total: number | string;
  dueDate: string;
  createdAt: string;
};

export type DashboardProposal = {
  id: string;
  title: string;
  clientId: string;
  status: string;
  totalAmount: number | string;
  portalToken: string;
  createdAt: string;
};

export type DashboardClient = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  createdAt?: string;
};

export type DashboardDocument = {
  id: string;
  title: string;
  type: string;
  status: string;
  clientId?: string | null;
  amount?: number | string;
  createdAt: string;
};

export type DashboardIntegration = {
  provider: string;
  status: string;
};

export type DashboardBusinessSettings = {
  legalName?: string | null;
  gstin?: string | null;
  sellerState?: string | null;
  baseCurrency: string;
  countryCode: string;
  supportedCurrencies: string[];
};

export type DashboardOverview = {
  clients: DashboardClient[];
  invoices: DashboardInvoice[];
  proposals: DashboardProposal[];
  documents: DashboardDocument[];
  gstReports: Array<{ id: string; type: string; period: string; createdAt: string }>;
  integrations: DashboardIntegration[];
  businessSettings: DashboardBusinessSettings;
};

export function currencyFormatter(currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export function normalizeAmount(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

export function formatRelativeDate(value: string | undefined): string {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  return "Today";
}
