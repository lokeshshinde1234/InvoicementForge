export type BillingUiCycle = "monthly" | "yearly";
export type PublicBillingCycle = "monthly" | "annual";

export type PlanCycleDetails = {
  price: number;
  priceLabel: string;
  cadence: string;
  sends: string;
  templates: string;
  overage: string;
  features: string[];
};

export type SubscriptionPlanCard = {
  key: "starter" | "business";
  name: string;
  description: string;
  popular: boolean;
  cycles: Record<BillingUiCycle, PlanCycleDetails>;
};

export const dashboardSubscriptionPlans: SubscriptionPlanCard[] = [
  {
    key: "starter",
    name: "Starter",
    description: "For small teams sending branded proposals, quotes, and GST-ready invoices.",
    popular: true,
    cycles: {
      monthly: {
        price: 1499,
        priceLabel: "INR 1,499",
        cadence: "/month",
        sends: "10 document sends/month",
        templates: "Up to 5 templates",
        overage: "Upgrade required after 10 sends",
        features: ["E-signatures", "Document tracking", "Payment links"],
      },
      yearly: {
        price: 999 * 12,
        priceLabel: "INR 11,988",
        cadence: "/year",
        sends: "180 document sends/year",
        templates: "Up to 8 templates",
        overage: "15 sends/month equivalent with annual rollover",
        features: ["Everything in monthly", "Annual usage rollover", "Priority email support"],
      },
    },
  },
  {
    key: "business",
    name: "Business",
    description: "For growing businesses that need teams, analytics, compliance, and integrations.",
    popular: false,
    cycles: {
      monthly: {
        price: 3999,
        priceLabel: "INR 3,999",
        cadence: "/month",
        sends: "50 document sends/month",
        templates: "Up to 25 templates",
        overage: "Upgrade required after 50 sends",
        features: ["Roles and permissions", "Document analytics", "Accounting integrations"],
      },
      yearly: {
        price: 2999 * 12,
        priceLabel: "INR 35,988",
        cadence: "/year",
        sends: "900 document sends/year",
        templates: "Up to 40 templates",
        overage: "75 sends/month equivalent with annual rollover",
        features: ["Everything in monthly", "Advanced analytics", "Priority onboarding"],
      },
    },
  },
];

export function planDetails(planKey: string, billing: BillingUiCycle) {
  return dashboardSubscriptionPlans.find((plan) => plan.key === planKey)?.cycles[billing];
}

export function publicBillingToUi(value: PublicBillingCycle): BillingUiCycle {
  return value === "annual" ? "yearly" : "monthly";
}
