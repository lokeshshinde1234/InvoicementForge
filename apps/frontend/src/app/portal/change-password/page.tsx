"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

type PortalTokenPayload = {
  email?: string;
  tenantId?: string;
};

export default function ClientPasswordSettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState<"update" | "reset" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    const payload = readPortalToken(token);
    setResetEmail(payload.email ?? "");
    setCompanyId(payload.tenantId ?? "");
  }, [router]);

  const passwordScore = useMemo(() => getPasswordScore(newPassword), [newPassword]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("update");
    setMessage("");
    setError("");

    try {
      const token = window.localStorage.getItem("portalClientToken");
      const response = await fetch(`${API_BASE_URL}/client/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Could not update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(body.message || "Password updated successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function sendResetLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("reset");
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/client/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, companyId }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Could not send reset link.");
      }

      setMessage(
        body.delivery?.mode === "log"
          ? "Reset link created. Email delivery is not configured, so check backend logs for local testing."
          : body.message || "Password reset link sent successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_35%),#f5f7fb] px-3 py-5 text-slate-950 sm:px-4 sm:py-10">
      <section className="mx-auto w-full max-w-5xl">
        <Link href="/portal/dashboard" className="text-sm font-semibold text-teal-700">
          Back to dashboard
        </Link>

        <div className="mt-4 rounded-2xl border border-white bg-white p-5 shadow-xl shadow-teal-950/10 sm:mt-6 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Client password
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Password settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Update your password if you know the current one, or send yourself
            a reset link if you forgot it.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">
              Change with current password
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this when you remember your existing client portal password.
            </p>

            <form onSubmit={updatePassword} className="mt-6 grid gap-4">
              <PasswordField
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Current password"
                autoComplete="current-password"
              />
              <PasswordField
                value={newPassword}
                onChange={setNewPassword}
                placeholder="New password"
                autoComplete="new-password"
              />
              <PasswordField
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
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
              <button
                disabled={loading !== null}
                className="h-11 rounded-md bg-teal-600 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading === "update" ? "Updating..." : "Update password"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">
              Forgot current password?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This uses the same secure reset flow as the client login page. We
              send a reset link to your registered email, and you create a new
              password from that link.
            </p>

            <form onSubmit={sendResetLink} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Registered email
                <input
                  required
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="client@company.com"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Company ID
                <input
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  placeholder="Company ID"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>
              <button
                disabled={loading !== null}
                className="h-11 rounded-md border border-teal-200 bg-teal-50 text-sm font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-60"
              >
                {loading === "reset" ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </section>
        </div>

        {message ? (
          <p className="mt-6 rounded-md bg-teal-50 p-3 text-sm font-medium text-teal-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-md bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <input
      required
      minLength={8}
      type="password"
      value={value}
      autoComplete={autoComplete}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
    />
  );
}

function readPortalToken(token: string): PortalTokenPayload {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized)) as PortalTokenPayload;
  } catch {
    return {};
  }
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
