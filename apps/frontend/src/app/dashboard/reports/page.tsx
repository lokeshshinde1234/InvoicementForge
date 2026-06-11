"use client";

import { WorkspaceRecordsPage } from "@/components/dashboard/WorkspaceRecordsPage";

type GstReport = {
  id: string;
  type: string;
  period: string;
  status?: string;
  summary?: Record<string, unknown>;
  rows?: unknown[];
  createdAt: string;
};

export default function ReportsPage() {
  return (
    <WorkspaceRecordsPage
      active="Reports"
      eyebrow="GST reports"
      title="Compliance and reporting"
      description="All GST reports generated for this company appear in the GST reports field with PDF export."
      sources={[
        {
          label: "GST reports",
          endpoint: "/gst/reports",
          map: (data) =>
            (data as GstReport[]).map((report) => ({
              id: report.id,
              title: report.type.replace(/_/g, " "),
              subtitle: `Period ${report.period}`,
              status: report.status ?? "READY",
              date: report.createdAt,
              category: "GST reports",
              details: [
                { label: "Rows", value: report.rows?.length ?? 0 },
                { label: "Note", value: typeof report.summary?.note === "string" ? report.summary.note : "" },
              ],
            })),
        },
      ]}
      tabs={[
        { id: "all", label: "All GST reports", filter: () => true },
        { id: "gstr1", label: "GSTR-1", filter: (record) => record.title === "GSTR 1" },
        { id: "gstr3b", label: "GSTR-3B", filter: (record) => record.title === "GSTR 3B" },
        {
          id: "gstr2a",
          label: "GSTR-2A reconciliation",
          filter: (record) => record.title === "GSTR 2A RECONCILIATION",
        },
      ]}
      emptyTitle="No GST reports yet"
      emptyDescription="Generate GST reports to populate this reporting section."
    />
  );
}
