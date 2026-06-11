"use client";

import {
  WorkspaceRecordsPage,
  type WorkspaceRecord,
} from "@/components/dashboard/WorkspaceRecordsPage";

type Proposal = {
  id: string;
  title: string;
  status: string;
  clientId: string;
  totalAmount: number | string;
  validUntil?: string | null;
  createdAt: string;
};

const proposalTabs = [
  {
    id: "all",
    label: "All proposals",
    description: "All proposals created inside this company workspace.",
    filter: () => true,
  },
  {
    id: "draft",
    label: "Draft",
    filter: (record: WorkspaceRecord) => record.status === "DRAFT",
  },
  {
    id: "sent",
    label: "Sent",
    filter: (record: WorkspaceRecord) => record.status === "SENT" || record.status === "VIEWED",
  },
  {
    id: "approved",
    label: "Approved",
    filter: (record: WorkspaceRecord) =>
      ["APPROVED", "SIGNED", "CONVERTED"].includes(record.status ?? ""),
  },
  {
    id: "rejected",
    label: "Rejected",
    filter: (record: WorkspaceRecord) =>
      ["REJECTED", "CHANGES_REQUESTED", "EXPIRED"].includes(record.status ?? ""),
  },
];

export default function ProposalListPage() {
  return (
    <WorkspaceRecordsPage
      active="Proposals"
      eyebrow="Proposal pipeline"
      title="Proposal list"
      description="All proposals for the current company appear here with status filters and one-click PDF download."
      actions={[
        { label: "Create proposal", href: "/proposals/new" },
        { label: "Open templates", href: "/dashboard/templates" },
      ]}
      sources={[
        {
          label: "Proposals",
          endpoint: "/proposals",
          map: (data) =>
            (data as Proposal[]).map((proposal) => ({
              id: proposal.id,
              title: proposal.title,
              subtitle: `Client ${proposal.clientId.slice(0, 8)}`,
              status: proposal.status,
              amount: proposal.totalAmount,
              date: proposal.validUntil ?? proposal.createdAt,
              category: "Proposal pipeline",
              href: `/proposals/${proposal.id}`,
              pdfPath: `/proposals/${proposal.id}/pdf`,
              pdfFilename: `${proposal.title}.pdf`,
              deletePath: `/proposals/${proposal.id}`,
              deleteLabel: `proposal "${proposal.title}"`,
            })),
        },
      ]}
      tabs={proposalTabs}
      emptyTitle="No proposals found"
      emptyDescription="Create a proposal to populate this company pipeline."
    />
  );
}
