import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Page not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          We could not find that page.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The link may be out of date, the document may have been removed, or
          the route may belong to another workspace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
