import { Router } from 'express';
import { z } from 'zod';
import { changeVaultPolicy, LedgerError, prisma, startFunding, startLiquidation } from '@kubepay/db';
import { createOrder, getSubscription } from '@kubepay/paypal';
import {
  compilePolicy, evaluate, PolicyCompileError, PolicySchema, SpendRequestSchema, toCents, type Policy,
} from '@kubepay/policy';
import { emit } from '../events.ts';
import { HttpError, requireInternalKey } from '../http.ts';
import { runAgentForVault, runUsesOldPolicy, startWatching, stopWatching } from '../services/agent-runs.ts';
import { finishFunding } from '../services/funding.ts';
import { executeSpend } from '../services/spend.ts';
import { payOutLiquidation, syncPendingPayouts } from '../services/payouts.ts';
import { buildEngineContext } from '../services/policy-context.ts';

export const vaultsRouter = Router();

async function loadVault(id: string) {
  const vault = await prisma.vault.findUnique({
    where: { id },
    include: { policies: { orderBy: { version: 'desc' }, take: 1 }, user: true },
  });
  if (!vault) throw new HttpError(404, 'VAULT_NOT_FOUND');
  const policy = PolicySchema.parse(vault.policies[0]?.policyJson);
  return { vault, policy };
}

// ---------- Read ----------

vaultsRouter.get('/', async (_req, res) => {
  const [vaults, sums] = await Promise.all([
    prisma.vault.findMany({
      orderBy: { createdAt: 'desc' },
      include: { policies: { orderBy: { version: 'desc' }, take: 1 } },
    }),
    // Money in / out per vault, for summaries (vault history). Failed entries never moved money.
    prisma.ledgerEntry.groupBy({ by: ['vaultId', 'type'], where: { status: { not: 'FAILED' } }, _sum: { amountCents: true } }),
  ]);
  const total = (vaultId: string, type: 'FUND' | 'SPEND' | 'LIQUIDATE') =>
    sums.find((row) => row.vaultId === vaultId && row.type === type)?._sum.amountCents ?? 0;
  res.json(vaults.map(({ policies, ...v }) => ({
    ...v,
    policy: policies[0]?.policyJson,
    policyVersion: policies[0]?.version,
    totals: { paidInCents: total(v.id, 'FUND'), spentCents: total(v.id, 'SPEND'), refundedCents: total(v.id, 'LIQUIDATE') },
  })));
});

vaultsRouter.get('/:id', async (req, res) => {
  const { vault, policy } = await loadVault(req.params.id);
  const [ledger, decisions, policyHistory] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { vaultId: vault.id }, orderBy: { createdAt: 'desc' }, include: { merchant: true } }),
    prisma.decision.findMany({ where: { vaultId: vault.id }, orderBy: { createdAt: 'desc' } }),
    prisma.policy.findMany({
      where: { vaultId: vault.id },
      orderBy: { version: 'desc' },
      select: { version: true, createdAt: true, sourceText: true, policyJson: true },
    }),
  ]);
  const { policies, ...rest } = vault;
  res.json({ ...rest, policy, ledger, decisions, policyHistory });
});

// ---------- Create ----------

// Step 1 of creating a vault: plain English -> policy preview. Nothing is saved.
vaultsRouter.post('/compile', async (req, res) => {
  const { text } = z.object({ text: z.string().min(5).max(1000) }).parse(req.body);
  const merchants = await prisma.merchant.findMany({ where: { approved: true }, select: { name: true, category: true } });
  try {
    res.json(await compilePolicy(text, merchants));
  } catch (err) {
    if (err instanceof PolicyCompileError) throw new HttpError(422, 'POLICY_NOT_UNDERSTOOD', { message: err.message });
    throw err;
  }
});

// Step 2: the user confirmed the (possibly edited) policy -> save the vault.
const CreateVaultBody = z.object({
  policy: PolicySchema,
  sourceText: z.string().max(1000).optional(),
  userId: z.string().optional(),
});

