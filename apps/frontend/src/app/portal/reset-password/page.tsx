"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

export default function ClientResetPasswordPage() {
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
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/client/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: searchParams.get("token") ?? "",
          companyId: searchParams.get("companyId") ?? "",
          newPassword,
          confirmPassword,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Invalid or expired reset link.");
      }

      setMessage(body.message || "Password updated successfully. Please login again.");
      window.setTimeout(() => router.push("/portal/login"), 1200);
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
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Create a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use 8+ characters with uppercase, lowercase, number, and special character.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
          <input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
          {message ? <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">{message}</p> : null}
          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <button disabled={loading} className="h-11 rounded-md bg-teal-600 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Updating..." : "Reset password"}
          </button>
        </form>
      </section>
    </main>
  );
}
