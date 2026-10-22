import { Router } from 'express';
import { z } from 'zod';
import { LedgerError, prisma, startFunding, startLiquidation } from '@kubepay/db';
import { createOrder, getSubscription } from '@kubepay/paypal';
import {
  compilePolicy, evaluate, PolicyCompileError, PolicySchema, SpendRequestSchema, toCents, type Policy,
} from '@kubepay/policy';
import { emit } from '../events.ts';
import { HttpError, requireInternalKey } from '../http.ts';
import { runAgentForVault, startWatching, stopWatching } from '../services/agent-runs.ts';
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
  const vaults = await prisma.vault.findMany({
    orderBy: { createdAt: 'desc' },
    include: { policies: { orderBy: { version: 'desc' }, take: 1 } },
  });
  res.json(vaults.map(({ policies, ...v }) => ({ ...v, policy: policies[0]?.policyJson })));
});

vaultsRouter.get('/:id', async (req, res) => {
  const { vault, policy } = await loadVault(req.params.id);
  const [ledger, decisions] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { vaultId: vault.id }, orderBy: { createdAt: 'desc' }, include: { merchant: true } }),
    prisma.decision.findMany({ where: { vaultId: vault.id }, orderBy: { createdAt: 'desc' } }),
  ]);
  const { policies, ...rest } = vault;
  res.json({ ...rest, policy, ledger, decisions });
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
  const verdict = evaluate(vault, policy, request, await buildEngineContext(vault, request));

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
