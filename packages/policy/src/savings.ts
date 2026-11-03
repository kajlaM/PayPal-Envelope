import { toCents, type Policy, type SavingsPlan } from './schema.ts';

// Paying into a vault over time (savings vaults and "save up, then buy"). Pure date/amount math,
// shared by the compiler (expiry), the API (when to charge next) and the site (what the plan says).

const DAY = 86_400_000;
export const SAVINGS_MAX_DAYS = 730; // a savings plan may run up to 2 years
const GRACE_DAYS = 7; // after the last planned payment: time for a late payment or a retry

/** `date` moved on by `n` intervals (months keep the day of month where they can). */
export function addInterval(date: Date, every: SavingsPlan['every'], n = 1): Date {
  if (every === 'DAY') return new Date(date.getTime() + n * DAY);
  if (every === 'WEEK') return new Date(date.getTime() + n * 7 * DAY);
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

/** How many payments reach the goal, and when the last one is due if the first is paid at `start`. */
export function savingsSchedule(goalCents: number, plan: SavingsPlan, start: Date) {
  const per = toCents(plan.amount_per_payment);
  const payments = Math.max(1, Math.ceil(goalCents / per));
  const lastPaymentAt = addInterval(start, plan.every, payments - 1);
  return { payments, perPaymentCents: per, lastPaymentCents: goalCents - per * (payments - 1), lastPaymentAt };
}

/**
 * The end date a vault paid over time needs: the last planned payment plus a week, and for a vault
 * that shops once the goal is reached, at least `buyWindowDays` after that to find the item.
 */
export function savingsExpiry(policy: Pick<Policy, 'allocated_budget' | 'vault_type'> & { savings: SavingsPlan }, start: Date, buyWindowDays = 14): Date {
  const { lastPaymentAt } = savingsSchedule(toCents(policy.allocated_budget), policy.savings, start);
  const extra = policy.vault_type === 'SAVINGS' ? GRACE_DAYS : Math.max(GRACE_DAYS, buyWindowDays);
  return new Date(lastPaymentAt.getTime() + extra * DAY);
}
