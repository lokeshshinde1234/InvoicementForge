"use client";

import { FormEvent, useState } from "react";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { api } from "@/lib/api";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const formData = new FormData(event.currentTarget);

    try {
      await api.post("/demo-requests", {
        name: formData.get("name"),
        email: formData.get("email"),
        company: "Contact inquiry",
        message: formData.get("message"),
        source: "contact_page",
      });
      setSent(true);
      event.currentTarget.reset();
    } catch {
      setError("We could not send your message right now. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="brand-grid brand-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Contact</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Talk to InvoiceForge.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Questions about proposal workflows, pricing, integrations, or backend setup can start here.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="proposal-shadow rounded-lg border border-white/80 bg-white/95 p-6 backdrop-blur">
          <div className="grid gap-4">
            <input name="name" required placeholder="Name" className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
            <input name="email" required type="email" placeholder="Email" className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
            <textarea name="message" required placeholder="Message" rows={5} className="rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-teal-600" />
            {sent ? <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">Message saved. Super Admin can review it with demo and contact leads.</p> : null}
            {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <button disabled={sending} type="submit" className="h-11 rounded-md bg-teal-600 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Sending..." : "Send message"}</button>
          </div>
        </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
