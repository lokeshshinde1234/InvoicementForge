import Link from "next/link";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";

const controls = [
  ["Workspace isolation", "Tenant-aware APIs keep company records, client links, and document activity scoped to the right workspace."],
  ["Protected sessions", "JWT authentication, guarded dashboard routes, and role-ready backend modules support stronger access patterns."],
  ["Client portal access", "Secure portal links and OTP flows help buyers review proposals and invoices without exposing internal tools."],
  ["Audit visibility", "Activity logs, payment records, and document status trails give teams a clearer operational record."],
] as const;

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-white/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(20,184,166,0.28),transparent_30%),radial-gradient(circle_at_84%_6%,rgba(251,191,36,0.18),transparent_30%)]" />
        <div className="brand-dots absolute inset-0 opacity-15" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Security</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Trust controls for proposals, invoices, payments, and client portals.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              InvoiceForge is structured around authenticated workspaces, protected APIs, scoped customer records, and payment-ready audit trails.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className="inline-flex h-12 items-center justify-center rounded-md bg-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-950/30 hover:bg-teal-400">
                Review security
              </Link>
              <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-sm font-semibold text-white hover:bg-white/10">
                Start trial
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            {["Auth", "Tenant", "Portal", "Payment", "Audit"].map((item, index) => (
              <div key={item} className="flex items-center justify-between border-b border-white/10 py-4 last:border-b-0">
                <span className="font-semibold">{item}</span>
                <span className="rounded-md bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Layer 0{index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Controls</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Security that matches the product workflow.</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {controls.map(([title, copy]) => (
              <article key={title} className="hover-lift rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
