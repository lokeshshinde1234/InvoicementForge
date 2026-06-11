"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

type KhataEntryType = "CREDIT_SALE" | "PAYMENT_RECEIVED" | "REMINDER_SENT";

type KhataEntry = {
  id: string;
  clientId?: string | null;
  type: KhataEntryType;
  amount: number | string;
  outstandingAmount: number | string;
  dueDate?: string | null;
  notes?: string | null;
  reminderSettings?: {
    customerName?: string | null;
    customerPhone?: string | null;
  } | null;
  createdAt: string;
};

type Client = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
};

const queryClient = new QueryClient();

const khataActions: Array<{
  type: KhataEntryType;
  label: string;
  description: string;
}> = [
  {
    type: "CREDIT_SALE",
    label: "Add credit sale",
    description: "Create an outstanding amount with a due date.",
  },
  {
    type: "PAYMENT_RECEIVED",
    label: "Record payment",
    description: "Track money collected from a customer.",
  },
  {
    type: "REMINDER_SENT",
    label: "Send reminder",
    description: "Log a payment reminder for follow-up.",
  },
];

export default function KhataPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <KhataWorkspace />
    </QueryClientProvider>
  );
}

function KhataWorkspace() {
  const [entryType, setEntryType] = useState<KhataEntryType>("CREDIT_SALE");
  const [clientId, setClientId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [outstandingAmount, setOutstandingAmount] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [notes, setNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const khataQuery = useQuery({
    queryKey: ["company-khata"],
    queryFn: async () => (await api.get<KhataEntry[]>("/khata")).data,
    refetchInterval: 15_000,
  });
  const clientsQuery = useQuery({
    queryKey: ["khata-clients"],
    queryFn: async () => (await api.get<Client[]>("/clients")).data,
    refetchInterval: 60_000,
  });

  const clientsById = useMemo(() => {
    return new Map((clientsQuery.data ?? []).map((client) => [client.id, client]));
  }, [clientsQuery.data]);
  const entries = khataQuery.data ?? [];
  const totals = useMemo(() => calculateTotals(entries), [entries]);
  const groupedEntries = useMemo(() => groupKhataEntries(entries), [entries]);
  const selectedClient = clientId ? clientsById.get(clientId) : null;
  const selectedCustomerLabel =
    selectedClient?.companyName ||
    selectedClient?.name ||
    selectedClient?.email ||
    customerName.trim() ||
    "Select a client or enter customer name";
  const matchingEntries = useMemo(
    () =>
      entries.filter((entry) => {
        if (entry.type !== entryType) return false;
        if (clientId) return entry.clientId === clientId;
        if (!customerName.trim()) return !entry.clientId;

        const savedName = entry.reminderSettings?.customerName?.trim().toLowerCase();
        return savedName === customerName.trim().toLowerCase();
      }),
    [clientId, customerName, entries, entryType],
  );
  const clientOptions = [
    { value: "", label: "Walk-in or unlinked customer" },
    ...(clientsQuery.data ?? []).map((client) => ({
      value: client.id,
      label: client.companyName || client.name || client.email || "Unnamed client",
    })),
  ];

  const createEntry = useMutation({
    mutationFn: async () => {
      const parsedAmount = Number(amount);
      const parsedOutstanding =
        outstandingAmount.trim() === ""
          ? entryType === "PAYMENT_RECEIVED"
            ? 0
            : parsedAmount
          : Number(outstandingAmount);

      return api.post<KhataEntry>("/khata", {
        clientId: clientId || null,
        customerName: clientId ? null : customerName.trim() || null,
        customerPhone: clientId ? null : customerPhone.trim() || null,
        type: entryType,
        amount: parsedAmount,
        outstandingAmount: parsedOutstanding,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      });
    },
    onSuccess: (response) => {
      const savedEntry = response.data;
      queryClient.setQueryData<KhataEntry[]>(["company-khata"], (current = []) => [
        savedEntry,
        ...current.filter((entry) => entry.id !== savedEntry.id),
      ]);
      setAmount("");
      setOutstandingAmount("");
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      setDueDate(defaultDueDate());
      setStatusMessage(`${formatKhataType(entryType)} saved for this company.`);
      setError("");
      void clientsQuery.refetch();
      void khataQuery.refetch();
    },
    onError: (requestError) => {
      setStatusMessage("");
      setError(readApiError(requestError));
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => api.delete(`/khata/${id}`),
    onSuccess: (_response, id) => {
      queryClient.setQueryData<KhataEntry[]>(["company-khata"], (current = []) =>
        current.filter((entry) => entry.id !== id),
      );
      setStatusMessage("Khata entry deleted.");
      setError("");
      void khataQuery.refetch();
    },
    onError: (requestError) => {
      setStatusMessage("");
      setError(readApiError(requestError));
    },
  });

  function deleteKhataEntry(entry: KhataEntry) {
    const confirmed = window.confirm(
      `Delete this ${formatKhataType(entry.type).toLowerCase()} record?`,
    );

    if (!confirmed) return;
    deleteEntry.mutate(entry.id);
  }

  function chooseAction(type: KhataEntryType) {
    setEntryType(type);
    setStatusMessage("");
    setError("");
    if (type === "PAYMENT_RECEIVED") {
      setOutstandingAmount("0");
      setDueDate("");
    } else if (type === "REMINDER_SENT") {
      setOutstandingAmount("");
      setDueDate(defaultDueDate());
      setNotes((current) => current || "Reminder sent for pending payment.");
    } else {
      setOutstandingAmount("");
      setDueDate(defaultDueDate());
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (!amount.trim() || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!clientId && !customerName.trim()) {
      setError("Enter a customer name or select a saved client.");
      return;
    }

    createEntry.mutate();
  }

  return (
    <DashboardShell active="Khata">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">
                Company credit ledger
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Khata mode
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Add credit sales, record collections, and send client reminders from one organized ledger. Records refresh automatically so the company page stays current.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                Active customer
              </p>
              <p className="mt-2 max-w-xs truncate text-lg font-black">
                {selectedCustomerLabel}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Ledger entries" value={String(entries.length)} />
          <Metric label="Credit sales" value={formatMoney(totals.creditSales)} />
          <Metric label="Collected" value={formatMoney(totals.collected)} />
          <Metric label="Outstanding" value={formatMoney(totals.outstanding)} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {khataActions.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={() => chooseAction(action.type)}
              className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                entryType === action.type
                  ? "border-teal-300 bg-teal-50 shadow-teal-950/10"
                  : "border-slate-200 bg-white hover:border-teal-200"
              }`}
            >
              <p className="text-base font-black text-slate-950">{action.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
            </button>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <Card className="h-fit rounded-3xl border-slate-200 shadow-xl shadow-slate-950/10">
            <CardHeader>
              <CardTitle>{formatKhataType(entryType)}</CardTitle>
              <CardDescription>
                Saved under this company. Linked client reminders also appear in the client portal notification bell.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Customer
                  <Select
                    value={clientId}
                    options={clientOptions}
                    onChange={(event) => {
                      setClientId(event.target.value);
                      if (event.target.value) {
                        setCustomerName("");
                        setCustomerPhone("");
                      }
                    }}
                  />
                </label>
                {!clientId ? (
                  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Customer name
                      <Input
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Enter customer or shop name"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Phone
                      <Input
                        type="tel"
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        placeholder="Optional phone number"
                      />
                    </label>
                  </div>
                ) : null}
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Amount
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="5000"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Outstanding amount
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={outstandingAmount}
                    onChange={(event) => setOutstandingAmount(event.target.value)}
                    placeholder={
                      entryType === "PAYMENT_RECEIVED"
                        ? "0"
                        : "Leave blank to use amount"
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Due date
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Notes
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Write sale details, payment mode, or reminder note"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  />
                </label>
                {statusMessage ? (
                  <p className="rounded-2xl bg-teal-50 p-3 text-sm font-bold text-teal-800">
                    {statusMessage}
                  </p>
                ) : null}
                {error ? (
                  <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" disabled={createEntry.isPending || clientsQuery.isLoading}>
                  {createEntry.isPending ? "Saving..." : `Save ${formatKhataType(entryType)}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <MatchingKhataRecords
              entryType={entryType}
              entries={matchingEntries}
              clientId={clientId}
              customerName={customerName}
              clientsById={clientsById}
              deletingEntryId={deleteEntry.variables ?? ""}
              onDelete={deleteKhataEntry}
            />
            <CompanyKhataLedger
              entries={entries}
              groupedEntries={groupedEntries}
              clientsById={clientsById}
              loading={khataQuery.isLoading}
              error={khataQuery.isError}
              deletingEntryId={deleteEntry.variables ?? ""}
              onDelete={deleteKhataEntry}
            />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function MatchingKhataRecords({
  entryType,
  entries,
  clientId,
  customerName,
  clientsById,
  deletingEntryId,
  onDelete,
}: {
  entryType: KhataEntryType;
  entries: KhataEntry[];
  clientId: string;
  customerName: string;
  clientsById: Map<string, Client>;
  deletingEntryId: string;
  onDelete: (entry: KhataEntry) => void;
}) {
  const selectedClient = clientId ? clientsById.get(clientId) : null;
  const titleName =
    selectedClient?.companyName ||
    selectedClient?.name ||
    selectedClient?.email ||
    customerName.trim() ||
    "selected customer";

  return (
    <Card className="rounded-3xl border-slate-200 shadow-xl shadow-slate-950/10">
      <CardHeader>
        <CardTitle>{formatKhataType(entryType)} records</CardTitle>
        <CardDescription>
          Showing saved records for {titleName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState
            title="No matching records yet"
            description="Choose a customer and save this Khata entry. Matching records appear here immediately."
          />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <KhataRecordRow
                key={entry.id}
                entry={entry}
                clientsById={clientsById}
                deleting={deletingEntryId === entry.id}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompanyKhataLedger({
  entries,
  groupedEntries,
  clientsById,
  loading,
  error,
  deletingEntryId,
  onDelete,
}: {
  entries: KhataEntry[];
  groupedEntries: Record<KhataEntryType, KhataEntry[]>;
  clientsById: Map<string, Client>;
  loading: boolean;
  error: boolean;
  deletingEntryId: string;
  onDelete: (entry: KhataEntry) => void;
}) {
  if (loading) {
    return <Card className="rounded-3xl border-slate-200"><CardContent className="p-6 text-sm font-medium text-slate-600">Loading company khata records...</CardContent></Card>;
  }

  if (error) {
    return <Card className="rounded-3xl border-slate-200"><CardContent className="p-6 text-sm font-bold text-rose-700">Could not load company khata records.</CardContent></Card>;
  }

  return (
    <Card className="rounded-3xl border-slate-200 shadow-xl shadow-slate-950/10">
      <CardHeader>
        <CardTitle>Company khata ledger</CardTitle>
        <CardDescription>
          Live company ledger from the backend, filtered by the logged-in company token.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <section className="grid gap-4 md:grid-cols-3">
          {(["CREDIT_SALE", "PAYMENT_RECEIVED", "REMINDER_SENT"] as KhataEntryType[]).map(
            (type) => (
              <KhataTypeBlock
                key={type}
                type={type}
                entries={groupedEntries[type]}
                clientsById={clientsById}
                deletingEntryId={deletingEntryId}
                onDelete={onDelete}
              />
            ),
          )}
        </section>

        <section className="mt-6">
        {entries.length === 0 ? (
          <EmptyState
            title="No khata records found"
            description="Use the activity buttons to add credit sales, payment collections, or reminders."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Activity</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3 text-right">Outstanding</th>
                  <th className="px-3 py-3">Due date</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const client = entry.clientId ? clientsById.get(entry.clientId) : null;
                  const fallbackName = entry.reminderSettings?.customerName;
                  const fallbackPhone = entry.reminderSettings?.customerPhone;

                  return (
                    <tr key={entry.id} className="hover:bg-teal-50/40">
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${khataTone(entry.type)}`}>
                          {formatKhataType(entry.type)}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-bold text-slate-900">
                          {client?.companyName || client?.name || fallbackName || "Walk-in customer"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {client?.email || fallbackPhone || entry.clientId || "No client linked"}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatMoney(entry.amount)}
                      </td>
                      <td className="px-3 py-4 text-right font-black">
                        {formatMoney(entry.outstandingAmount)}
                      </td>
                      <td className="px-3 py-4">{formatDate(entry.dueDate ?? entry.createdAt)}</td>
                      <td className="max-w-xs px-3 py-4 text-slate-600">
                        {entry.notes || "-"}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <DeleteKhataButton
                          deleting={deletingEntryId === entry.id}
                          onClick={() => onDelete(entry)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </section>
      </CardContent>
    </Card>
  );
}

function KhataTypeBlock({
  type,
  entries,
  clientsById,
  deletingEntryId,
  onDelete,
}: {
  type: KhataEntryType;
  entries: KhataEntry[];
  clientsById: Map<string, Client>;
  deletingEntryId: string;
  onDelete: (entry: KhataEntry) => void;
}) {
  const latest = entries[0];
  const client = latest?.clientId ? clientsById.get(latest.clientId) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {formatKhataType(type)}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{entries.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            {latest
              ? `${client?.companyName || client?.name || latest.reminderSettings?.customerName || "Walk-in customer"}`
              : "No saved entries yet"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${entries.length ? khataTone(type) : "bg-white text-slate-600"}`}>
          {entries.length ? "Saved" : "Empty"}
        </span>
      </div>

      {latest ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
            <p className="font-black text-slate-900">{formatMoney(latest.amount)}</p>
            <p className="mt-1">
              Outstanding: {formatMoney(latest.outstandingAmount)}
            </p>
            <p className="mt-1">
              {formatDate(latest.dueDate ?? latest.createdAt)}
            </p>
          </div>

          <div className="space-y-2">
            {entries.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900">
                    {formatKhataType(entry.type)}
                  </span>
                  <span>{formatMoney(entry.amount)}</span>
                </div>
                <p className="mt-1">
                  {entry.clientId
                    ? clientsById.get(entry.clientId)?.companyName ||
                      clientsById.get(entry.clientId)?.name ||
                      clientsById.get(entry.clientId)?.email ||
                      "Linked client"
                    : entry.reminderSettings?.customerName || "Walk-in customer"}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Outstanding {formatMoney(entry.outstandingAmount)} -{" "}
                  {formatDate(entry.dueDate ?? entry.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KhataRecordRow({
  entry,
  clientsById,
  deleting,
  onDelete,
}: {
  entry: KhataEntry;
  clientsById: Map<string, Client>;
  deleting: boolean;
  onDelete: (entry: KhataEntry) => void;
}) {
  const client = entry.clientId ? clientsById.get(entry.clientId) : null;
  const customer =
    client?.companyName ||
    client?.name ||
    client?.email ||
    entry.reminderSettings?.customerName ||
    "Walk-in customer";

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-900">
          {formatKhataType(entry.type)}
        </span>
        <span>{formatMoney(entry.amount)}</span>
      </div>
      <p className="mt-1">{customer}</p>
      <p className="mt-1 text-[11px] text-slate-500">
        Outstanding {formatMoney(entry.outstandingAmount)} -{" "}
        {formatDate(entry.dueDate ?? entry.createdAt)}
      </p>
      {entry.notes ? (
        <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
          {entry.notes}
        </p>
      ) : null}
      <div className="mt-2 flex justify-end">
        <DeleteKhataButton deleting={deleting} onClick={() => onDelete(entry)} />
      </div>
    </div>
  );
}

function DeleteKhataButton({
  deleting,
  onClick,
}: {
  deleting: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deleting}
      className="inline-flex h-8 items-center rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function calculateTotals(entries: KhataEntry[]) {
  return entries.reduce(
    (totals, entry) => {
      const amount = Number(entry.amount ?? 0);
      const outstanding = Number(entry.outstandingAmount ?? 0);

      if (entry.type === "CREDIT_SALE") {
        totals.creditSales += amount;
      }
      if (entry.type === "PAYMENT_RECEIVED") {
        totals.collected += amount;
      }
      totals.outstanding += outstanding;

      return totals;
    },
    { creditSales: 0, collected: 0, outstanding: 0 },
  );
}

function groupKhataEntries(entries: KhataEntry[]) {
  return entries.reduce(
    (groups, entry) => {
      groups[entry.type].push(entry);
      return groups;
    },
    {
      CREDIT_SALE: [] as KhataEntry[],
      PAYMENT_RECEIVED: [] as KhataEntry[],
      REMINDER_SENT: [] as KhataEntry[],
    },
  );
}

function formatKhataType(type: string) {
  const labels: Record<string, string> = {
    CREDIT_SALE: "Credit sale",
    PAYMENT_RECEIVED: "Payment received",
    REMINDER_SENT: "Reminder sent",
  };

  return labels[type] ?? type.replace(/_/g, " ");
}

function khataTone(type: KhataEntryType) {
  const tones: Record<KhataEntryType, string> = {
    CREDIT_SALE: "bg-amber-50 text-amber-800",
    PAYMENT_RECEIVED: "bg-emerald-50 text-emerald-800",
    REMINDER_SENT: "bg-sky-50 text-sky-800",
  };

  return tones[type];
}

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function readApiError(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    return message ?? "Could not save khata entry.";
  }

  return "Could not save khata entry.";
}


