import { BillingCycle, TenantPlan } from '../tenants/tenant.entity';

export type PlanDefinition = {
  plan: TenantPlan;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlySendLimit: number;
  monthlyTemplateLimit: number;
  yearlyMonthlySendLimit: number;
  yearlyTemplateLimit: number;
  features: string[];
};

export const PLAN_DEFINITIONS: Record<TenantPlan, PlanDefinition> = {
  [TenantPlan.FREE]: {
    plan: TenantPlan.FREE,
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlySendLimit: 3,
    monthlyTemplateLimit: 1,
    yearlyMonthlySendLimit: 3,
    yearlyTemplateLimit: 1,
    features: ['3 document sends', '1 workspace', 'Basic templates'],
  },
  [TenantPlan.STARTER]: {
    plan: TenantPlan.STARTER,
    name: 'Starter',
    monthlyPrice: 1499,
    yearlyPrice: 999 * 12,
    monthlySendLimit: 10,
    monthlyTemplateLimit: 5,
    yearlyMonthlySendLimit: 15,
    yearlyTemplateLimit: 8,
    features: [
      '10 document sends',
      'Up to 5 templates',
      'E-signatures',
      'Document tracking',
      'Payment links',
    ],
  },
  [TenantPlan.BUSINESS]: {
    plan: TenantPlan.BUSINESS,
    name: 'Business',
    monthlyPrice: 3999,
    yearlyPrice: 2999 * 12,
    monthlySendLimit: 50,
    monthlyTemplateLimit: 25,
    yearlyMonthlySendLimit: 75,
    yearlyTemplateLimit: 40,
    features: [
      '50 document sends',
      'Up to 25 templates',
      'Roles and permissions',
      'Document analytics',
      'Accounting integrations',
    ],
  },
  [TenantPlan.ENTERPRISE]: {
    plan: TenantPlan.ENTERPRISE,
    name: 'Enterprise',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlySendLimit: 999999,
    monthlyTemplateLimit: 999999,
    yearlyMonthlySendLimit: 999999,
    yearlyTemplateLimit: 999999,
    features: [
      'Custom sends',
      'Unlimited templates',
      'SSO',
      'API access',
      'Custom rollout',
    ],
  },
};

export function planAmount(
  plan: TenantPlan,
  billingCycle: BillingCycle,
): number {
  const definition = PLAN_DEFINITIONS[plan];
  return billingCycle === BillingCycle.YEARLY
    ? definition.yearlyPrice
    : definition.monthlyPrice;
}

export function planLimits(
  plan: TenantPlan,
  billingCycle: BillingCycle,
): {
  monthlySendLimit: number;
  monthlyTemplateLimit: number;
} {
  const definition = PLAN_DEFINITIONS[plan];
  return billingCycle === BillingCycle.YEARLY
    ? {
        monthlySendLimit: definition.yearlyMonthlySendLimit,
        monthlyTemplateLimit: definition.yearlyTemplateLimit,
      }
    : {
        monthlySendLimit: definition.monthlySendLimit,
        monthlyTemplateLimit: definition.monthlyTemplateLimit,
      };
}
