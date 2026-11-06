import { runDueAgents } from './agent-runs.ts';
import { chargeDueSavings } from './savings.ts';
import { sweepOnce } from './sweeper.ts';
import { verifyAllVaults } from './verify.ts';

// Background jobs (Steps 8 + 10), one tick per minute:
//   1. sweeper: settle payouts, close expired vaults, refund their balance
//   2. savings: take the payments that are due (vaults paid into over time)
//   3. watch mode: run shopping agents whose next check is due
//   4. once a night (VERIFY_HOUR, default 3 AM in ALERT_TIMEZONE): check every vault's payments
//      against PayPal's own records ("Verified by PayPal", read-only)
// The API runs the tick itself. A Render Cron Job (apps/sweeper) can call POST /api/jobs/tick
// instead; set BACKGROUND_JOBS=off on the API then. Running both is safe, just wasteful.

export async function tick() {
  const swept = await sweepOnce();
  const savings = await chargeDueSavings();
  const agentsRun = await runDueAgents();
  const vaultsVerified = verifyDue() ? (await verifyAllVaults()).length : null;
  return { swept, savings, agentsRun, vaultsVerified };
}

// The nightly PayPal check runs on the first tick in VERIFY_HOUR, once per day.
let lastVerifyDay = '';
function verifyDue(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.ALERT_TIMEZONE?.trim() || 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = `${part('year')}-${part('month')}-${part('day')}`;
  if (Number(part('hour')) !== Number(process.env.VERIFY_HOUR ?? 3) || day === lastVerifyDay) return false;
  lastVerifyDay = day;
  return true;
}

export function startBackgroundJobs(everyMs = 60_000) {
  if (process.env.BACKGROUND_JOBS?.trim().toLowerCase() === 'off') return;
  let busy = false;
  setInterval(async () => {
    if (busy) return; // previous tick still running (e.g. a long agent run)
    busy = true;
    try {
      const { swept, savings, agentsRun } = await tick();
      for (const s of swept) console.log(`[sweeper] vault ${s.vaultId}: ${s.action}`);
      for (const s of savings) console.log(`[savings] vault ${s.vaultId}: ${s.action}`);
      if (agentsRun.length) console.log(`[watch] ran agents for ${agentsRun.join(', ')}`);
    } catch (err) {
      console.error('Background tick failed:', (err as Error).message);
    } finally {
      busy = false;
    }
  }, everyMs);
}
