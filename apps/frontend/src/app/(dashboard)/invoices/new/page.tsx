"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { create } from "zustand";
import { LineItemTable } from "@/components/invoice/LineItemTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  calculateLineItems,
  detectGstType,
  formatCurrency,
  type InvoiceLineItemInput,
} from "@/lib/gst";
import {
  CompanyBrandHeader,
  useCompanyBranding,
} from "@/components/branding/CompanyBranding";

type Client = {
  id: string;
  name?: string;
  companyName?: string;
  email?: string;
  state?: string;
};

type BusinessSettings = {
  sellerState?: string | null;
  baseCurrency: string;
};

type InvoiceResponse = {
  id: string;
};

type InvoiceBuilderState = {
  items: InvoiceLineItemInput[];
  setItems: (items: InvoiceLineItemInput[]) => void;
};

const useInvoiceBuilderStore = create<InvoiceBuilderState>((set) => ({
  items: [
    {
      id: "line-1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      hsnCode: "",
      sacCode: "",
      gstRate: 18,
      tdsRate: 0,
      tcsRate: 0,
    },
  ],
  setItems: (items) => set({ items }),
}));

const stateOptions = [
  "AN",
  "AP",
  "AR",
  "AS",
  "BR",
  "CH",
  "CT",
  "DL",
  "GA",
  "GJ",
  "HR",
  "HP",
  "JK",
  "KA",
  "KL",
  "LA",
  "MH",
  "MP",
  "OD",
  "PB",
  "RJ",
  "TN",
  "TG",
  "UP",
  "WB",
].map((state) => ({ value: state, label: state }));

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  sellerState: z.string().min(1),
  buyerState: z.string().min(1),
  dueDate: z.string().min(1, "Select a payment due date"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const queryClient = new QueryClient();

export default function NewInvoicePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <InvoiceBuilder />
    </QueryClientProvider>
  );
}

