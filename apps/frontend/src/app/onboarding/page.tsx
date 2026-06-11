import Link from "next/link";

const steps = [
  {
    title: "Company info",
    fields: ["Company name", "GST number", "PAN", "Country", "State"],
  },
  {
    title: "Branding",
    fields: ["Logo", "Brand colors", "Invoice theme"],
  },
  {
    title: "Tax setup",
    fields: ["GST type", "VAT", "Currency"],
  },
  {
    title: "Payment setup",
    fields: ["Razorpay", "Stripe", "UPI"],
  },
  {
    title: "Team setup",
    fields: ["Invite employees", "Assign roles", "Review access"],
  },
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-teal-600 text-sm font-bold text-white">
            IF
          </span>
          <span className="font-semibold">InvoiceForge</span>
        </Link>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Workspace setup
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Company onboarding wizard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Configure identity, branding, taxes, payment rails, and team access
            before the workspace opens into the main dashboard.
          </p>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-sm font-semibold text-teal-800">
                {index + 1}
              </span>
              <h2 className="mt-4 text-lg font-semibold">{step.title}</h2>
              <div className="mt-4 space-y-2">
                {step.fields.map((field) => (
                  <div
                    key={field}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    {field}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Continue to dashboard
          </Link>
          <Link
            href="/workspaces"
            className="inline-flex h-11 items-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-950 hover:border-slate-950"
          >
            Choose workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
