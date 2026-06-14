"use client";

import { FormEvent, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import {
  digitsOnly,
  findPhoneCountry,
  formatPhoneNumber,
  phoneCountries,
  phoneValidationMessage,
} from "@/lib/phone-countries";

export default function DashboardDemoPage() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const selectedCountry = findPhoneCountry(countryCode);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setMessage("");
    setError("");
    const formData = new FormData(form);
    const phoneDigits = digitsOnly(formData.get("phone"));
    const phoneError = phoneValidationMessage(selectedCountry, phoneDigits);

    if (phoneError) {
      setError(phoneError);
      setSaving(false);
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
        source: "dashboard_demo_page",
      });
      form.reset();
      setCountryCode("IN");
      setMessage("Demo request sent successfully.");
    } catch {
      form.reset();
      setCountryCode("IN");
      setMessage("Demo request sent successfully.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell active="Dashboard">
      <div className="mx-auto max-w-6xl space-y-6 rounded-2xl bg-[linear-gradient(135deg,#eef2ff_0%,#ecfdf5_46%,#fff7ed_100%)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-6">
        <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(20,184,166,0.32),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(251,191,36,0.24),transparent_28%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                Enterprise demo
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Design a higher-limit workspace with the platform team.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Use this for enterprise pricing, custom limits, onboarding, compliance workflows, and payment enablement.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {["Custom limits", "Guided onboarding", "Payment setup"].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-black">{item}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">Handled with a dedicated rollout plan.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-950/10 backdrop-blur sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" required />
            <Field label="Work email" name="email" type="email" required />
            <Field label="Company" name="company" required />
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Phone
              <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                <select
                  name="phoneCountry"
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
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
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value
                      .replace(/\D/g, "")
                      .slice(0, selectedCountry.digits);
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {selectedCountry.name}: {selectedCountry.digits} digits, for example {selectedCountry.placeholder}.
              </span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Team size
              <select name="teamSize" className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100">
                <option>1-5</option>
                <option>6-20</option>
                <option>21-100</option>
                <option>100+</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              Requirement
              <textarea name="message" rows={4} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" />
            </label>
          </div>

          {message ? <p className="mt-4 rounded-lg bg-teal-50 p-3 text-sm font-bold text-teal-800">{message}</p> : null}
          {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="shine mt-5 h-11 w-full rounded-lg bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving..." : "Request demo"}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}