vaultsRouter.post('/', async (req, res) => {
  const body = CreateVaultBody.parse(req.body);
  const policy: Policy = body.policy;

  if (new Date(policy.rules.expiry_timestamp) <= new Date()) throw new HttpError(400, 'EXPIRY_IN_PAST');
  if (policy.rules.max_single_transaction > policy.allocated_budget) throw new HttpError(400, 'MAX_TX_ABOVE_BUDGET');

  const user = body.userId
    ? await prisma.user.findUniqueOrThrow({ where: { id: body.userId } })
    : await prisma.user.findFirstOrThrow({ orderBy: { createdAt: 'asc' } }); // demo user

  const vault = await prisma.vault.create({
    data: {
      userId: user.id,
      name: policy.vault_name,
      type: policy.vault_type,
      budgetCents: toCents(policy.allocated_budget),
      expiresAt: new Date(policy.rules.expiry_timestamp),
      policies: { create: { version: 1, policyJson: policy, sourceText: body.sourceText } },
    },
  });
  emit('vault:updated', { vaultId: vault.id });
  res.status(201).json(vault);
});

// ---------- Change policy ----------

// The user changed what an active vault is for, and maybe its amount. Saved as the next policy
// version (earlier versions stay as history). A lower amount refunds the difference right away;
// a higher amount must be paid in first (FUND entry for the difference). `dryRun` only checks the
// change and says how much money moves.
const ChangePolicyBody = z.object({
  policy: PolicySchema,
  sourceText: z.string().max(1000).optional(),
  dryRun: z.boolean().optional(),
});

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

vaultsRouter.post('/:id/policy', async (req, res) => {
  const body = ChangePolicyBody.parse(req.body);
  const { vault, policy: current } = await loadVault(req.params.id);
  const next: Policy = body.policy;

  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE', { message: 'Only an active vault can be changed.' });
  if (next.vault_type !== current.vault_type) {
    const kind = current.vault_type === 'UTILITY' ? 'bill-payment' : 'shopping';
    throw new HttpError(400, 'VAULT_TYPE_CHANGED', { message: `This is a ${kind} vault. Describe a ${kind} task, or create a new vault.` });
  }
  if (new Date(next.rules.expiry_timestamp) <= new Date()) throw new HttpError(400, 'EXPIRY_IN_PAST', { message: 'The new end date is in the past.' });
  if (next.rules.max_single_transaction > next.allocated_budget) throw new HttpError(400, 'MAX_TX_ABOVE_BUDGET');

  const budgetCents = toCents(next.allocated_budget);
  const spentCents = vault.budgetCents - vault.balanceCents; // includes payments still in flight
  if (budgetCents < spentCents) {
    throw new HttpError(409, 'AMOUNT_BELOW_SPENT', { message: `This vault already spent ${dollars(spentCents)}, so its amount can't go below that.` });
  }
  const changeCents = budgetCents - vault.budgetCents;
  if (body.dryRun) return res.json({ changeCents, budgetCents, spentCents });

  const saved = await changeVaultPolicy(vault.id, {
    policyJson: next,
    sourceText: body.sourceText,
    name: next.vault_name,
    expiresAt: new Date(next.rules.expiry_timestamp),
    budgetCents,
  }).catch((err) => {
    if (err instanceof LedgerError && err.code === 'PENDING_SPENDS') {
      throw new HttpError(409, 'PAYMENT_IN_FLIGHT', { message: 'A payment from this vault is still in progress. Try again in a minute.' });
    }
    if (err instanceof LedgerError && err.code === 'TOP_UP_NOT_PAID') {
      throw new HttpError(402, 'TOP_UP_NOT_PAID', { message: `Pay the extra ${dollars(changeCents)} into the vault first.` });
    }
    throw err;
  });

  // Purchases waiting for approval were found under the old rules.
  const cancelled = await prisma.decision.updateMany({
    where: { vaultId: vault.id, result: 'NEEDS_HUMAN', resolvedBy: null },
    data: { resolvedBy: 'CANCELLED_POLICY_CHANGED' },
  });

  let refundError: string | undefined;
  if (saved.refund) {
    // A rejected payout puts the money (and the amount) back into the vault (failOutflow).
    await payOutLiquidation(saved.refund.id).catch((err) => {
      refundError = err instanceof Error ? err.message : String(err);
    });
  }

  await startWatching(vault.id); // shopping vaults: the agent looks again, with the new rules
  emit('vault:updated', { vaultId: vault.id });
  emit('ledger:updated', { vaultId: vault.id });
  res.json({
    vault: await prisma.vault.findUniqueOrThrow({ where: { id: vault.id } }),
    version: saved.policy.version,
    changeCents,
    refund: saved.refund,
    refundError,
    cancelledApprovals: cancelled.count,
  });
});

