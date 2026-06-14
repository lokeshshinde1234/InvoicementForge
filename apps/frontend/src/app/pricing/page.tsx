"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { useMarketingContent } from "@/lib/marketing-content";
import { dashboardSubscriptionPlans, publicBillingToUi } from "@/lib/subscription-plans";

const compareRows = [
  ["Document sends per month", "3", "10", "50", "Custom"],
  ["Saved templates", "Basic", "Up to 5", "Up to 25", "Unlimited"],
  ["Rich media editor", "Included", "Included", "Included", "Included"],
  ["Interactive quoting", "-", "Included", "Included", "Included"],
  ["Document analytics", "-", "Basic", "Advanced", "Advanced"],
  ["Custom fields", "-", "-", "Included", "Included"],
  ["Roles and permissions", "-", "-", "Included", "Included"],
  ["API access", "-", "-", "-", "Included"],
];

const faqs = [
  ["Can I create unlimited drafts?", "Yes. Drafting, editing, and collaborating can stay unlimited. Sends are counted when a proposal is shared with a client."],
  ["Do I need a credit card for trial?", "No. The free trial CTA routes to signup and connects to your existing register endpoint."],
  ["Can I change plans later?", "Yes. Users can start with Free or Starter and move to Business or Enterprise as workflow complexity grows."],
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
  const { content } = useMarketingContent();
  const planCards = content.plans;

  return (
    <main className="pricing-mobile min-h-screen bg-[#f5f8f7] text-slate-950">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-slate-200 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(251,146,60,0.20),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(20,184,166,0.24),transparent_30%),linear-gradient(180deg,rgba(255,249,239,0.2),#fff9ef_90%)]" />
        <div className="relative mx-auto max-w-7xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Pricing
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Pricing that fits how your team sends proposals.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
            Choose a plan around document sends, templates, analytics, and
            control. Drafting and editing stay simple, while client sends scale
            with your team.
          </p>
          <div className="mx-auto mt-7 grid w-full max-w-sm grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-950/5 sm:mt-8 sm:inline-grid">
            {(["annual", "monthly"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBilling(option)}
                className={`rounded-xl px-3 py-2.5 text-xs font-bold capitalize transition sm:px-5 sm:text-sm ${
                  billing === option
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <span className="block">{option}</span>
                {option === "annual" ? <span className={`mt-0.5 block text-[9px] uppercase tracking-wide ${billing === option ? "text-teal-200" : "text-teal-700"}`}>Save up to 4 months</span> : <span className="mt-0.5 block text-[9px] uppercase tracking-wide opacity-60">Flexible billing</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {planCards.map((plan, planIndex) => {
            const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const cycle = publicBillingToUi(billing);
            const dynamicPlan = dashboardSubscriptionPlans.find(
              (item) => item.name.toLowerCase() === plan.name.toLowerCase(),
            );
            const details = dynamicPlan?.cycles[cycle];

            return (
              <article
                key={plan.name}
                className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-6 ${
                  plan.popular
                    ? "order-first border-teal-500 shadow-teal-900/15 sm:order-none"
                    : "border-slate-200 hover:border-teal-500"
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${plan.popular ? "bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500" : "bg-slate-200"}`} />
                {plan.popular ? (
                  <span className="absolute right-4 top-4 rounded-full bg-teal-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                    Most popular
                  </span>
                ) : null}
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">
                  {["Start free", "Small teams", "Growing teams", "Enterprise scale"][planIndex]}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{plan.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:min-h-24">
                  {plan.description}
                </p>
                <div className="mt-5 flex flex-wrap items-end gap-1">
                  <span className="text-3xl font-semibold tracking-tight sm:text-4xl">{price}</span>
                  {plan.cadence ? <span className="pb-1 text-sm text-slate-500">{plan.cadence}</span> : null}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {billing === "annual" ? "Billed annually" : "Billed monthly"}
                </p>
                <Link
                  href={pricingHref(plan.name, billing)}
                  className={`mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition group-hover:-translate-y-0.5 ${
                    plan.popular
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "border border-slate-300 text-slate-950 hover:border-slate-950"
                  }`}
                >
                  {plan.cta}
                </Link>
                <p className="mt-4 text-center text-xs text-slate-500">
                  {plan.name === "Enterprise"
                    ? "We'll design a package around your workflow."
                    : "14-day free trial. No credit card required."}
                </p>
                <div className="mt-5 rounded-xl border border-teal-100 bg-[#f0faf7] p-3.5">
                  <p className="text-sm font-semibold text-slate-950">{details?.sends ?? plan.sendLimit}</p>
                  <p className="mt-1 text-xs text-slate-500">{details?.overage ?? plan.overage}</p>
                  {details ? (
                    <p className="mt-1 text-xs font-semibold text-slate-500">{details.templates}</p>
                  ) : null}
                </div>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  {(details?.features ?? plan.features).map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-100 text-[10px] font-black text-teal-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Send limits
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Only pay for what you send.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Mirroring the proposal-software model, users can draft and
                collaborate freely. Sends are counted when a proposal is shared
                with a client.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <table className="mobile-card-table w-full text-left text-sm">
                <thead className="bg-[#f6fbf9] text-slate-700">
                  <tr>
                    <th className="p-4 font-semibold">Plan</th>
                    <th className="p-4 font-semibold">Included sends/month</th>
                    <th className="p-4 font-semibold">Overage</th>
                  </tr>
                </thead>
                <tbody>
                  {planCards.map((plan) => (
                    (() => {
                      const details = dashboardSubscriptionPlans.find(
                        (item) => item.name.toLowerCase() === plan.name.toLowerCase(),
                      )?.cycles[publicBillingToUi(billing)];
                      return (
                    <tr key={plan.name} className="border-t border-slate-200 transition hover:bg-amber-50/60">
                      <td data-label="Plan" className="p-4 font-semibold">{plan.name}</td>
                      <td data-label="Included sends" className="p-4 text-slate-600">{details?.sends ?? plan.sendLimit}</td>
                      <td data-label="Overage" className="p-4 text-slate-600">{details?.overage ?? plan.overage}</td>
                    </tr>
                      );
                    })()
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Compare plans
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Choose the level of control your team needs.
            </h2>
          </div>
          <Link href="/demo" className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Talk to sales
          </Link>
        </div>
        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="p-4 font-semibold">Feature</th>
                <th className="p-4 font-semibold">Free</th>
                <th className="p-4 font-semibold">Starter</th>
                <th className="p-4 font-semibold">Business</th>
                <th className="p-4 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row[0]} className="border-t border-slate-200 transition hover:bg-[#f6fbf9]">
                  {row.map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className={`p-4 ${index === 0 ? "font-semibold text-slate-950" : "text-slate-600"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#f6fbf9] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {faqs.map(([question, answer]) => (
            <article key={question} className="rounded-lg border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-teal-500 hover:shadow-lg">
              <h3 className="text-lg font-semibold">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function pricingHref(planName: string, billing: "annual" | "monthly") {
  if (planName === "Enterprise") return "/demo";
  if (planName === "Free") return "/signup";
  const plan = planName.toLowerCase();
  const cycle = billing === "annual" ? "yearly" : "monthly";
  return `/subscription/checkout?plan=${plan}&billing=${cycle}`;
}
