export type BillingPlan = {
  id: string;
  name: string;
  description: string;
  priceId: string | null;
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
    priceId: process.env.STRIPE_DAKEN_PRICE_ID || null, checkoutEnabled: process.env.DAKEN_CHECKOUT_ENABLED === 'true', visible: true,
  },
  {
    id: 'daken-plus', name: 'Daken+', description: 'Everything in Daken, plus advanced insights.', displayPrice: '$19 USD / month',
    storageGb: 5, monthlyTokenAllowance: 5_000_000, bookingLimit: null,
    features: ['Everything in Daken', 'Advanced analytics', 'Customer-pattern insights', 'Evidence-based AI marketing suggestions'],
    priceId: process.env.STRIPE_DAKEN_PLUS_PRICE_ID || null, checkoutEnabled: process.env.DAKEN_PLUS_CHECKOUT_ENABLED === 'true', visible: true,
  },
  {
    id: 'daken-squared', name: 'Daken²', description: 'Custom CRM, AI agent, integrations, and negotiated allowances.', displayPrice: 'Custom pricing',
    storageGb: null, monthlyTokenAllowance: null, bookingLimit: null,
    features: ['Everything in Daken+', 'Custom CRM fields and workflows', 'Custom AI agent behavior and integrations', 'Negotiated storage and token allowances', 'Custom implementation and support'],
    priceId: null, customSales: true, visible: true,
  },
  // Preserve legacy identifiers for subscribers/webhook reconciliation, but hide them from new sales.
  { id: 'starter', name: process.env.STRIPE_STARTER_PLAN_NAME || 'Starter', description: 'Legacy starter subscription.', priceId: process.env.STRIPE_STARTER_PRICE_ID || null, features: [], visible: false },
  { id: 'pro', name: process.env.STRIPE_PRO_PLAN_NAME || 'Pro', description: 'Legacy pro subscription.', priceId: process.env.STRIPE_PRO_PRICE_ID || null, features: [], visible: false },
];

export function getBillingPlans() { return configuredPlans; }
export function getPublicBillingPlans() { return configuredPlans.filter((plan) => plan.visible); }
export function getBillingPlan(id: string) { return configuredPlans.find((plan) => plan.id === id) || null; }
export function canUsePaidTools(state: unknown) { return state === 'active' || state === 'trialing'; }
