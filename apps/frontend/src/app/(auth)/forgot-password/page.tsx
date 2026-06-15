"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post<{
        message: string;
        delivery?: { mode: string };
        smsDelivery?: { mode: string };
      }>(
        "/company-owner/forgot-password",
        { email },
      );
      setMessage(
        response.data.delivery?.mode === "log" &&
          response.data.smsDelivery?.mode !== "twilio"
          ? "Reset link created. Email delivery is not configured, so check backend logs for local testing."
          : response.data.message,
      );
    } catch (requestError) {
      const fallback = "Could not send reset link.";
      setError(readApiMessage(requestError, fallback));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950">
      <section className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-teal-600 text-sm font-bold text-white">
            IF
          </span>
          <span className="font-semibold">InvoiceForge</span>
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter the email connected to your company owner account.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
          {message ? <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">{message}</p> : null}
          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <button disabled={loading} className="h-11 rounded-md bg-teal-600 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          Already have access? <Link href="/login" className="font-semibold text-teal-700">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

function readApiMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    return message ?? fallback;
  }
  return fallback;
}
