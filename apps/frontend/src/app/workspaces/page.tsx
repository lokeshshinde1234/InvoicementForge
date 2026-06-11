import Link from "next/link";

const workspaces = [
  "InvoiceForge Demo",
  "Northstar Consulting",
  "UrbanLedger Services",
];

export default function WorkspaceSelectionPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Workspace selection
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Choose a company workspace
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Multi-company users can switch into the correct organization before
          opening proposals, invoices, GST reports, and client documents.
        </p>

        <div className="mt-6 grid gap-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace}
              href="/dashboard"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50"
            >
              <span className="font-semibold">{workspace}</span>
              <span className="text-sm text-slate-500">Open workspace</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
