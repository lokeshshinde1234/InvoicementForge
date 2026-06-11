"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthToken, getAuthToken } from "@/lib/auth-storage";
import {
  CompanyLogo,
  useCompanyBranding,
} from "@/components/branding/CompanyBranding";

type JwtPayload = {
  email?: string;
  role?: string;
};

const coreNavItems = [
  ["Dashboard", "/dashboard", "D"],
  ["Proposals", "/proposals", "P"],
  ["Invoices", "/invoices", "I"],
  ["Clients", "/clients", "C"],
  ["Payments", "/dashboard/payments", "M"],
  ["Documents", "/dashboard/documents", "O"],
  ["Reports", "/dashboard/reports", "R"],
  ["Templates", "/dashboard/templates", "T"],
  ["Settings", "/dashboard/settings", "S"],
  ["Profile", "/dashboard/profile", "P"],
] as const;

const memberNavItems = [["My Tasks", "/dashboard/team/my-tasks", "A"]] as const;

const adminNavItems = [
  ["GST", "/dashboard/gst", "G"],
  ["E-Invoicing", "/dashboard/e-invoicing", "E"],
  ["Khata", "/dashboard/khata", "K"],
  ["Global", "/dashboard/global", "W"],
  ["Accounting", "/dashboard/accounting", "L"],
  ["Team", "/dashboard/team/members", "U"],
] as const;

function decodeToken(token: string | null): JwtPayload {
  if (!token) {
    return {};
  }

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized)) as JwtPayload;
  } catch {
    return {};
  }
}

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function DashboardShell({
  active = "Dashboard",
  children,
}: {
  active?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<JwtPayload>({});
  const [authReady, setAuthReady] = useState(false);
  const { branding } = useCompanyBranding();

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setProfile(decodeToken(token));
    setAuthReady(true);
  }, [router]);

  const email = profile.email ?? "user@invoiceforge.app";
  const initials = useMemo(() => getInitials(email), [email]);
  const isMember = profile.role === "MEMBER";
  const isAdmin = profile.role === "OWNER" || profile.role === "ADMIN";
  const navItems = isMember
    ? [...memberNavItems]
    : isAdmin
      ? [...coreNavItems, ...adminNavItems]
      : [...coreNavItems];

  useEffect(() => {
    if (!authReady || !isMember) {
      return;
    }

    if (!pathname.startsWith("/dashboard/team/my-tasks")) {
      router.replace("/dashboard/team/my-tasks");
    }
  }, [authReady, isMember, pathname, router]);

  if (!authReady) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-14 rounded-lg bg-white shadow-sm" />
          <div className="grid gap-4 lg:grid-cols-[248px_1fr]">
            <div className="hidden h-[70vh] rounded-lg bg-white shadow-sm lg:block" />
            <div className="h-[70vh] rounded-lg bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  function handleSignOut() {
    clearAuthToken();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-[#07111f] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start lg:flex-col">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
              <CompanyLogo branding={branding} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-cyan-100">
                  {branding?.name ?? "InvoiceForge"}
                </span>
                <span className="block truncate text-lg font-bold tracking-tight">
                  Company Workspace
                </span>
              </span>
            </Link>
          </div>

          <nav className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map(([label, href, marker]) => (
              <Link
                key={label}
                href={href}
                className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
                  label === active
                    ? "bg-cyan-300 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded text-[11px] font-bold ${
                    label === active
                      ? "bg-slate-950/10 text-slate-950"
                      : "bg-white/10 text-cyan-100"
                  }`}
                >
                  {marker}
                </span>
                {label}
              </Link>
            ))}
          </nav>

          {!isMember ? (
          <div className="mx-3 mb-4 mt-3 shrink-0 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Client portal</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              Share branded proposal links and track buyer engagement.
            </p>
            <Link
              href="/proposals/new"
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-md bg-cyan-300 text-sm font-bold text-slate-950 hover:bg-cyan-200"
            >
              Create document
            </Link>
          </div>
          ) : null}
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <Link href="/dashboard" className="flex items-center gap-3 lg:hidden">
                <CompanyLogo branding={branding} size="sm" />
                <span className="text-sm font-semibold">
                  {branding?.name ?? "InvoiceForge"}
                </span>
              </Link>

              {!isMember ? (
              <div className="hidden h-10 flex-1 items-center rounded-md border border-slate-200 bg-slate-50 px-3 sm:flex">
                <span className="mr-2 text-xs font-semibold text-slate-400">/</span>
                <input
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search proposals, clients, invoices"
                />
              </div>
              ) : (
                <div className="hidden flex-1 sm:block" />
              )}

              {!isMember ? (
              <Link
                href="/proposals/new"
                className="ml-auto hidden h-10 items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 sm:inline-flex"
              >
                New proposal
              </Link>
              ) : null}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-2 pr-3 text-left shadow-sm hover:bg-slate-50"
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-950 text-xs font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden sm:block">
                    <span className="block max-w-40 truncate text-sm font-semibold">{email}</span>
                    <span className="block text-xs text-slate-500">{profile.role ?? "OWNER"}</span>
                  </span>
                  <span className="text-xs text-slate-400">v</span>
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="truncate text-sm font-semibold">{email}</p>
                      <p className="mt-1 text-xs text-slate-500">{profile.role ?? "OWNER"}</p>
                    </div>
                    {!isMember ? (
                    <>
                    <Link
                      href="/dashboard/profile"
                      className="mt-2 block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Profile settings
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Workspace settings
                    </Link>
                    </>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-1 h-9 w-full rounded-md px-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
              <div className="flex gap-2 overflow-x-auto">
                {navItems.map(([label, href]) => {
                  const selected =
                    href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(href);

                  return (
                    <Link
                      key={label}
                      href={href}
                      className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                        selected
                          ? "bg-teal-50 text-teal-800"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
