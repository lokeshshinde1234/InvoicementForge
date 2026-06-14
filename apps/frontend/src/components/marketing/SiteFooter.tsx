import Link from "next/link";
import { footerGroups } from "./site-data";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(20,184,166,0.2),transparent_28%),radial-gradient(circle_at_90%_15%,rgba(59,130,246,0.14),transparent_26%)]" />
      <div className="brand-dots absolute inset-0 opacity-10" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Move work forward</p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Build, approve, sign, and invoice from one workspace.
            </h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:shrink-0">
            <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-teal-200">
              Start free
            </Link>
            <Link href="/demo" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10">
              Book demo
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-5 md:gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-black text-slate-950">
                IF
              </span>
              <span>
                <span className="block text-lg font-bold tracking-tight">InvoiceForge</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300">Revenue workspace</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Professional proposals, interactive quotes, signatures, GST invoices, and private client portals in one connected flow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["GST-ready", "Secure access", "Client-friendly"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-300">
                  <span className="mr-1.5 text-teal-300">✓</span>{item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-2 md:hidden">
            {footerGroups.map((group) => (
              <details key={group.title} className="group rounded-xl border border-white/10 bg-white/[0.04]">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-bold">
                  {group.title}
                  <span className="text-lg font-light text-teal-300 transition group-open:rotate-45">+</span>
                </summary>
                <ul className="grid gap-1 border-t border-white/10 px-3 py-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                        {link.label}<span aria-hidden="true" className="text-slate-500">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          {footerGroups.map((group) => (
            <div key={group.title} className="hidden md:block">
              <h3 className="text-sm font-bold text-white">{group.title}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-slate-400 transition hover:text-teal-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {new Date().getFullYear()} InvoiceForge. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/security" className="transition hover:text-white">Security</Link>
            <Link href="/contact" className="transition hover:text-white">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
