"use client";

import { useMemo, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const queryClient = new QueryClient();

type Row = Record<string, string | null>;
type ClientRecord = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  state?: string | null;
  address?: string | null;
};

export default function ClientsImportPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientsImportContent />
    </QueryClientProvider>
  );
}

function ClientsImportContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<Row[]>([]);
  const [errors, setErrors] = useState<string | null>(null);
  const [loadingFileName, setLoadingFileName] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [importedClients, setImportedClients] = useState<ClientRecord[]>([]);

  const invalidRows = useMemo(
    () => preview.filter((row) => !(row as Row & { _hasName?: boolean })._hasName),
    [preview],
  );

  const importMutation = useMutation({
    mutationFn: async (clients: ClientRecord[]) => {
      const response = await api.post<ClientRecord[]>("/clients/import", {
        clients,
      });
      return response.data;
    },
    onSuccess: (clients) => {
      setImportedClients(clients);
    },
  });

  async function onFile(file?: File) {
    setErrors(null);
    setImportedClients([]);

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setLoadingFileName(file.name);

    try {
      const rows = await parseFile(file);
      const mapped = rows.map((row) => normalizeRow(row));
      const validated = mapped.map((row) => validateRow(row));
      const missingNameCount = validated.filter((row) => !(row as Row & { _hasName?: boolean })._hasName).length;

      if (missingNameCount > 0) {
        setErrors(`Found ${missingNameCount} row(s) missing the required name field.`);
      }

      setPreview(validated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to read the selected file.";
      setErrors(message);
      setPreview([]);
    } finally {
      setLoadingFileName(null);
    }
  }

  function handleStartImport() {
    fileInputRef.current?.click();
  }

  function handleSaveContacts() {
    if (invalidRows.length > 0) {
      setErrors("Each imported contact must have a name before you can continue.");
      return;
    }

    const clients = preview.map((row) => ({
      id: "",
      name: (row.name as string) ?? "",
      companyName: (row.companyName as string) ?? null,
      email: (row.email as string) ?? null,
      phone: (row.phone as string) ?? null,
      gstin: (row.gstin as string) ?? null,
      state: (row.state as string) ?? null,
      address: (row.address as string) ?? null,
    }));

    importMutation.mutate(clients);
  }

  function handleViewClients() {
    router.push("/clients");
  }

  return (
    <DashboardShell active="Clients">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%)]" />
            <div className="relative flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Client import
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Import contacts from your files
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  Bring in client and employee contact lists from CSV, TSV, TXT, JSON, XLSX, XLS, or VCF files. Every imported contact must include a name.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <HeaderPill
                  label="Accepted files"
                  value="CSV, XLSX, JSON, VCF"
                  tone="teal"
                />
                <HeaderPill
                  label="Required field"
                  value="Name"
                  tone={invalidRows.length > 0 ? "danger" : "slate"}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Choose a file</CardTitle>
              <CardDescription>
                Click Start import to open your file location and select a contact file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,.json,.xlsx,.xls,.vcf,.text/csv,application/json"
                className="hidden"
                onChange={(event) => {
                  void onFile(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {selectedFileName || "No file selected yet"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {loadingFileName
                        ? `Reading ${loadingFileName}...`
                        : "Select a spreadsheet or contact file to preview and import."}
                    </p>
                  </div>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={!!loadingFileName}
                    onClick={handleStartImport}
                  >
                    Start import
                  </Button>
                </div>
              </div>

              {errors ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {errors}
                </div>
              ) : null}

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Preview</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Review the contacts before importing them into the clients section.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {preview.length} rows
                  </span>
                </div>

                {preview.length === 0 ? (
                  <EmptyState
                    title="No contacts loaded yet"
                    description="Once you select a file, the contacts will appear here for review."
                  />
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Ready to save {preview.length} contact{preview.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          These contacts will be created or updated in the client page.
                        </p>
                      </div>
                      <Button
                        className="bg-teal-600 hover:bg-teal-700"
                        disabled={importMutation.isPending || invalidRows.length > 0}
                        onClick={handleSaveContacts}
                      >
                        {importMutation.isPending ? "Saving..." : "Save contacts"}
                      </Button>
                    </div>
                    <div className="mobile-table-scroll max-h-[420px] overflow-auto">
                      <table className="mobile-card-table w-full min-w-[680px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Name</th>
                            <th className="px-4 py-3 font-semibold">Company</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Phone</th>
                            <th className="px-4 py-3 font-semibold">State</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {preview.map((row, index) => {
                            const typed = row as Row & {
                              _hasName?: boolean;
                              _validEmail?: boolean;
                              _validPhone?: boolean;
                            };
                            return (
                              <tr
                                key={`${typed.name ?? "row"}-${index}`}
                                className={!typed._hasName ? "bg-rose-50/60" : "hover:bg-slate-50"}
                              >
                                <td data-label="Name" className="px-4 py-3">
                                  <div className="font-medium text-slate-900">
                                    {typed.name || "Missing name"}
                                  </div>
                                  {!typed._hasName ? (
                                    <div className="mt-1 text-xs font-medium text-rose-700">
                                      Name is mandatory
                                    </div>
                                  ) : null}
                                </td>
                                <td data-label="Company" className="px-4 py-3 text-slate-600">
                                  {typed.companyName || "-"}
                                </td>
                                <td data-label="Email" className={`px-4 py-3 ${typed._validEmail === false ? "text-rose-700" : "text-slate-600"}`}>
                                  {typed.email || "-"}
                                </td>
                                <td data-label="Phone" className={`px-4 py-3 ${typed._validPhone === false ? "text-rose-700" : "text-slate-600"}`}>
                                  {typed.phone || "-"}
                                </td>
                                <td data-label="State" className="px-4 py-3 text-slate-600">
                                  {typed.state || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Import guidance</CardTitle>
                <CardDescription>
                  Contact names are mandatory before import. Other fields are optional.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                <GuidanceRow
                  title="Supported layouts"
                  body="Use columns like name, companyName, email, phone, gstin, state, and address. JSON arrays and vCard contacts are also supported."
                />
                <GuidanceRow
                  title="Required field"
                  body="Every imported contact must have a name. Rows without a name are highlighted and blocked from import."
                />
                <GuidanceRow
                  title="Duplicate handling"
                  body="Existing clients with the same email, phone, or company/name combination are updated instead of duplicated."
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Imported contacts</CardTitle>
                <CardDescription>
                  After import, the created or updated contacts appear here immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {importedClients.length === 0 ? (
                  <EmptyState
                    title="No contacts imported yet"
                    description="Imported contacts will appear here after a successful file import."
                  />
                ) : (
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      onClick={handleViewClients}
                    >
                      View saved contacts
                    </Button>
                    {importedClients.map((client) => (
                      <div
                        key={client.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {client.companyName ?? client.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {client.name}
                            </p>
                          </div>
                          <Link
                            href={`/clients/${client.id}`}
                            className="text-sm font-semibold text-teal-700"
                          >
                            View
                          </Link>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600">
                          <span>{client.email || "No email"}</span>
                          <span>{client.phone || "No phone"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function parseDelimited(text: string, delimiter = ","): Row[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return [];
  }

  const parseLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result.map((value) => value.trim());
  };

  const headers = parseLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? null;
    });

    return row;
  });
}

function parseJson(text: string): Row[] {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("JSON import expects an array of contact objects.");
  }

  return parsed.map((item) => {
    const record = item as Record<string, unknown>;
    const row: Row = {};
    Object.entries(record).forEach(([key, value]) => {
      row[key] = value == null ? null : String(value);
    });
    return row;
  });
}

function parseVcf(text: string): Row[] {
  const cards = text.split(/END:VCARD/i).map((card) => card.trim()).filter(Boolean);

  return cards.map((card) => {
    const row: Row = {};
    const lines = card.split(/\r?\n/);
    for (const line of lines) {
      const [rawKey, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      const key = rawKey.toUpperCase();

      if (key.startsWith("FN")) {
        row.name = value;
      } else if (key.startsWith("ORG")) {
        row.companyName = value;
      } else if (key.startsWith("EMAIL")) {
        row.email = value;
      } else if (key.startsWith("TEL")) {
        row.phone = value;
      } else if (key.startsWith("ADR")) {
        row.address = value.replace(/;/g, " ").trim();
      }
    }
    return row;
  });
}

async function parseSpreadsheet(file: File): Promise<Row[]> {
  const { read, utils } = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return rows.map((record) => {
    const row: Row = {};
    Object.entries(record).forEach(([key, value]) => {
      row[key] = value == null ? null : String(value);
    });
    return row;
  });
}

async function parseFile(file: File): Promise<Row[]> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    return parseSpreadsheet(file);
  }

  const text = await file.text();

  if (lowerName.endsWith(".json")) {
    return parseJson(text);
  }

  if (lowerName.endsWith(".vcf")) {
    return parseVcf(text);
  }

  if (lowerName.endsWith(".tsv")) {
    return parseDelimited(text, "\t");
  }

  if (lowerName.endsWith(".txt")) {
    return text.includes("\t")
      ? parseDelimited(text, "\t")
      : parseDelimited(text, ",");
  }

  return parseDelimited(text, ",");
}

function normalizeRow(row: Row): Row {
  const mapKey = (key: string) => {
    const normalized = key.replace(/\s+/g, "").toLowerCase();
    if (normalized === "company" || normalized === "companyname" || normalized === "organization") return "companyName";
    if (normalized === "gst" || normalized === "gstin") return "gstin";
    if (normalized === "phonenumber" || normalized === "phone" || normalized === "mobile" || normalized === "telephone") return "phone";
    if (normalized === "state" || normalized === "region") return "state";
    if (normalized === "address") return "address";
    if (normalized === "email" || normalized === "emailaddress") return "email";
    if (normalized === "fullname" || normalized === "contactname" || normalized === "name") return "name";
    return key;
  };

  const output: Row = {};
  Object.keys(row).forEach((key) => {
    output[mapKey(key)] = row[key] ?? null;
  });
  return output;
}

function validateRow(row: Row): Row {
  const output: Row = { ...row };
  const emailRaw = (output.email as string) ?? null;
  const phoneRaw = (output.phone as string) ?? null;
  const email = emailRaw ? emailRaw.trim().toLowerCase() : null;
  const phone = phoneRaw ? String(phoneRaw).replace(/\s+/g, " ").trim() : null;

  output.email = email;
  output.phone = phone;

  (output as Row & { _hasName?: boolean })._hasName = Boolean(
    output.name && String(output.name).trim(),
  );
  (output as Row & { _validEmail?: boolean })._validEmail =
    !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  (output as Row & { _validPhone?: boolean })._validPhone =
    !phone || phone.replace(/\D/g, "").length >= 6;

  return output;
}

function HeaderPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "teal" | "slate" | "danger";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 shadow-sm ${
        tone === "teal"
          ? "border-teal-200 bg-teal-50/70"
          : tone === "danger"
            ? "border-rose-200 bg-rose-50/80"
            : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function GuidanceRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
