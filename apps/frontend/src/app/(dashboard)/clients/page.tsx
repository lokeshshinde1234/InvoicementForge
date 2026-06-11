"use client";

import {
  WorkspaceRecordsPage,
  type WorkspaceRecord,
} from "@/components/dashboard/WorkspaceRecordsPage";

type Client = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  state?: string | null;
  address?: string | null;
  createdAt?: string | null;
  isPasswordCreated?: boolean;
};

const clientTabs = [
  {
    id: "all",
    label: "All clients",
    description: "All clients saved inside this company workspace.",
    filter: () => true,
  },
  {
    id: "with-email",
    label: "With email",
    filter: (record: WorkspaceRecord) =>
      Boolean(record.details?.some((detail) => detail.label === "Email" && detail.value)),
  },
  {
    id: "with-phone",
    label: "With phone",
    filter: (record: WorkspaceRecord) =>
      Boolean(record.details?.some((detail) => detail.label === "Phone" && detail.value)),
  },
  {
    id: "gst-ready",
    label: "GST ready",
    filter: (record: WorkspaceRecord) =>
      Boolean(record.details?.some((detail) => detail.label === "GSTIN" && detail.value)),
  },
];

export default function ClientsPage() {
  return (
    <WorkspaceRecordsPage
      active="Clients"
      eyebrow="Company CRM"
      title="Client list"
      description="All clients for the current company appear here with contact, GST, and billing details in the same dashboard workspace."
      actions={[
        { label: "Create client", href: "/clients/new" },
        { label: "Import CSV", href: "/clients/import" },
      ]}
      sources={[
        {
          label: "Clients",
          endpoint: "/clients",
          map: (data) =>
            (data as Client[]).map((client) => ({
              id: client.id,
              title: client.companyName || client.name || "Unnamed client",
              subtitle: client.companyName ? client.name : client.email ?? "No contact name",
              status: "ACTIVE",
              date: client.createdAt ?? null,
              category: "Company clients",
              href: `/clients/${client.id}`,
              editHref: `/clients/${client.id}/edit`,
              deletePath: `/clients/${client.id}`,
              deleteLabel: client.companyName || client.name || "this client",
              details: [
                { label: "Email", value: client.email },
                {
                  label: "Password",
                  value: client.isPasswordCreated
                    ? "Password Created"
                    : "Password Not Created",
                },
                { label: "Phone", value: client.phone },
                { label: "GSTIN", value: client.gstin },
                { label: "State", value: client.state },
                { label: "Address", value: client.address },
              ],
            })),
        },
      ]}
      tabs={clientTabs}
      emptyTitle="No clients found"
      emptyDescription="Client records created from proposals, invoices, or imports will appear here without leaving the company dashboard."
    />
  );
}
