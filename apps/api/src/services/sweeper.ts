import { failFunding, LedgerError, prisma, startLiquidation } from '@kubepay/db';
import { PolicySchema } from '@kubepay/policy';
import { emit } from '../events.ts';
import { resumeStuckCheckouts, syncPendingCheckouts } from './checkout.ts';
import { cancelOpenFundRequests, syncFundRequests } from './fund-requests.ts';
import { payOutLiquidation, resumeStuckPayouts, syncPendingPayouts } from './payouts.ts';

// Expiry sweeper (Step 10). Runs every minute: settles payouts, then closes expired vaults and
// sends the unused money back to the user. Every step is safe to repeat on the next run.

const MAX_REFUND_ATTEMPTS = 3;

export type SweepResult = { vaultId: string; action: string };

export async function sweepOnce(now = new Date()): Promise<SweepResult[]> {
  const results: SweepResult[] = [];

  // 1. Settle payouts that finished (webhook backup), so expired vaults are not held up by them.
  await resumeStuckPayouts().catch((err) => console.error('Sweeper: resume payouts failed:', (err as Error).message));
  await syncPendingPayouts().catch((err) => console.error('Sweeper: payout sync failed:', (err as Error).message));
  await resumeStuckCheckouts().catch((err) => console.error('Sweeper: resume Checkout purchases failed:', (err as Error).message));
  await syncPendingCheckouts().catch((err) => console.error('Sweeper: Checkout sync failed:', (err as Error).message));
  // "Ask a friend": credit vaults whose friend paid (webhook backup), before unfunded ones expire.
  await syncFundRequests().catch((err) => console.error('Sweeper: money request sync failed:', (err as Error).message));

  // 2. Never funded: cancel the open order so a late approval is not captured into a dead vault.
  const unfunded = await prisma.vault.findMany({ where: { status: 'PENDING_FUNDING', expiresAt: { lt: now } } });
  for (const vault of unfunded) {
    // A friend asked to fund it can no longer pay. If they just paid, the vault is funded instead.
    const asked = await cancelOpenFundRequests(vault.id, 'The vault expired before it was funded.').catch((err) => {
      console.error(`Sweeper: cancelling money requests of vault ${vault.id} failed:`, (err as Error).message);
      return null;
    });
    if (asked === null) continue; // try again on the next run
    if (asked.some((r) => r.status === 'PAID')) {
      results.push({ vaultId: vault.id, action: 'funded by a friend at the last moment' });
      continue;
    }
    const orders = await prisma.ledgerEntry.findMany({ where: { vaultId: vault.id, type: 'FUND', status: 'PENDING' } });
    for (const o of orders) if (o.paypalRef) await failFunding(o.paypalRef, 'vault expired before funding');
    await prisma.vault.update({ where: { id: vault.id }, data: { status: 'EXPIRED', nextAgentRunAt: null } });
    emit('vault:updated', { vaultId: vault.id });
    results.push({ vaultId: vault.id, action: 'expired before funding' });
  }

  // 3. Expired with money in it (ACTIVE, still SAVING, or EXPIRED after a failed refund): refund the balance.
  const expired = await prisma.vault.findMany({
    where: {
      expiresAt: { lt: now },
      OR: [{ status: 'ACTIVE' }, { status: 'SAVING' }, { status: 'EXPIRED', balanceCents: { gt: 0 } }],
    },
    include: { policies: { orderBy: { version: 'desc' }, take: 1 } },
  });
  for (const vault of expired) {
    results.push({ vaultId: vault.id, action: await refundVault(vault) });
  }
  return results;
}

async function refundVault(vault: { id: string; status: string; policies: { policyJson: unknown }[] }): Promise<string> {
  await prisma.vault.update({ where: { id: vault.id }, data: { nextAgentRunAt: null, nextChargeAt: null } }); // stop the agent and savings payments

  const policy = PolicySchema.safeParse(vault.policies[0]?.policyJson);
  if (policy.success && !policy.data.liquidation.auto_refund) {
    if (vault.status === 'ACTIVE' || vault.status === 'SAVING') {
      await prisma.vault.update({ where: { id: vault.id }, data: { status: 'EXPIRED' } });
      emit('vault:updated', { vaultId: vault.id });
    }
    return 'expired; auto refund is off (use POST /api/vaults/:id/liquidate)';
  }

  const failures = await prisma.ledgerEntry.count({ where: { vaultId: vault.id, type: 'LIQUIDATE', status: 'FAILED' } });
  if (failures >= MAX_REFUND_ATTEMPTS) return `refund failed ${failures} times; needs a human`;

  try {
    const entry = await startLiquidation(vault.id);
    if (!entry) {
      emit('vault:updated', { vaultId: vault.id });
      return 'expired with no balance: closed';
    }
    const payout = await payOutLiquidation(entry.id);
    return `refund of $${(entry.amountCents / 100).toFixed(2)} sent (payout ${payout.payoutBatchId})`;
  } catch (err) {
    if (err instanceof LedgerError && err.code === 'PENDING_SPENDS') return 'waiting: a payment is still in flight';
    console.error(`Sweeper: refund for vault ${vault.id} failed:`, (err as Error).message);
    return `refund failed: ${(err as Error).message}`;
  }
}
