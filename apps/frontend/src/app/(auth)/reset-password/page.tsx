"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post<{ message: string }>("/company-owner/reset-password", {
        token: searchParams.get("token") ?? "",
        newPassword,
        confirmPassword,
      });
      setMessage(response.data.message);
      window.setTimeout(() => router.push("/login"), 1200);
    } catch (requestError) {
      setError(readApiMessage(requestError, "Invalid or expired reset link."));
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
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Create a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use 8+ characters with uppercase, lowercase, number, and special character.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
          <input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
          {message ? <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">{message}</p> : null}
          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <button disabled={loading} className="h-11 rounded-md bg-teal-600 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
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