// ---------- Fund (Orders API + JS SDK button) ----------

vaultsRouter.post('/:id/fund/order', async (req, res) => {
  const { vault } = await loadVault(req.params.id);
  if (vault.status !== 'PENDING_FUNDING') throw new HttpError(409, 'VAULT_ALREADY_FUNDED');

  const order = await createOrder({
    vaultId: vault.id,
    amountCents: vault.budgetCents,
    description: `Fund KubePay vault: ${vault.name}`,
    requestId: `fund-${vault.id}`,
  });
  // Same request id returns the same order, so only record it once.
  const known = await prisma.ledgerEntry.findUnique({ where: { paypalRef: order.orderId } });
  if (!known) await startFunding(vault.id, vault.budgetCents, order.orderId);
  res.json(order);
});

vaultsRouter.post('/:id/fund/capture', async (req, res) => {
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
  const entry = await prisma.ledgerEntry.findUnique({ where: { paypalRef: orderId } });
  if (!entry || entry.vaultId !== req.params.id || entry.type !== 'FUND') throw new HttpError(404, 'ORDER_NOT_FOR_THIS_VAULT');
  const { vault } = await finishFunding(orderId);
  res.json(vault);
});

// ---------- Subscribe (utility vault monthly top-up) ----------

vaultsRouter.post('/:id/subscribe', async (req, res) => {
  const { vault } = await loadVault(req.params.id);
  if (vault.type !== 'UTILITY') throw new HttpError(409, 'ONLY_UTILITY_VAULTS_SUBSCRIBE');
  const planId = process.env.PAYPAL_UTILITY_PLAN_ID;
  if (!planId) throw new HttpError(500, 'PAYPAL_UTILITY_PLAN_ID_MISSING');
  // The JS SDK button calls actions.subscription.create({ plan_id: planId, custom_id: vault.id }).
  res.json({ planId, customId: vault.id });
});

vaultsRouter.post('/:id/subscribe/confirm', async (req, res) => {
  const { subscriptionId } = z.object({ subscriptionId: z.string() }).parse(req.body);
  const sub = await getSubscription(subscriptionId);
  if (sub.vaultId !== req.params.id || sub.planId !== process.env.PAYPAL_UTILITY_PLAN_ID) {
    throw new HttpError(409, 'SUBSCRIPTION_NOT_FOR_THIS_VAULT');
  }
  const vault = await prisma.vault.update({ where: { id: req.params.id }, data: { paypalSubscriptionId: sub.subscriptionId } });
  emit('vault:updated', { vaultId: vault.id });
  // Money arrives with each PAYMENT.SALE.COMPLETED webhook (Step 9).
  res.json({ vault, subscriptionStatus: sub.status });
});

// ---------- Spend (agents only) ----------

vaultsRouter.post<{ id: string }>('/:id/spend', requireInternalKey, async (req, res) => {
  const request = SpendRequestSchema.parse(req.body);
  const { vault, policy } = await loadVault(req.params.id);
  // The user changed the rules while this agent run was searching: it was looking for the old thing.
  const verdict = runUsesOldPolicy(vault.id, vault.policies[0]?.version ?? 0)
    ? { result: 'BLOCK' as const, reasons: ['POLICY_CHANGED'] }
    : evaluate(vault, policy, request, await buildEngineContext(vault, request));

  let decision = await prisma.decision.create({
    data: { vaultId: vault.id, requestJson: request, result: verdict.result, reasons: verdict.reasons },
  });
  emit('decision:created', { vaultId: vault.id, decisionId: decision.id, result: decision.result });

  if (decision.result !== 'APPROVE') return res.status(decision.result === 'BLOCK' ? 403 : 202).json({ decision });

  try {
    const { ledgerEntry, payout } = await executeSpend(decision.id);
    res.json({ decision, ledgerEntry, payout });
  } catch (err) {
    // Lost a race with another spend (e.g. balance just ran out): record it as a block.
    if (err instanceof LedgerError) {
      decision = await prisma.decision.update({ where: { id: decision.id }, data: { result: 'BLOCK', reasons: [err.code] } });
      emit('decision:created', { vaultId: vault.id, decisionId: decision.id, result: decision.result });
      return res.status(403).json({ decision });
    }
    // Failed before any money was held (e.g. database down): don't leave an APPROVE that never paid.
    const held = await prisma.ledgerEntry.findUnique({ where: { decisionId: decision.id } }).catch(() => null);
    if (!held) {
      await prisma.decision
        .update({ where: { id: decision.id }, data: { result: 'BLOCK', reasons: ['SYSTEM_ERROR'] } })
        .catch(() => undefined);
    }
    throw err;
  }
});

