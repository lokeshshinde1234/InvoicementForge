"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Client = {
  id: string;
};

const COUNTRIES = [
  { name: "India", code: "IN", dialCode: "+91" },
  { name: "United States", code: "US", dialCode: "+1" },
  { name: "United Kingdom", code: "GB", dialCode: "+44" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971" },
  { name: "Australia", code: "AU", dialCode: "+61" },
  { name: "Canada", code: "CA", dialCode: "+1" },
  { name: "Germany", code: "DE", dialCode: "+49" },
  { name: "France", code: "FR", dialCode: "+33" },
  { name: "Singapore", code: "SG", dialCode: "+65" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966" },
];

const NSN_LENGTHS: Record<string, number> = {
  US: 10,
  CA: 10,
  IN: 10,
  GB: 10,
  AU: 9,
  AE: 9,
  DE: 10,
  FR: 9,
  SG: 8,
  SA: 9,
};

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [gstin, setGstin] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedCountry =
    COUNTRIES.find((country) => country.dialCode === countryCode) ?? COUNTRIES[0];
  const maxPhoneDigits = NSN_LENGTHS[selectedCountry.code] ?? 10;

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = phone.trim() ? `${countryCode} ${phone.trim()}` : null;

      const response = await api.post<Client>("/clients", {
        name: name.trim(),
        companyName: companyName.trim() || name.trim(),
        email: email.trim() || null,
        phone: formattedPhone,
        gstin: gstin.trim().toUpperCase() || null,
        state: state.trim().toUpperCase() || null,
        address: address.trim() || null,
      });

      router.push(`/clients/${response.data.id}`);
    } catch (requestError) {
      const message =
        typeof requestError === "object" &&
        requestError !== null &&
        "response" in requestError
          ? (requestError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;

      setError(message ?? "Could not create client. Please check the details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell active="Clients">
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Company CRM
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Create client
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Add a client to this company workspace so proposals, invoices,
                GST details, and portal access can use the same saved record.
              </p>
            </div>
            <Link
              href="/clients"
              className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to clients
            </Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Client details</CardTitle>
              <CardDescription>
                Capture the same professional client profile used across proposals,
                invoices, GST reports, and the client portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={createClient} className="grid gap-5">
                <FormSection
                  title="Identity"
                  description="Start with the primary contact and company name shown on records."
                >
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

                <FormSection
                  title="Contact"
                  description="Use verified contact details for portal password setup and document emails."
                >
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
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(event) => {
                            const nextCountry =
                              COUNTRIES.find(
                                (country) => country.dialCode === event.target.value,
                              ) ?? COUNTRIES[0];
                            const nextMaxDigits = NSN_LENGTHS[nextCountry.code] ?? 10;

                            setCountryCode(event.target.value);
                            setPhone((current) => current.slice(0, nextMaxDigits));
                          }}
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                        >
                          {COUNTRIES.map((country) => (
                            <option key={country.code} value={country.dialCode}>
                              {country.code} {country.dialCode}
                            </option>
                          ))}
                        </select>
                        <Input
                          value={phone}
                          maxLength={maxPhoneDigits}
                          onChange={(event) => {
                            const digits = event.target.value.replace(/\D/g, "");
                            setPhone(digits.slice(0, maxPhoneDigits));
                          }}
                          placeholder="9876543210"
                        />
                      </div>
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  title="Portal password"
                  description="Clients create their own password on first login. Owners can only see whether it exists."
                >
                  <Field label="Password status">
                    <Input value="Password Not Created" disabled />
                  </Field>
                </FormSection>

                <FormSection
                  title="Tax and billing"
                  description="Save GST, state, and address details once so invoices stay clean."
                >
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
                    disabled={loading || !name.trim()}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {loading ? "Creating..." : "Create client"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/clients")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit rounded-lg border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
              <CardDescription>
                The client is saved inside the current company workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm leading-6 text-slate-600">
              <InfoRow title="Proposals" body="Select this client when creating a new proposal." />
              <InfoRow title="Invoices" body="Reuse contact, GST, and billing data on invoice forms." />
              <InfoRow title="Portal" body="Client portal access uses the saved email address. The client creates their own password on first login." />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
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

function InfoRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}
