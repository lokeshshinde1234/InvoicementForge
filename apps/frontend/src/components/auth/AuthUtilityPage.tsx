import Link from "next/link";

type AuthUtilityPageProps = {
  label: string;
  title: string;
  copy: string;
  fields: Array<{
    label: string;
    type?: string;
    placeholder: string;
  }>;
  submitLabel: string;
  footer?: string;
};

export function AuthUtilityPage({
  label,
  title,
  copy,
  fields,
  submitLabel,
  footer,
}: AuthUtilityPageProps) {
  return (
    <main className="grid min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-teal-600 text-sm font-bold text-white">
            IF
          </span>
          <span className="font-semibold">InvoiceForge</span>
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-teal-700">
          {label}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>

        <form className="mt-6 grid gap-4">
          {fields.map((field) => (
            <label key={field.label} className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">
                {field.label}
              </span>
              <input
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          ))}
          <button
            type="button"
            className="mt-2 h-11 rounded-md bg-teal-600 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            {submitLabel}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          {footer ?? "Already have access?"}{" "}
          <Link href="/login" className="font-semibold text-teal-700">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
