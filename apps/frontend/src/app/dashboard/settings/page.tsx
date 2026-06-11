"use client";

import { useEffect, useMemo, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

const queryClient = new QueryClient();

type BusinessSettings = {
  legalName?: string | null;
  gstin?: string | null;
  sellerState?: string | null;
  baseCurrency: string;
  countryCode: string;
  supportedCurrencies: string[];
};

type SettingsFormState = {
  legalName: string;
  gstin: string;
  sellerState: string;
  baseCurrency: string;
  countryCode: string;
  supportedCurrencies: string[];
};

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

const currencyOptions = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "AUD",
  "CAD",
  "SGD",
  "JPY",
  "CHF",
  "SAR",
  "ZAR",
].map((currency) => ({ value: currency, label: currency }));

const countryOptions = [
  ["IN", "India"],
  ["US", "United States"],
  ["AE", "United Arab Emirates"],
  ["GB", "United Kingdom"],
  ["SG", "Singapore"],
  ["AU", "Australia"],
  ["CA", "Canada"],
].map(([value, label]) => ({ value, label }));

export default function SettingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsContent />
    </QueryClientProvider>
  );
}

function SettingsContent() {
  const settingsQuery = useQuery({
    queryKey: ["dashboard-settings"],
    queryFn: async () => {
      const response = await api.get<BusinessSettings>("/business-settings");
      return response.data;
    },
  });

  const [form, setForm] = useState<SettingsFormState>({
    legalName: "",
    gstin: "",
    sellerState: "MH",
    baseCurrency: "INR",
    countryCode: "IN",
    supportedCurrencies: ["INR"],
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    const nextState: SettingsFormState = {
      legalName: settingsQuery.data.legalName ?? "",
      gstin: settingsQuery.data.gstin ?? "",
      sellerState: settingsQuery.data.sellerState ?? "MH",
      baseCurrency: settingsQuery.data.baseCurrency ?? "INR",
      countryCode: settingsQuery.data.countryCode ?? "IN",
      supportedCurrencies:
        settingsQuery.data.supportedCurrencies?.length
          ? settingsQuery.data.supportedCurrencies
          : [settingsQuery.data.baseCurrency ?? "INR"],
    };

    setForm(nextState);
    window.localStorage.setItem("workspaceCurrency", nextState.baseCurrency);
  }, [settingsQuery.data]);

  const isDirty = useMemo(() => {
    if (!settingsQuery.data) {
      return false;
    }

    const originalSupported = [...(settingsQuery.data.supportedCurrencies ?? [])]
      .sort()
      .join(",");
    const currentSupported = [...form.supportedCurrencies].sort().join(",");

    return (
      form.legalName !== (settingsQuery.data.legalName ?? "") ||
      form.gstin !== (settingsQuery.data.gstin ?? "") ||
      form.sellerState !== (settingsQuery.data.sellerState ?? "MH") ||
      form.baseCurrency !== (settingsQuery.data.baseCurrency ?? "INR") ||
      form.countryCode !== (settingsQuery.data.countryCode ?? "IN") ||
      currentSupported !== originalSupported
    );
  }, [form, settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SettingsFormState) => {
      const response = await api.patch<BusinessSettings>("/business-settings", {
        legalName: payload.legalName || null,
        gstin: payload.gstin || null,
        sellerState: payload.sellerState,
        baseCurrency: payload.baseCurrency,
        countryCode: payload.countryCode,
        supportedCurrencies: Array.from(
          new Set([...payload.supportedCurrencies, payload.baseCurrency]),
        ),
      });

      return response.data;
    },
    onSuccess: (data) => {
      window.localStorage.setItem("workspaceCurrency", data.baseCurrency);
      void settingsQuery.refetch();
    },
  });

  function updateForm<K extends keyof SettingsFormState>(
    key: K,
    value: SettingsFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSupportedCurrency(currency: string) {
    setForm((current) => {
      const exists = current.supportedCurrencies.includes(currency);
      if (exists && current.baseCurrency === currency) {
        return current;
      }

      return {
        ...current,
        supportedCurrencies: exists
          ? current.supportedCurrencies.filter((item) => item !== currency)
          : [...current.supportedCurrencies, currency],
      };
    });
  }

  function handleBaseCurrencyChange(currency: string) {
    setForm((current) => ({
      ...current,
      baseCurrency: currency,
      supportedCurrencies: current.supportedCurrencies.includes(currency)
        ? current.supportedCurrencies
        : [...current.supportedCurrencies, currency],
    }));
  }

  return (
    <DashboardShell active="Settings">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Workspace settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Company profile and currency setup
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Update your legal identity, GST selling state, base currency, country code, and supported currencies. Saved changes update the workspace settings table in the database.
          </p>
        </section>

        {settingsQuery.isLoading ? (
          <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
        ) : settingsQuery.isError || !settingsQuery.data ? (
          <EmptyState
            title="Settings unavailable"
            description="We could not load workspace settings right now."
            actionLabel="Retry"
            onAction={() => settingsQuery.refetch()}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Editable workspace settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Legal name">
                    <Input
                      value={form.legalName}
                      placeholder="InvoiceForge Private Limited"
                      onChange={(event) =>
                        updateForm("legalName", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="GSTIN">
                    <Input
                      value={form.gstin}
                      placeholder="27ABCDE1234F1Z5"
                      onChange={(event) =>
                        updateForm("gstin", event.target.value.toUpperCase())
                      }
                    />
                  </Field>
                  <Field label="Seller state / GST state">
                    <Select
                      value={form.sellerState}
                      options={stateOptions}
                      onChange={(event) =>
                        updateForm("sellerState", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Country code">
                    <Select
                      value={form.countryCode}
                      options={countryOptions}
                      onChange={(event) =>
                        updateForm("countryCode", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Base currency">
                    <Select
                      value={form.baseCurrency}
                      options={currencyOptions}
                      onChange={(event) =>
                        handleBaseCurrencyChange(event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Primary support">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      The base currency is always included in supported currencies and becomes the default company currency across the app.
                    </div>
                  </Field>
                </div>

                <Field label="Supported currencies">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {currencyOptions.map((currency) => {
                      const checked = form.supportedCurrencies.includes(
                        currency.value,
                      );
                      const locked = form.baseCurrency === currency.value;

                      return (
                        <label
                          key={currency.value}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                            checked
                              ? "border-teal-300 bg-teal-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={locked}
                            onChange={() =>
                              toggleSupportedCurrency(currency.value)
                            }
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {currency.value}
                            </p>
                            <p className="text-xs text-slate-500">
                              {locked ? "Base currency" : "Available to workspace"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </Field>

                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={!isDirty || saveMutation.isPending}
                    onClick={() => saveMutation.mutate(form)}
                  >
                    {saveMutation.isPending ? "Saving..." : "Save workspace settings"}
                  </Button>
                  {saveMutation.isSuccess ? (
                    <span className="text-sm font-medium text-emerald-700">
                      Settings saved successfully.
                    </span>
                  ) : null}
                  {saveMutation.isError ? (
                    <span className="text-sm font-medium text-red-700">
                      Could not save settings. Please try again.
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Current company setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <PreviewRow label="Legal name" value={form.legalName || "Not configured"} />
                  <PreviewRow label="GSTIN" value={form.gstin || "Not configured"} />
                  <PreviewRow label="Selling state" value={form.sellerState || "Not configured"} />
                  <PreviewRow label="Base currency" value={form.baseCurrency} />
                  <PreviewRow label="Country code" value={form.countryCode} />
                  <PreviewRow
                    label="Supported currencies"
                    value={form.supportedCurrencies.join(", ")}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>What this affects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    The saved base currency becomes the company currency used by dashboard summaries and invoice-related displays.
                  </p>
                  <p>
                    Seller state is used in GST-aware invoice workflows to decide intra-state versus inter-state tax behavior.
                  </p>
                  <p>
                    Supported currencies can be shown as available workspace currency options for future document and client-side flows.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}