// ---------- Run the vault's AI agent (Step 8) ----------

// Runs the shopping or bill-pay agent inside this vault now. Each tool call is streamed to the
// dashboard as an agent:step event; the agent spends only through POST /:id/spend above.
// A shopping run that finds nothing (NO_MATCH) is retried automatically until expiry (watch mode).
vaultsRouter.post('/:id/agent', async (req, res) => {
  const { task } = z.object({ task: z.string().max(500).optional() }).parse(req.body ?? {});
  const { vault } = await loadVault(req.params.id);
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE');
  res.json(await runAgentForVault(vault.id, task));
});

vaultsRouter.post('/:id/agent/stop', async (req, res) => {
  await stopWatching(req.params.id);
  res.json({ ok: true });
});

// ---------- Human approval of NEEDS_HUMAN decisions ----------

vaultsRouter.post('/:id/decisions/:decisionId/approve', async (req, res) => {
  const decision = await prisma.decision.findUniqueOrThrow({ where: { id: req.params.decisionId } });
  if (decision.vaultId !== req.params.id || decision.result !== 'NEEDS_HUMAN' || decision.resolvedBy) {
    throw new HttpError(409, 'DECISION_NOT_PENDING');
  }
  // Re-check the hard rules (the vault may have changed since). The human overrides only the soft flags.
  const { vault, policy } = await loadVault(req.params.id);
  const request = SpendRequestSchema.parse(decision.requestJson);
  const recheck = evaluate(vault, policy, request, await buildEngineContext(vault, request), { ignoreSoft: true });
  if (recheck.result === 'BLOCK') throw new HttpError(409, 'NOW_BLOCKED', { reasons: recheck.reasons });

  // Only one approval wins if the button is clicked twice.
  const claimed = await prisma.decision.updateMany({
    where: { id: decision.id, resolvedBy: null },
    data: { resolvedBy: 'APPROVED_BY_HUMAN' },
  });
  if (claimed.count === 0) throw new HttpError(409, 'DECISION_NOT_PENDING');
  emit('decision:created', { vaultId: decision.vaultId, decisionId: decision.id, result: 'APPROVED_BY_HUMAN' });
  const result = await executeSpend(decision.id);
  res.json(result);
});

vaultsRouter.post('/:id/decisions/:decisionId/reject', async (req, res) => {
  const decision = await prisma.decision.findUniqueOrThrow({ where: { id: req.params.decisionId } });
  if (decision.vaultId !== req.params.id || decision.result !== 'NEEDS_HUMAN' || decision.resolvedBy) {
    throw new HttpError(409, 'DECISION_NOT_PENDING');
  }
  const updated = await prisma.decision.update({ where: { id: decision.id }, data: { resolvedBy: 'REJECTED_BY_HUMAN' } });
  await startWatching(decision.vaultId); // shopping vaults: look for something else
  emit('decision:created', { vaultId: decision.vaultId, decisionId: decision.id, result: 'BLOCK' });
  res.json(updated);
});

// ---------- Liquidate + sync ----------

vaultsRouter.post('/:id/liquidate', async (req, res) => {
  await syncPendingPayouts(req.params.id); // settle finished spends first
  const entry = await startLiquidation(req.params.id);
  const payout = entry ? await payOutLiquidation(entry.id) : null;
  const vault = await prisma.vault.findUniqueOrThrow({ where: { id: req.params.id } });
  emit('vault:updated', { vaultId: vault.id });
  res.json({ vault, ledgerEntry: entry, payout });
});

vaultsRouter.post('/:id/sync', async (req, res) => {
  res.json(await syncPendingPayouts(req.params.id));
});
