import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Privacy
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            InvoiceForge helps teams create proposals, invoices, client records,
            and payment workflows. This policy explains what information we
            collect, how we use it, and how workspace owners can manage their
            data.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-12 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Summary
          </h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>We store account, workspace, billing, client, document, and activity data needed to run the product.</li>
            <li>Payment processing depends on the providers you connect, such as Razorpay or Stripe.</li>
            <li>Workspace owners control their team access, client records, and document retention.</li>
            <li>You can request data export or deletion through your workspace administrator.</li>
          </ul>
        </aside>

        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <PolicySection
            title="Information we collect"
            body="We collect account details such as name, email address, password hash, workspace metadata, tax settings, customer records, proposal and invoice content, signatures, payment references, and operational logs."
          />
          <PolicySection
            title="How we use information"
            body="We use your data to authenticate users, deliver document workflows, calculate taxes, generate reports, process payment integrations, and secure the platform against abuse or service disruption."
          />
          <PolicySection
            title="Payments and integrations"
            body="When you connect providers like Razorpay, PayU, Stripe, Xero, or QuickBooks, InvoiceForge stores only the credentials, identifiers, and event data required to support those integrations inside your workspace."
          />
          <PolicySection
            title="Security and retention"
            body="We recommend HTTPS, scoped secrets, backups, and least-privilege production access. Workspace records remain available until they are deleted by the workspace owner or removed according to your retention policy."
          />
          <PolicySection
            title="Your choices"
            body="Workspace owners can update business settings, remove clients, revoke user access, and request data deletion as part of normal account administration."
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/contact"
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
            >
              Contact support
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
            >
              Back home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PolicySection({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
    </section>
  );
}
