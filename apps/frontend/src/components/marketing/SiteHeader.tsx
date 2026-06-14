"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AUTH_CHANGED_EVENT, getAuthToken } from "@/lib/auth-storage";
import { navItems } from "./site-data";

const productMenu = [
  ["Product Overview", "/product", "Complete view of the proposal platform."],
  ["Create and Send", "/features#proposal-builder", "Build branded proposals and quotes."],
  ["Track and Close", "/features#analytics", "Monitor engagement and speed up follow-up."],
  ["Integrations", "/integrations", "Connect payments, CRM, and accounting tools."],
] satisfies [string, string, string][];

const resourcesMenu = [
  ["Templates", "/templates", "Start from polished proposal layouts."],
  ["Customers", "/customers", "Explore use cases by team type."],
  ["Security", "/security", "Authentication and workspace controls."],
  ["Contact", "/contact", "Talk to the InvoiceForge team."],
] satisfies [string, string, string][];

type JwtPayload = {
  email?: string;
  role?: string;
};

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    function syncAuthState() {
      const token = getAuthToken();
      const payload = token ? readPayloadFromToken(token) : {};

      setUserEmail(payload.email ?? "");
      setUserRole(payload.role ?? "");
    }

    function updateProgress() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const value = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, value)));
    }

    syncAuthState();
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    window.addEventListener("focus", syncAuthState);
    window.addEventListener("pageshow", syncAuthState);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);

    if (!prefersReducedMotion) {
      const candidates = document.querySelectorAll<HTMLElement>(
        [
          "main > section",
          "section h1",
          "section h2",
          "section p",
          "section article",
          "section form",
          ".hover-lift",
          ".proposal-shadow",
        ].join(","),
      );

      candidates.forEach((element, index) => {
        if (!element.dataset.aos) {
          const animation =
            element.classList.contains("proposal-shadow") ||
            element.tagName === "FORM"
              ? "if-slide-left"
              : element.classList.contains("hover-lift") ||
                  element.tagName === "ARTICLE"
                ? "if-soft-zoom"
                : "if-fade-up";

          element.dataset.aos = animation;
          element.dataset.aosDuration = "760";
          element.dataset.aosEasing = "ease-out-cubic";
          element.dataset.aosOnce = "true";
          element.dataset.aosOffset = "90";
          element.dataset.aosDelay = String(Math.min((index % 6) * 55, 275));
        }
      });

      import("aos").then(({ default: AOS }) => {
        AOS.init({
          duration: 760,
          easing: "ease-out-cubic",
          once: true,
          offset: 90,
          anchorPlacement: "top-bottom",
        });
        AOS.refreshHard();
      });
    }

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      window.removeEventListener("focus", syncAuthState);
      window.removeEventListener("pageshow", syncAuthState);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    };
  }, []);

  const isLoggedIn = Boolean(userEmail);
  const initials = userEmail.slice(0, 2).toUpperCase();
  const appHref = userRole === "SUPERADMIN" ? "/superadmin" : "/dashboard";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm shadow-slate-950/5 backdrop-blur-xl">
      <span
        aria-hidden="true"
        className="scroll-progress fixed left-0 top-0 z-[60] h-1 w-full"
        style={{ transform: `scaleX(${progress})` }}
      />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="InvoiceForge home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-teal-900/15">
            IF
          </span>
          <span className="text-base font-bold tracking-tight text-slate-950 sm:text-lg">
            InvoiceForge
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 lg:flex">
          <Dropdown label="Product" items={productMenu} />
          <Link href="/features" className="rounded-md px-3 py-2 text-slate-600 hover:bg-[#f6fbf9] hover:text-slate-950">
            Features
          </Link>
          <Dropdown label="Resources" items={resourcesMenu} />
          <Link href="/pricing" className="rounded-md px-3 py-2 text-slate-600 hover:bg-[#f6fbf9] hover:text-slate-950">
            Pricing
          </Link>
        </nav>

        {isLoggedIn ? (
          <div className="hidden items-center gap-2 sm:flex">
            <Link href={appHref} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700">
              {userRole === "SUPERADMIN" ? "Superadmin" : "Dashboard"}
            </Link>
            <Link href={appHref} className="flex h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-2 pr-3 text-left shadow-sm hover:bg-slate-50">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-950 text-xs font-bold text-white">
                {initials}
              </span>
              <span className="block max-w-40 truncate text-sm font-semibold text-slate-800">
                {userEmail}
              </span>
            </Link>
          </div>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/portal/login" className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#f6fbf9]">
              Client Login
            </Link>
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#f6fbf9]">
              Log in
            </Link>
            <Link href="/demo" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-md">
              Book demo
            </Link>
            <Link href="/signup" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700">
              Sign up
            </Link>
          </div>
        )}

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={`grid h-10 w-10 place-items-center rounded-xl border transition lg:hidden ${
            open
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 bg-white text-slate-950"
          }`}
        >
          {open ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-[#f5f7fb] p-3 shadow-2xl shadow-slate-950/15 lg:hidden">
          <nav className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-3">
            <div className="rounded-xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                Proposal to payment
              </p>
              <p className="mt-2 text-lg font-bold">
                Run your client workflow from one workspace.
              </p>
            </div>

            <p className="mb-2 mt-4 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Explore
            </p>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
              <Link href="/security" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Security
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Contact
              </Link>
            </div>

            {isLoggedIn ? (
              <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
                <Link href={appHref} className="rounded-xl bg-teal-600 px-4 py-3 text-center text-sm font-bold text-white">
                  {userRole === "SUPERADMIN" ? "Superadmin" : "Dashboard"}
                </Link>
                <Link href={appHref} className="truncate rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold">
                  {userEmail}
                </Link>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link href="/login" className="rounded-xl border border-slate-300 px-3 py-3 text-center text-sm font-bold text-slate-800">
                  Company login
                </Link>
                <Link href="/portal/login" className="rounded-xl border border-slate-300 px-3 py-3 text-center text-sm font-bold text-slate-800">
                  Client login
                </Link>
                <Link href="/demo" className="rounded-xl border border-slate-300 px-3 py-3 text-center text-sm font-bold text-slate-800">
                  Book demo
                </Link>
                <Link href="/signup" className="rounded-xl bg-teal-600 px-3 py-3 text-center text-sm font-bold text-white">
                  Start free
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function readPayloadFromToken(token: string): JwtPayload {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized)) as JwtPayload;
  } catch {
    return {};
  }
}

function Dropdown({
  label,
  items,
}: {
  label: string;
  items: [string, string, string][];
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-[#f6fbf9] hover:text-slate-950"
      >
        {label}
      </button>
      <div className="pointer-events-none absolute left-0 top-full z-50 w-[560px] translate-y-3 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-2 group-hover:opacity-100">
        <div className="brand-grid rounded-lg border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/10">
          <div className="relative grid gap-2 sm:grid-cols-2">
            {items.map(([title, href, copy]) => (
              <Link
                key={href}
                href={href}
                className="rounded-md border border-transparent p-4 transition hover:border-teal-200 hover:bg-[#f6fbf9]"
              >
                <span className="text-sm font-semibold text-slate-950">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{copy}</span>
              </Link>
            ))}
          </div>
          <div className="relative mt-3 rounded-md bg-slate-950 p-4 text-white">
            <p className="text-sm font-semibold">2026 proposal workflow</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Templates, quoting, signatures, analytics, and GST invoicing in one close-ready flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
