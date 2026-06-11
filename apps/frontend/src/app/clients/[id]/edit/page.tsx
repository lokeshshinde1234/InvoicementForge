"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const queryClient = new QueryClient();

type Client = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  state?: string | null;
  address?: string | null;
  isPasswordCreated?: boolean;
};

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <QueryClientProvider client={queryClient}>
      <EditClientRoute clientId={id} />
    </QueryClientProvider>
  );
}

function EditClientRoute({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clientQuery = useQuery({
    queryKey: ["client-edit", clientId],
    queryFn: async () => (await api.get<Client>(`/clients/${clientId}`)).data,
  });

  useEffect(() => {
    if (!clientQuery.data) {
      return;
    }

    setName(clientQuery.data.name ?? "");
    setCompanyName(clientQuery.data.companyName ?? "");
    setEmail(clientQuery.data.email ?? "");
    setPhone(clientQuery.data.phone ?? "");
    setGstin(clientQuery.data.gstin ?? "");
    setState(clientQuery.data.state ?? "");
    setAddress(clientQuery.data.address ?? "");
  }, [clientQuery.data]);

  async function updateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    setSaving(true);

    try {
      await api.patch<Client>(`/clients/${clientId}`, {
        name: name.trim(),
        companyName: companyName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        gstin: gstin.trim().toUpperCase() || null,
        state: state.trim().toUpperCase() || null,
        address: address.trim() || null,
      });

      router.push(`/clients/${clientId}`);
    } catch (requestError) {
      const message =
        typeof requestError === "object" &&
        requestError !== null &&
        "response" in requestError
          ? (requestError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;

      setError(message ?? "Could not update client. Please check the details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell active="Clients">
      {clientQuery.isLoading ? (
        <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
      ) : clientQuery.isError || !clientQuery.data ? (
        <EmptyState
          title="Client unavailable"
          description="We could not load this client for editing right now."
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Company CRM
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Edit client
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Update contact, GST, and billing details used across proposals,
                  invoices, and the client portal.
                </p>
              </div>
              <Link
                href={`/clients/${clientId}`}
                className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to profile
              </Link>
            </div>
          </section>

          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Client information</CardTitle>
              <CardDescription>
                Changes save to the current company workspace immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={updateClient} className="grid gap-5">
                <FormSection title="Identity">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Contact name" required>
                      <Input
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Primary contact name"
                      />
                    </Field>
                    <Field label="Client company">
                      <Input
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="Company or trading name"
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Contact">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email">
                      <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="client@company.com"
                      />
                    </Field>
                    <Field label="Phone">
                      <Input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Portal password">
                  <Field label="Password status">
                    <Input
                      value={
                        clientQuery.data.isPasswordCreated
                          ? "Password Created"
                          : "Password Not Created"
                      }
                      disabled
                    />
                  </Field>
                </FormSection>

                <FormSection title="Tax and billing">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="GSTIN / Tax ID">
                      <Input
                        value={gstin}
                        onChange={(event) => setGstin(event.target.value.toUpperCase())}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </Field>
                    <Field label="State / region">
                      <Input
                        value={state}
                        onChange={(event) => setState(event.target.value.toUpperCase())}
                        placeholder="MH"
                      />
                    </Field>
                  </div>
                  <Field label="Billing address">
                    <textarea
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Street, city, state, postal code"
                      rows={4}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                    />
                  </Field>
                </FormSection>

                {error ? (
                  <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/clients/${clientId}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
