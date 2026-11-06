import { prisma } from '@paypalvault/db';
import { runVaultAgent } from '@paypalvault/agents';
import { itemProgress, listItems, PolicySchema } from '@paypalvault/policy';
import { emit } from '../events.ts';
import { HttpError } from '../http.ts';
import { itemSpentCents } from './policy-context.ts';

// Runs vault agents and keeps shopping vaults in "watch mode": if nothing could be bought,
// the agent looks again every check_every_minutes until the vault expires.

const running = new Map<string, number>(); // vaultId -> policy version the current run started with

const latestPolicyVersion = async (vaultId: string) =>
  (await prisma.policy.findFirst({ where: { vaultId }, orderBy: { version: 'desc' }, select: { version: true } }))?.version ?? 0;

/**
 * True while a run that started under older rules is still going (the user changed the policy
 * mid-run). The spend route blocks its purchases: it was looking for the old thing.
 */
export function runUsesOldPolicy(vaultId: string, latestVersion: number) {
  const started = running.get(vaultId);
  return started !== undefined && started < latestVersion;
}

export async function runAgentForVault(vaultId: string, task?: string) {
  if (running.has(vaultId)) throw new HttpError(409, 'AGENT_ALREADY_RUNNING');
  running.set(vaultId, Number.MAX_SAFE_INTEGER); // claim the slot before the first await
  try {
    const startedWith = await latestPolicyVersion(vaultId);
    running.set(vaultId, startedWith);
    const run = await runVaultAgent({
      vaultId,
      task,
      onStep: (step) => emit('agent:step', { vaultId, ...step }),
    }).catch(async (err) => {
      await scheduleNext(vaultId, 'ERROR', startedWith);
      throw err;
    });
    await scheduleNext(vaultId, run.outcome, startedWith);
    return run;
  } finally {
    running.delete(vaultId);
  }
}

/**
 * After a run: BOUGHT / NEEDS_HUMAN stop watching; NO_MATCH, WAITING_FOR_PRICE (price above its
 * 90-day normal, per Channel3) or ERROR look again later.
 * If the rules changed during the run, look again right away with the new rules.
 */
async function scheduleNext(vaultId: string, outcome: string, startedWith: number) {
  const vault = await prisma.vault.findUniqueOrThrow({
    where: { id: vaultId },
    include: { policies: { orderBy: { version: 'desc' }, take: 1 } },
  });
  const policy = PolicySchema.safeParse(vault.policies[0]?.policyJson);
  let next: Date | null = null;
  const rulesChanged = (vault.policies[0]?.version ?? 0) > startedWith;
  if (rulesChanged && vault.status === 'ACTIVE' && vault.expiresAt > new Date()) {
    next = new Date(); // the scheduler starts a fresh run within a minute
  } else if (vault.type === 'SHOPPING' && vault.status === 'ACTIVE' && (outcome === 'NO_MATCH' || outcome === 'WAITING_FOR_PRICE' || outcome === 'ERROR')) {
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

/** Shopping lists: after a purchase, the agent goes on to the items still to buy. Other vaults are done. */
export async function continueShoppingList(vaultId: string) {
  const vault = await prisma.vault.findUniqueOrThrow({ where: { id: vaultId }, include: { policies: { orderBy: { version: 'desc' }, take: 1 } } });
  const policy = PolicySchema.safeParse(vault.policies[0]?.policyJson);
  if (!policy.success || listItems(policy.data).length === 0) return;
  if (itemProgress(policy.data, vault.balanceCents, await itemSpentCents(vaultId)).some((i) => !i.bought)) await startWatching(vaultId);
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
