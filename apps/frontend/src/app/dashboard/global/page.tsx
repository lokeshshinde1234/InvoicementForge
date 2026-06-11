"use client";

import {
  WorkspaceRecordsPage,
  type WorkspaceRecord,
} from "@/components/dashboard/WorkspaceRecordsPage";

type BusinessSettings = {
  id: string;
  legalName?: string | null;
  gstin?: string | null;
  sellerState?: string | null;
  baseCurrency: string;
  countryCode: string;
  taxSystem: string;
  fiscalYearStart?: string | null;
  supportedCurrencies?: string[];
  taxSettings?: Record<string, unknown>;
  updatedAt: string;
  createdAt: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number | string;
  createdAt: string;
};

const globalTabs = [
  {
    id: "all",
    label: "All global records",
    description: "Currency, tax, fiscal, and country settings for this company.",
    filter: () => true,
  },
  {
    id: "currency",
    label: "Currencies",
    filter: (record: WorkspaceRecord) => record.category === "Currency",
  },
  {
    id: "tax",
    label: "Tax systems",
    filter: (record: WorkspaceRecord) => record.category === "Tax system",
  },
  {
    id: "fiscal",
    label: "Fiscal settings",
    filter: (record: WorkspaceRecord) => record.category === "Fiscal year",
  },
  {
    id: "country",
    label: "Country tax",
    filter: (record: WorkspaceRecord) => record.category === "Country tax",
  },
  {
    id: "documents",
    label: "Global invoices",
    filter: (record: WorkspaceRecord) => record.category === "Global invoice",
  },
];

export default function GlobalSettingsPage() {
  return (
    <WorkspaceRecordsPage
      active="Global"
      eyebrow="Global business support"
      title="Currencies, tax systems, and fiscal settings"
      description="Global business settings and records are grouped by currencies, tax systems, fiscal year, country tax settings, and global invoices."
      sources={[
        {
          label: "Business settings",
          endpoint: "/business-settings",
          map: (data) => {
            const settings = data as BusinessSettings;
            const currencies = settings.supportedCurrencies?.length
              ? settings.supportedCurrencies
              : [settings.baseCurrency];

            return [
              ...currencies.map((currency) => ({
                id: `currency-${currency}`,
                title: currency,
                subtitle: currency === settings.baseCurrency ? "Base currency" : "Supported currency",
                status: currency === settings.baseCurrency ? "BASE" : "SUPPORTED",
                currency,
                date: settings.updatedAt ?? settings.createdAt,
                category: "Currency",
              })),
              {
                id: `tax-${settings.id}`,
                title: settings.taxSystem,
                subtitle: "Workspace tax system",
                status: "ACTIVE",
                date: settings.updatedAt ?? settings.createdAt,
                category: "Tax system",
                details: [
                  { label: "GSTIN", value: settings.gstin },
                  { label: "Seller state", value: settings.sellerState },
                ],
              },
              {
                id: `fiscal-${settings.id}`,
                title: settings.fiscalYearStart ? "Custom fiscal year" : "Default fiscal year",
                subtitle: settings.fiscalYearStart ? new Date(settings.fiscalYearStart).toLocaleDateString() : "Not configured",
                status: settings.fiscalYearStart ? "CONFIGURED" : "DEFAULT",
                date: settings.fiscalYearStart ?? settings.updatedAt ?? settings.createdAt,
                category: "Fiscal year",
              },
              {
                id: `country-${settings.id}`,
                title: settings.countryCode,
                subtitle: settings.legalName ?? "Company country setting",
                status: settings.taxSystem,
                date: settings.updatedAt ?? settings.createdAt,
                category: "Country tax",
                details: [{ label: "Tax settings", value: Object.keys(settings.taxSettings ?? {}).join(", ") }],
              },
            ];
          },
        },
        {
          label: "Invoices",
          endpoint: "/invoices",
          map: (data) =>
            (data as Invoice[]).map((invoice) => ({
              id: `invoice-${invoice.id}`,
              title: invoice.invoiceNumber,
              subtitle: "Invoice currency record",
              status: invoice.status,
              amount: invoice.total,
              date: invoice.createdAt,
              category: "Global invoice",
              href: `/invoices/${invoice.id}`,
              pdfPath: `/invoices/${invoice.id}/pdf`,
              pdfFilename: `${invoice.invoiceNumber}.pdf`,
            })),
        },
      ]}
      tabs={globalTabs}
      emptyTitle="No global records found"
      emptyDescription="Configure business settings or create invoices to populate global records."
    />
  );
}
