"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { dashboardSubscriptionPlans, planDetails } from "@/lib/subscription-plans";

type CheckoutResponse = {
  checkoutId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string | null;
  plan: string;
  billingCycle: string;
  fallback: boolean;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  callback_url?: string;
  redirect?: boolean;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};

type RazorpayCheckout = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const planKey = searchParams.get("plan") === "business" ? "business" : "starter";
  const billing = searchParams.get("billing") === "yearly" ? "yearly" : "monthly";
  const plan = dashboardSubscriptionPlans.find((item) => item.key === planKey) ?? dashboardSubscriptionPlans[0];
  const details = planDetails(planKey, billing) ?? plan.cycles.monthly;
  const amount = details.price;

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount),
    [amount],
  );

  async function createCheckout() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post<CheckoutResponse>("/subscription/checkout", {
        plan: plan.key.toUpperCase(),
        billingCycle: billing === "yearly" ? "YEARLY" : "MONTHLY",
      });
      setCheckout(response.data);
      setMessage(
        response.data.fallback
          ? "Checkout created. Razorpay keys are not configured, so manual activation is available for this environment."
          : "Checkout created. Choose your payment method below.",
      );
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function activateFallback() {
    if (!checkout) return;
    setActivating(true);
    setError("");

    try {
      await api.post(`/subscription/checkouts/${checkout.checkoutId}/manual-activate`);
      setMessage("Subscription activated. Your company plan is updated.");
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setActivating(false);
    }
  }

  async function payWithRazorpay() {
    if (!checkout || checkout.fallback || !checkout.keyId) return;
    setPaying(true);
    setError("");
    setMessage("");

    try {
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout did not load.");
      }

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: Math.round(checkout.amount * 100),
        currency: checkout.currency,
        name: "InvoiceForge",
        description: `${plan.name} ${billing} subscription`,
        order_id: checkout.razorpayOrderId,
        callback_url: absoluteApiUrl("/subscription/razorpay/callback"),
        redirect: true,
        theme: { color: "#0f766e" },
        handler: async (response) => {
          try {
            await api.post("/subscription/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setMessage("Payment verified. Your subscription is active.");
            router.push(
              `/subscription/result?status=success&plan=${encodeURIComponent(plan.name)}&billing=${encodeURIComponent(billing)}`,
            );
          } catch (err) {
            setError(readApiError(err));
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      });

      razorpay.open();
    } catch (err) {
      setPaying(false);
      setError(err instanceof Error ? err.message : "Could not open Razorpay checkout.");
    }
  }

  function showPayuMessage() {
    setError("");
    setMessage("PayU is listed as a supported payment rail, but gateway credentials are not connected yet.");
  }

  function payWithUpi() {
    if (!checkout) return;
    const params = new URLSearchParams({
      pa: "invoiceforge@upi",
      pn: "InvoiceForge",
      am: checkout.amount.toFixed(2),
      cu: checkout.currency,
      tn: `${plan.name} ${billing} subscription ${checkout.razorpayOrderId}`,
    });

    window.location.href = `upi://pay?${params.toString()}`;
  }

  return (
    <DashboardShell active="Dashboard">
      <div className="mx-auto max-w-5xl space-y-6 rounded-2xl bg-[linear-gradient(135deg,#f8fafc_0%,#ecfdf5_48%,#fff7ed_100%)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-6">
        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                Subscription checkout
              </p>
              <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">{plan.name}</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Continue your workspace with branded proposals, approvals, invoice automation, and secure payments.
                  </p>
                  <div className="mt-5 text-4xl font-black tracking-tight">
                    {formattedAmount}
                    <span className="ml-2 text-sm font-semibold text-slate-500">{details.cadence}</span>
                  </div>
                </div>
                <Link
                  href="/dashboard/pricing"
                  className="w-fit rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Change plan
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <PlanLine label="Document sends" value={details.sends} />
                <PlanLine label="Templates" value={details.templates} />
                <PlanLine label="Usage policy" value={details.overage} />
                {details.features.map((feature) => (
                  <PlanLine key={feature} label="Included" value={feature} />
                ))}
              </div>

              {message ? (
                <p className="mt-5 rounded-lg bg-teal-50 p-3 text-sm font-semibold text-teal-800">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={createCheckout}
                  disabled={loading}
                  className="shine h-11 rounded-lg bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating checkout..." : "Proceed to payment"}
                </button>
                {checkout?.fallback ? (
                  <button
                    type="button"
                    onClick={activateFallback}
                    disabled={activating}
                    className="h-11 rounded-lg bg-teal-600 px-5 text-sm font-black text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {activating ? "Activating..." : "Activate subscription"}
                  </button>
                ) : null}
              </div>
            </div>

            <aside className="bg-slate-950 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Payment options</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">Select a secure payment rail.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Create checkout details first, then pick Razorpay, PayU, or UPI from the available options.
              </p>

              <div className="mt-6 grid gap-3">
                <PaymentOption
                  title="Razorpay"
                  copy={checkout?.fallback ? "Razorpay keys are not configured in this environment." : "Cards, net banking, wallets, and UPI through Razorpay Checkout."}
                  badge={checkout && !checkout.fallback ? "Ready" : "Requires checkout"}
                  active={Boolean(checkout && !checkout.fallback)}
                  onClick={payWithRazorpay}
                  disabled={!checkout || checkout.fallback || paying}
                />
                <PaymentOption
                  title="PayU"
                  copy="PayU option is available in the payment selector and can be connected when gateway credentials are added."
                  badge="Not connected"
                  active={Boolean(checkout)}
                  disabled={!checkout}
                  onClick={showPayuMessage}
                />
                <PaymentOption
                  title="UPI"
                  copy="Open a UPI intent for manual payment coordination with the billing team."
                  badge="Manual"
                  active={Boolean(checkout)}
                  disabled={!checkout}
                  onClick={payWithUpi}
                />
              </div>
            </aside>
          </div>
        </section>

        {checkout ? (
          <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-950/10 backdrop-blur">
            <h2 className="text-base font-black">Checkout details</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <PlanLine label="Order ID" value={checkout.razorpayOrderId} />
              <PlanLine label="Payment key" value={checkout.keyId ?? "Manual fallback"} />
              <PlanLine label="Currency" value={checkout.currency} />
              <PlanLine label="Billing" value={checkout.billingCycle} />
            </div>
            {checkout && !checkout.fallback ? (
              <button
                type="button"
                onClick={payWithRazorpay}
                disabled={paying}
                className="mt-5 h-11 rounded-lg bg-teal-600 px-5 text-sm font-black text-white shadow-lg shadow-teal-900/20 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? "Opening Razorpay..." : "Pay now with Razorpay"}
              </button>
            ) : null}
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function PlanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function PaymentOption({
  title,
  copy,
  badge,
  active,
  disabled,
  onClick,
}: {
  title: string;
  copy: string;
  badge: string;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "border-teal-300 bg-teal-400/10 hover:bg-teal-400/15"
          : "border-white/10 bg-white/5"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-base font-black">{title}</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
          {badge}
        </span>
      </span>
      <span className="mt-2 block text-sm leading-6 text-slate-300">{copy}</span>
    </button>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay checkout can only run in the browser."));
      return;
    }

    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay checkout.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function absoluteApiUrl(path: string): string {
  const baseUrl = String(api.defaults.baseURL ?? "").replace(/\/$/, "");

  if (/^https?:\/\//i.test(baseUrl)) {
    return `${baseUrl}${path}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${baseUrl || ""}${path}`;
  }

  return path;
}

function readApiError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string };
    return data.message ?? "Checkout failed.";
  }

  return "Checkout failed.";
}
