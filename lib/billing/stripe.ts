import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_NOT_CONFIGURED');
  if (!stripe) stripe = new Stripe(secretKey);
  return stripe;
}

export function getAppUrl() {
  const url = process.env.APP_URL;
  if (!url) throw new Error('APP_URL_NOT_CONFIGURED');
  return url.replace(/\/$/, '');
}
