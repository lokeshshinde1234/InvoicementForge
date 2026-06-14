"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth-storage";
import { API_BASE_URL } from "@/lib/config";

type PortalResponse = {
  message?: string;
  access_token?: string;
  requiresPasswordSetup?: boolean;
  company?: { id: string; name?: string };
};

export default function ClientPortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resolvedCompanyId = useMemo(() => {
    if (companyId.trim()) return companyId.trim();
    if (typeof window === "undefined") return "";
    return readTenantIdFromToken(getAuthToken() ?? "");
  }, [companyId]);

  const passwordScore = getPasswordScore(password);

  useEffect(() => {
    setCompanyId(new URLSearchParams(window.location.search).get("companyId") ?? "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (setupMode && password !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setLoading(true);

    try {
      const data = await portalRequest(setupMode ? "/client/set-password" : "/client/login", {
        email,
        companyId: resolvedCompanyId,
        password,
        newPassword: password,
        confirmPassword: setupMode ? confirmPassword : password,
      });

      if (data.requiresPasswordSetup) {
        setSetupMode(true);
        setMessage(data.message ?? "Create your password to continue.");
        return;
      }

      if (data.access_token) {
        window.localStorage.setItem("portalClientToken", data.access_token);
      }

      router.push("/portal/dashboard");
    } catch (requestError) {
      setError(
        readRequestMessage(
          requestError,
          "Invalid credentials or client not registered.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef4f4] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
        <aside className="relative hidden overflow-hidden bg-teal-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(45,212,191,0.32),transparent_30%),radial-gradient(circle_at_86%_78%,rgba(56,189,248,0.18),transparent_28%)]" />
          <div className="brand-dots absolute inset-0 opacity-10" />
          <Link href="/" className="relative inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-sm font-black text-teal-950">IF</span>
            <span className="text-lg font-bold">InvoiceForge</span>
          </Link>
          <div className="relative max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-200">Secure client access</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              Everything your company shared, in one private portal.
            </h2>
            <p className="mt-5 text-base leading-8 text-teal-100/80">
              Review proposals, approve documents, download invoices, and make payments from one protected account.
            </p>
            <div className="mt-8 space-y-3">
              {["Company-scoped access", "Protected document history", "Clear payment status"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-300 text-xs font-black text-teal-950">+</span>
                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-teal-100/60">Only documents connected to your client record are visible.</p>
        </aside>

        <section className="flex min-w-0 items-center justify-center px-3 py-4 sm:px-8 sm:py-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-2 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-950 text-xs font-black text-white">IF</span>
                <span className="truncate text-sm font-bold">InvoiceForge</span>
              </Link>
              <Link href="/login" className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 shadow-sm">
                Company login
              </Link>
            </div>

            <div className="rounded-[22px] border border-white/80 bg-white p-4 shadow-2xl shadow-teal-950/10 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-sm font-black text-teal-800 ring-1 ring-teal-100">CP</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Client portal</p>
                  <p className="mt-0.5 text-xs text-slate-500">Private document access</p>
                </div>
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl">
                {setupMode ? "Create your secure password" : "Welcome to your client portal"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {setupMode
                  ? "Complete your account setup to securely access company documents."
                  : "Use the email address registered by the company that invited you."}
              </p>

              <form onSubmit={submit} className="mt-5 grid gap-3.5 sm:mt-6 sm:gap-4">
          <Field label="Company ID">
            <input
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              placeholder="Only needed if you use multiple companies"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 sm:h-12"
            />
          </Field>
          <Field label="Email address">
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="client@company.com"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 sm:h-12"
            />
          </Field>
          <Field label={setupMode ? "New password" : "Password"}>
            <PasswordInput
              value={password}
              show={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              onChange={setPassword}
              autoComplete={setupMode ? "new-password" : "current-password"}
            />
          </Field>
          {setupMode ? (
            <>
              <Field label="Confirm password">
                <PasswordInput
                  value={confirmPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((current) => !current)}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                />
              </Field>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-600 transition-all"
                    style={{ width: `${passwordScore * 20}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Use 8+ characters with uppercase, lowercase, number, and special character.
                </p>
              </div>
            </>
          ) : null}

          {message ? (
            <p className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl bg-teal-700 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
          >
            {loading ? "Please wait..." : setupMode ? "Create password and continue" : "Sign in securely"}
          </button>
        </form>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs sm:mt-6 sm:pt-5 sm:text-sm">
                <Link href="/portal/forgot-password" className="font-bold text-teal-700">Forgot password?</Link>
                <Link href="/login" className="font-semibold text-slate-500 hover:text-slate-900">Company team login</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({
  value,
  show,
  autoComplete,
  onChange,
  onToggle,
}: {
  value: string;
  show: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100">
      <input
        required
        minLength={8}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter password"
        className="h-11 min-w-0 flex-1 px-3 text-sm outline-none sm:h-12"
      />
      <button
        type="button"
        onClick={onToggle}
        className="w-16 border-l border-slate-200 text-xs font-semibold text-slate-600"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

async function portalRequest(path: string, body: Record<string, string>): Promise<PortalResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as PortalResponse & {
    message?: string | string[];
  };

  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    if (response.status >= 500) {
      throw new Error(
        "We could not sign you in right now. Please try again in a moment.",
      );
    }

    throw new Error(message || "Invalid credentials or client not registered.");
  }

  return data;
}

function readTenantIdFromToken(token: string): string {
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized)) as { tenantId?: string };
    return parsed.tenantId ?? "";
  } catch {
    return "";
  }
}

function readRequestMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getPasswordScore(password: string): number {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}
