export const COOKIE_NAME = "app_session_id";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Shipping constants (in cents) — single source of truth
export const FREE_SHIPPING_THRESHOLD = 5000; // 50.00€
export const SHIPPING_COST = 500; // 5.00€

/** Format price from cents to display string (e.g., 2999 → "29,99 €") */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}
