import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazily create the Stripe instance so the server can start without STRIPE_SECRET_KEY.
 * Mirrors the getDb() pattern in db.ts.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY manquant dans les variables d'environnement");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}
