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
    <main className="min-h-screen bg-[#fff9ef] text-slate-950">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-amber-200/70 px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(251,146,60,0.20),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(20,184,166,0.24),transparent_30%),linear-gradient(180deg,rgba(255,249,239,0.2),#fff9ef_90%)]" />
        <div className="relative mx-auto max-w-7xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Pricing
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Pricing that fits how your team sends proposals.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Choose a plan around document sends, templates, analytics, and
            control. Drafting and editing stay simple, while client sends scale
            with your team.
          </p>
          <div className="mx-auto mt-8 inline-flex rounded-full border border-slate-300 bg-white p-1 shadow-sm">
            {(["annual", "monthly"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBilling(option)}
                className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                  billing === option
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {option}
                {option === "annual" ? " - save up to 4 months" : ""}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {planCards.map((plan) => {
            const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const cycle = publicBillingToUi(billing);
            const dynamicPlan = dashboardSubscriptionPlans.find(
              (item) => item.name.toLowerCase() === plan.name.toLowerCase(),
            );
            const details = dynamicPlan?.cycles[cycle];

            return (
              <article
                key={plan.name}
                className={`group relative rounded-lg border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  plan.popular
                    ? "border-teal-500 shadow-teal-900/10"
                    : "border-slate-200 hover:border-teal-500"
                }`}
              >
                {plan.popular ? (
                  <span className="absolute right-5 top-5 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                ) : null}
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                <p className="mt-4 min-h-14 text-sm leading-6 text-slate-600">
                  {plan.description}
                </p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{price}</span>
                  {plan.cadence ? <span className="pb-1 text-sm text-slate-500">{plan.cadence}</span> : null}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {billing === "annual" ? "Billed annually" : "Billed monthly"}
                </p>
                <Link
                  href={pricingHref(plan.name, billing)}
                  className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-semibold transition group-hover:-translate-y-0.5 ${
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
                <div className="mt-6 rounded-md bg-[#f6fbf9] p-4">
                  <p className="text-sm font-semibold text-slate-950">{details?.sends ?? plan.sendLimit}</p>
                  <p className="mt-1 text-xs text-slate-500">{details?.overage ?? plan.overage}</p>
                  {details ? (
                    <p className="mt-1 text-xs font-semibold text-slate-500">{details.templates}</p>
                  ) : null}
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  {(details?.features ?? plan.features).map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
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
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
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
                      <td className="p-4 font-semibold">{plan.name}</td>
                      <td className="p-4 text-slate-600">{details?.sends ?? plan.sendLimit}</td>
                      <td className="p-4 text-slate-600">{details?.overage ?? plan.overage}</td>
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
