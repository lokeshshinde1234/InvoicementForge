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
    <main className="grid min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-teal-600 text-sm font-bold text-white">
            IF
          </span>
          <span className="font-semibold">InvoiceForge</span>
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-teal-700">
          Client portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {setupMode ? "Create your password" : "Client sign in"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign in with the email saved by your company. Access is scoped to your
          company and your client record.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Field label="Company ID">
            <input
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              placeholder="Optional unless your email is in multiple companies"
              className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
              className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
              <div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-600 transition-all"
                    style={{ width: `${passwordScore * 20}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
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
            className="h-11 rounded-md bg-teal-600 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : setupMode ? "Create password" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          <Link href="/portal/forgot-password" className="font-semibold text-teal-700">
            Forgot password?
          </Link>
        </p>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
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
    <div className="flex overflow-hidden rounded-md border border-slate-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
      <input
        required
        minLength={8}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter password"
        className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
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
