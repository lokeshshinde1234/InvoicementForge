"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";

export default function ClientForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/client/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyId }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Invalid credentials or client not registered.");
      }

      setMessage(
        body.delivery?.mode === "log"
          ? "Reset link created. SMTP is not configured, so check backend logs for local testing."
          : body.message || "Password reset link sent successfully.",
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950">
      <section className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
        <Link href="/portal/login" className="text-sm font-semibold text-teal-700">
          Back to client login
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Reset client password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter your registered email. If your email exists in multiple companies, include the company ID.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="client@company.com" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
          <input value={companyId} onChange={(event) => setCompanyId(event.target.value)} placeholder="Company ID (optional)" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
          {message ? <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">{message}</p> : null}
          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <button disabled={loading} className="h-11 rounded-md bg-teal-600 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </section>
    </main>
  );
}