function InvoiceBuilder() {
  const { branding } = useCompanyBranding();
  const router = useRouter();
  const { items, setItems } = useInvoiceBuilderStore();
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: "",
      sellerState: "MH",
      buyerState: "MH",
      dueDate: getDefaultDueDate(),
    },
  });

  const sellerState = form.watch("sellerState");
  const buyerState = form.watch("buyerState");
  const dueDate = form.watch("dueDate");
  const selectedClientId = form.watch("clientId");
  const calculation = useMemo(
    () => calculateLineItems(items, sellerState, buyerState),
    [buyerState, items, sellerState],
  );
  const gstType = detectGstType(sellerState, buyerState);
  const settingsQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const response = await api.get<BusinessSettings>("/business-settings");
      return response.data;
    },
  });
  const workspaceCurrency = settingsQuery.data?.baseCurrency ?? "INR";

  useEffect(() => {
    if (settingsQuery.data?.baseCurrency) {
      window.localStorage.setItem(
        "workspaceCurrency",
        settingsQuery.data.baseCurrency,
      );
    }

    if (!settingsQuery.data?.sellerState) {
      return;
    }

    form.setValue("sellerState", settingsQuery.data.sellerState);
  }, [form, settingsQuery.data?.sellerState]);

  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await api.get<Client[]>("/clients");
      return response.data;
    },
  });

  const createClient = useMutation({
    mutationFn: async () => {
      const response = await api.post<Client>("/clients", {
        name: newClientName,
        companyName: newClientName,
        email: newClientEmail || null,
        state: buyerState,
      });

      return response.data;
    },
    onSuccess: (client) => {
      form.setValue("clientId", client.id);
      setNewClientName("");
      setNewClientEmail("");
      void clientsQuery.refetch();
    },
  });

  const clientOptions =
    clientsQuery.data?.map((client) => ({
      value: client.id,
      label:
        client.companyName ?? client.name ?? client.email ?? "Unnamed client",
    })) ?? [];

  const createInvoice = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const response = await api.post<InvoiceResponse>("/invoices", {
        clientId: values.clientId,
        lineItems: calculation.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          hsnCode: item.hsnCode,
          sacCode: item.sacCode,
          gstRate: item.gstRate,
          tdsRate: item.tdsRate,
          tcsRate: item.tcsRate,
        })),
        dueDate: values.dueDate,
        notes: `GST type: ${gstType}. Seller state: ${values.sellerState}. Buyer state: ${values.buyerState}.`,
      });

      return response.data;
    },
    onSuccess: (invoice) => {
      router.push(`/invoices/${invoice.id}`);
    },
  });

  const selectedClient = clientsQuery.data?.find(
    (client) => client.id === selectedClientId,
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CompanyBrandHeader branding={branding} subtitle="Invoice builder" />
              <p className="text-sm font-medium uppercase text-cyan-700">
                InvoiceForge builder
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Create a GST-ready invoice in minutes
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                A focused workspace for pricing, taxes, client context, and
                totals that update as you type.
              </p>
            </div>
            <Button
              type="submit"
              form="invoice-builder-form"
              disabled={createInvoice.isPending || clientsQuery.isLoading}
              className="w-full sm:w-auto"
            >
              {createInvoice.isPending ? "Creating..." : "Create invoice"}
            </Button>
          </div>
        </div>
      </section>

      <form
        id="invoice-builder-form"
        className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] lg:px-8"
        onSubmit={form.handleSubmit((values) => createInvoice.mutate(values))}
      >
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client and tax route</CardTitle>
              <CardDescription>
                Select the buyer and states to calculate CGST/SGST or IGST.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Client
                </span>
                <Select
                  value={selectedClientId}
                  placeholder={
                    clientsQuery.isLoading
                      ? "Loading clients..."
                      : "Select client"
                  }
                  options={clientOptions}
                  onChange={(event) =>
                    form.setValue("clientId", event.target.value)
                  }
                />
                {form.formState.errors.clientId ? (
                  <span className="text-xs text-red-600">
                    {form.formState.errors.clientId.message}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Seller state
                </span>
                <Select
                  value={sellerState}
                  options={stateOptions}
                  onChange={(event) =>
                    form.setValue("sellerState", event.target.value)
                  }
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Buyer state
                </span>
                <Select
                  value={buyerState}
                  options={stateOptions}
                  onChange={(event) =>
                    form.setValue("buyerState", event.target.value)
                  }
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Payment due date
                </span>
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().slice(0, 10)}
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  onChange={(event) =>
                    form.setValue("dueDate", event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                {form.formState.errors.dueDate ? (
                  <span className="text-xs text-red-600">
                    {form.formState.errors.dueDate.message}
                  </span>
                ) : null}
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick client</CardTitle>
              <CardDescription>
                Add a client without leaving the invoice builder.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                value={newClientName}
                placeholder="Client or company name"
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                onChange={(event) => setNewClientName(event.target.value)}
              />
              <input
                value={newClientEmail}
                type="email"
                placeholder="Email optional"
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                onChange={(event) => setNewClientEmail(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!newClientName.trim() || createClient.isPending}
                onClick={() => createClient.mutate()}
              >
                Add client
              </Button>
              {createClient.isError ? (
                <p className="text-sm text-red-600 md:col-span-3">
                  Could not create client. Check your API connection.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
              <CardDescription>
                Add services, products, HSN codes, quantities, prices, and GST
                rates.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="max-w-full overflow-x-auto">
                <LineItemTable
                  items={items}
                  currency={workspaceCurrency}
                  sellerState={sellerState}
                  buyerState={buyerState}
                  onChange={setItems}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-950 text-white">
              <CardTitle>Live GST breakdown</CardTitle>
              <CardDescription className="text-slate-300">
                {gstType === "CGST_SGST"
                  ? "Intra-state invoice"
                  : "Inter-state invoice"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <SummaryRow
                label="Subtotal"
                value={calculation.totals.subtotal}
                currency={workspaceCurrency}
              />
              {gstType === "CGST_SGST" ? (
                <>
                  <SummaryRow label="CGST" value={calculation.totals.cgst} currency={workspaceCurrency} />
                  <SummaryRow label="SGST" value={calculation.totals.sgst} currency={workspaceCurrency} />
                </>
              ) : (
                <SummaryRow label="IGST" value={calculation.totals.igst} currency={workspaceCurrency} />
              )}
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Grand total
                </span>
                <span className="text-2xl font-semibold tracking-tight">
                  {formatCurrency(calculation.totals.grandTotal, workspaceCurrency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice readiness</CardTitle>
              <CardDescription>
                {selectedClient
                  ? `Prepared for ${
                      selectedClient.companyName ??
                      selectedClient.name ??
                      selectedClient.email
                    }`
                  : "Choose a client to complete the invoice."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <StatusLine
                active={items.some((item) => item.description.trim())}
              >
                Line descriptions added
              </StatusLine>
              <StatusLine active={calculation.totals.grandTotal > 0}>
                Pricing and tax totals ready
              </StatusLine>
              <StatusLine active={Boolean(selectedClientId)}>
                Client selected
              </StatusLine>
              <StatusLine active={Boolean(dueDate)}>
                Payment due {formatDisplayDate(dueDate)}
              </StatusLine>
              {createInvoice.isError ? (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  Could not create invoice. Please check the API connection.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </form>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  currency = "INR",
}: {
  label: string;
  value: number;
  currency?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{formatCurrency(value, currency)}</span>
    </div>
  );
}

function StatusLine({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          active
            ? "h-2.5 w-2.5 rounded-full bg-emerald-500"
            : "h-2.5 w-2.5 rounded-full bg-slate-300"
        }
      />
      <span>{children}</span>
    </div>
  );
}

function getDefaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "not set";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
