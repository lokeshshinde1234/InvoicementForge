import Link from "next/link";
import { footerGroups } from "./site-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-5 lg:px-8">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-slate-950 text-sm font-bold text-white">
              IF
            </span>
            <span className="text-lg font-semibold text-slate-950">InvoiceForge</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
            Proposal software for teams that need reusable documents, quoting,
            approvals, signatures, GST invoices, and client portals in one flow.
          </p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-slate-950">{group.title}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-600 hover:text-slate-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        Copyright {new Date().getFullYear()} InvoiceForge. All rights reserved.
      </div>
    </footer>
  );
}
