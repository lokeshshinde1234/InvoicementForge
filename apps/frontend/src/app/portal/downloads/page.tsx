const files = [
  "Signed proposal.pdf",
  "GST invoice.pdf",
  "Payment receipt.pdf",
  "Service agreement.pdf",
];

export default function ClientDownloadCenterPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          File download center
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Shared client files
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Download proposals, invoices, contracts, receipts, and files shared by
          the workspace team.
        </p>
        <div className="mt-6 space-y-3">
          {files.map((file) => (
            <div
              key={file}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
            >
              <span className="font-medium">{file}</span>
              <button
                type="button"
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
