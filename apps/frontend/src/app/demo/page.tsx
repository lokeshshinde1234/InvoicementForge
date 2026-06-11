"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { api } from "@/lib/api";
import {
  digitsOnly,
  findPhoneCountry,
  formatPhoneNumber,
  phoneCountries,
  phoneValidationMessage,
} from "@/lib/phone-countries";

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const selectedCountry = findPhoneCountry(countryCode);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const phoneDigits = digitsOnly(formData.get("phone"));
    const phoneError = phoneValidationMessage(selectedCountry, phoneDigits);

    if (phoneError) {
      setError(phoneError);
      setSubmitting(false);
      return;
    }

    try {
      await api.post("/demo-requests", {
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        phone: formatPhoneNumber(selectedCountry, phoneDigits),
        phoneCountry: selectedCountry.code,
        teamSize: formData.get("teamSize"),
        message: formData.get("message"),
        source: "book_demo_page",
      });
      setSubmitted(true);
      event.currentTarget.reset();
      setCountryCode("IN");
    } catch (requestError) {
      setError(readApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="brand-grid brand-surface border-b border-amber-200/70 px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_460px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Get demo</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              See the full proposal-to-invoice workflow.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Request a walkthrough of branded proposals, templates, quoting,
              signatures, client portals, GST invoices, and backend-connected auth.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/signup" className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5">
                Start free trial
              </Link>
              <Link href="/pricing" className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-slate-950">
                View pricing
              </Link>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="proposal-shadow rounded-lg border border-white/80 bg-white/95 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold">Book your demo</h2>
            <div className="mt-5 space-y-4">
              {[
                ["Name", "name", "text"],
                ["Work email", "email", "email"],
                ["Company", "company", "text"],
              ].map(([label, name, type]) => (
                <label key={label} className="block">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <input name={name} type={type} required={name !== "phone"} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
                </label>
              ))}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <div className="mt-2 grid grid-cols-[132px_1fr] gap-2">
                  <select
                    name="phoneCountry"
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    className="h-11 rounded-md border border-slate-300 bg-white px-2 text-sm font-semibold outline-none focus:border-teal-600"
                  >
                    {phoneCountries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.dialCode} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={selectedCountry.digits}
                    pattern={`[0-9]{${selectedCountry.digits}}`}
                    placeholder={`${selectedCountry.digits} digits`}
                    required
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600"
                    onInput={(event) => {
                      event.currentTarget.value = event.currentTarget.value
                        .replace(/\D/g, "")
                        .slice(0, selectedCountry.digits);
                    }}
                  />
                </div>
                <span className="mt-1 block text-xs font-medium text-slate-500">
                  {selectedCountry.name}: enter {selectedCountry.digits} digits, for example {selectedCountry.placeholder}.
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Team size</span>
                <select name="teamSize" className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600">
                  <option>1-5</option>
                  <option>6-20</option>
                  <option>21-100</option>
                  <option>100+</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">What do you want to see?</span>
                <textarea name="message" rows={3} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600" />
              </label>
              {submitted ? (
                <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">
                  Demo request captured. Our platform team can see it in Super Admin under demo requests.
                </p>
              ) : null}
              {error ? (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
              ) : null}
              <button disabled={submitting} type="submit" className="h-11 w-full rounded-md bg-teal-600 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Saving..." : "Request demo"}
              </button>
            </div>
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function readApiError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string };
    return data.message ?? "We could not save your demo request right now. Please try again.";
  }

  return "We could not save your demo request right now. Please check that the backend is running and try again.";
}
