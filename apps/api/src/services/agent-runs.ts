import { prisma } from '@kubepay/db';
import { runVaultAgent } from '@kubepay/agents';
import { PolicySchema } from '@kubepay/policy';
import { emit } from '../events.ts';
import { HttpError } from '../http.ts';

// Runs vault agents and keeps shopping vaults in "watch mode": if nothing could be bought,
// the agent looks again every check_every_minutes until the vault expires.

const running = new Set<string>();

export async function runAgentForVault(vaultId: string, task?: string) {
  if (running.has(vaultId)) throw new HttpError(409, 'AGENT_ALREADY_RUNNING');
  running.add(vaultId);
  try {
    const run = await runVaultAgent({
      vaultId,
      task,
      onStep: (step) => emit('agent:step', { vaultId, ...step }),
    }).catch(async (err) => {
      await scheduleNext(vaultId, 'ERROR');
      throw err;
    });
    await scheduleNext(vaultId, run.outcome);
    return run;
  } finally {
    running.delete(vaultId);
  }
}

/** After a run: BOUGHT / NEEDS_HUMAN stop watching; NO_MATCH or ERROR look again later. */
async function scheduleNext(vaultId: string, outcome: string) {
  const vault = await prisma.vault.findUniqueOrThrow({
    where: { id: vaultId },
    include: { policies: { orderBy: { version: 'desc' }, take: 1 } },
  });
  const policy = PolicySchema.safeParse(vault.policies[0]?.policyJson);
  let next: Date | null = null;
  if (vault.type === 'SHOPPING' && vault.status === 'ACTIVE' && (outcome === 'NO_MATCH' || outcome === 'ERROR')) {
    const minutes = (policy.success && policy.data.shopping?.check_every_minutes) || 180;
    const at = new Date(Date.now() + minutes * 60_000);
    if (at < vault.expiresAt) next = at; // never past expiry; the sweeper refunds expired vaults
  }
  await prisma.vault.update({
    where: { id: vaultId },
    data: { lastAgentRunAt: new Date(), lastAgentOutcome: outcome, nextAgentRunAt: next },
  });
  emit('vault:updated', { vaultId, agentOutcome: outcome, nextAgentRunAt: next });
}

/** Ask the watcher to run the shopping agent soon (after funding, or after a human rejects its pick). */
export async function startWatching(vaultId: string) {
  await prisma.vault.updateMany({
    where: { id: vaultId, type: 'SHOPPING', status: 'ACTIVE' },
    data: { nextAgentRunAt: new Date() },
  });
}

export async function stopWatching(vaultId: string) {
  await prisma.vault.update({ where: { id: vaultId }, data: { nextAgentRunAt: null } });
  emit('vault:updated', { vaultId, nextAgentRunAt: null });
}

/** Runs every agent whose check time has come. Called by the background tick (scheduler.ts). */
export async function runDueAgents() {
  const now = new Date();
  const due = await prisma.vault.findMany({
    where: { status: 'ACTIVE', nextAgentRunAt: { lte: now }, expiresAt: { gt: now } },
    select: { id: true },
    orderBy: { nextAgentRunAt: 'asc' },
    take: 10,
  });
  const ran: string[] = [];
  for (const { id } of due) {
    // Claim it, so a second server or cron does not run the same vault.
    const claimed = await prisma.vault.updateMany({ where: { id, nextAgentRunAt: { lte: now } }, data: { nextAgentRunAt: null } });
    if (claimed.count === 0 || running.has(id)) continue;
    ran.push(id);
    await runAgentForVault(id).catch((err) => console.error(`Watch run for vault ${id} failed:`, (err as Error).message));
  }
  return ran;
}
