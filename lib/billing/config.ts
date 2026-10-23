export type BillingPlan = {
  id: string;
  name: string;
  description: string;
  providerPlanId: string | null;
  displayPrice?: string;
  storageGb?: number | null;
  monthlyTokenAllowance?: number | null;
  bookingLimit?: number | null;
  features: string[];
  customSales?: boolean;
  checkoutEnabled?: boolean;
  visible?: boolean;
};

const configuredPlans: BillingPlan[] = [
  {
    id: 'daken', name: 'Daken', description: 'Core CRM, booking, and WhatsApp AI features.', displayPrice: '$9 USD / month',
    storageGb: 2, monthlyTokenAllowance: 2_000_000, bookingLimit: null,
    features: ['CRM and customer history', 'Basic analytics', 'Booking management (no numerical quota)', 'WhatsApp AI agent entitlement'],
    providerPlanId: process.env.RAZORPAY_DAKEN_PLAN_ID || null, checkoutEnabled: process.env.DAKEN_CHECKOUT_ENABLED === 'true', visible: true,
  },
  {
    id: 'daken-plus', name: 'Daken+', description: 'Everything in Daken, plus advanced insights.', displayPrice: '$19 USD / month',
    storageGb: 5, monthlyTokenAllowance: 5_000_000, bookingLimit: null,
    features: ['Everything in Daken', 'Advanced analytics', 'Customer-pattern insights', 'Evidence-based AI marketing suggestions'],
    providerPlanId: process.env.RAZORPAY_DAKEN_PLUS_PLAN_ID || null, checkoutEnabled: process.env.DAKEN_PLUS_CHECKOUT_ENABLED === 'true', visible: true,
  },
  {
    id: 'daken-squared', name: 'Daken²', description: 'Custom CRM, AI agent, integrations, and negotiated allowances.', displayPrice: 'Custom pricing',
    storageGb: null, monthlyTokenAllowance: null, bookingLimit: null,
    features: ['Everything in Daken+', 'Custom CRM fields and workflows', 'Custom AI agent behavior and integrations', 'Negotiated storage and token allowances', 'Custom implementation and support'],
    providerPlanId: null, customSales: true, visible: true,
  },
  // Keep legacy plan identifiers for existing account records; no new Razorpay plans are sold under them.
  { id: 'starter', name: 'Starter', description: 'Legacy subscription.', providerPlanId: null, features: [], visible: false },
  { id: 'pro', name: 'Pro', description: 'Legacy subscription.', providerPlanId: null, features: [], visible: false },
];

export function getBillingPlans() { return configuredPlans; }
export function getPublicBillingPlans() { return configuredPlans.filter((plan) => plan.visible); }
export function getBillingPlan(id: string) { return configuredPlans.find((plan) => plan.id === id) || null; }
export function canUsePaidTools(state: unknown) { return state === 'active' || state === 'trialing'; }
