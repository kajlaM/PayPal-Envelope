import { runDueAgents } from './agent-runs.ts';
import { sweepOnce } from './sweeper.ts';

// Background jobs (Steps 8 + 10), one tick per minute:
//   1. sweeper: settle payouts, close expired vaults, refund their balance
//   2. watch mode: run shopping agents whose next check is due
// The API runs the tick itself. A Render Cron Job (apps/sweeper) can call POST /api/jobs/tick
// instead; set BACKGROUND_JOBS=off on the API then. Running both is safe, just wasteful.

export async function tick() {
  const swept = await sweepOnce();
  const agentsRun = await runDueAgents();
  return { swept, agentsRun };
}

export function startBackgroundJobs(everyMs = 60_000) {
  if (process.env.BACKGROUND_JOBS?.trim().toLowerCase() === 'off') return;
  let busy = false;
  setInterval(async () => {
    if (busy) return; // previous tick still running (e.g. a long agent run)
    busy = true;
    try {
      const { swept, agentsRun } = await tick();
      for (const s of swept) console.log(`[sweeper] vault ${s.vaultId}: ${s.action}`);
      if (agentsRun.length) console.log(`[watch] ran agents for ${agentsRun.join(', ')}`);
    } catch (err) {
      console.error('Background tick failed:', (err as Error).message);
    } finally {
      busy = false;
    }
  }, everyMs);
}
