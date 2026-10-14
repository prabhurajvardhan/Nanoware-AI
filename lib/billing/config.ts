export type BillingPlan = { id: string; name: string; description: string; priceId: string | null };

const configuredPlans: BillingPlan[] = [
  { id: 'starter', name: process.env.STRIPE_STARTER_PLAN_NAME || 'Starter', description: 'Configurable starter access to Nanoware AI tools.', priceId: process.env.STRIPE_STARTER_PRICE_ID || null },
  { id: 'pro', name: process.env.STRIPE_PRO_PLAN_NAME || 'Pro', description: 'Configurable expanded access to Nanoware AI tools.', priceId: process.env.STRIPE_PRO_PRICE_ID || null },
];

export function getBillingPlans() { return configuredPlans; }
export function getBillingPlan(id: string) { return configuredPlans.find((plan) => plan.id === id) || null; }
export function canUsePaidTools(state: unknown) { return state === 'active' || state === 'trialing'; }
